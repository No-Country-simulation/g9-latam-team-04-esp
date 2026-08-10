"""
Gestión del reentrenamiento de modelos en subproceso.

El API nunca entrena ``inline`` (eso comería CPU/RAM del proceso web). En su
lugar, detecta si hay feedback nuevo y, si lo hay, lanza ``reentrenar.py`` como
subproceso. Cuando este termina, se recarga el modelo en caliente.

Estado de "qué ya se entrenó" se persiste en un pequeño archivo JSON dentro de
``feedback_dir`` para sobrevivir a reinicios (evita re-entrenar a ciegas).
"""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import sys
import threading
import time
from pathlib import Path

from ..core.config import settings

logger = logging.getLogger(__name__)

_ARCHIVO_ESTADO = ".reentrenador_state.json"


class ReentrenadorManager:
    """Coordina el subproceso de reentrenamiento y su estado."""

    def __init__(self) -> None:
        self._proc: subprocess.Popen | None = None
        self._lock = threading.Lock()
        self._last_exit_code: int | None = None
        self._last_error: str | None = None
        self._last_output: str | None = None
        self._last_resumen: dict = {}
        self._idiomas_lanzados: list[str] = []

    # ── Estado (para health y endpoints)

    @property
    def estado(self) -> str:
        if self._proc is not None and self._proc.poll() is None:
            return "running"
        return "idle"

    @property
    def last_exit_code(self) -> int | None:
        return self._last_exit_code

    @property
    def last_error(self) -> str | None:
        return self._last_error

    @property
    def last_output(self) -> str | None:
        """Salida completa (texto) del último reentrenamiento capturada del subproceso."""
        return self._last_output

    @property
    def resumen(self) -> dict:
        """Resumen estructurado del último run (para exponer sin parsear texto)."""
        base = {
            "estado": self.estado,
            "exit_code": self._last_exit_code,
            "error": self._last_error,
        }
        base.update(self._last_resumen or {})
        return base

    # ── Resumen estructurado (para /health y /modelos/reentrenar/estado)

    @staticmethod
    def _parsear_resumen(output: str | None, exit_code: int | None) -> dict:
        """Extrae campos legibles del output de reentrenar.py.

        Devuelve un dict SIMPLE (f1 nuevo/vigente, mejora mínima, diferencia,
        veredicto y motivo) que cualquier cliente puede leer sin parsear texto.
        Si no se encuentran campos, quedan None.
        """
        resumen: dict = {
            "tipo": "ok" if exit_code == 0 else ("abortado" if exit_code in (2, 3) else "desconocido"),
            "f1_nuevo": None,
            "f1_vigente": None,
            "f1_mejora_minima": None,
            "f1_diferencia": None,
            "motivo": None,
        }
        if not output:
            return resumen

        def _extraer_num(patron: str) -> float | None:
            m = re.search(patron, output, flags=re.IGNORECASE)
            if not m:
                return None
            try:
                return float(m.group(1))
            except ValueError:
                return None

        resumen["f1_nuevo"] = _extraer_num(r"F1 macro NUEVO[^:]*:\s*([\d.]+)")
        resumen["f1_vigente"] = _extraer_num(r"F1 macro VIGENTE[^:]*:\s*([\d.]+)")
        resumen["f1_mejora_minima"] = _extraer_num(r"Mejora mínima requerida:\s*\+?\s*([\d.]+)")
        resumen["f1_diferencia"] = _extraer_num(r"Diferencia:\s*(-?\d+\.?\d*)")
        # Motivo: la frase del veredicto (tras "métricas:") o el índice [ERROR]
        # p. ej. "el nuevo es MEJOR, pero no alcanza la mejora mínima requerida"
        motivo = re.search(r"\[ABORT\][^\n]+:\s*(.+)", output)
        if motivo:
            resumen["motivo"] = motivo.group(1).strip()
        else:
            error = re.search(r"\[(?:ERROR|ABORT)\][^\n]*", output)
            if error:
                resumen["motivo"] = error.group(0).strip()

        # El veredicto amigable es la primera línea [ABORT]
        veredicto = re.search(r"\[ABORT\] (.+)", output, flags=re.IGNORECASE)
        resumen["veredicto"] = veredicto.group(1).strip() if veredicto else None
        return resumen

    # ── Detección de feedback nuevo

    def _archivo_feedback(self) -> Path | None:
        """Primer CSV de feedback encontrado en feedback_dir (o None)."""
        if not settings.feedback_dir.exists():
            return None
        csvs = sorted(settings.feedback_dir.glob("*.csv"))
        return csvs[0] if csvs else None

    def _firma_por_idioma(self, idioma: str) -> str | None:
        """Firma del feedback de UN idioma (mtime_ns + tamaño).

        Detecta tanto sobrescribir el CSV como agregar filas (cambia el tamaño).
        Devuelve None si el CSV no existe aún.
        """
        archivo = settings.feedback_dir / f"dataset_feedback_{idioma}.csv"
        try:
            stat = archivo.stat()
        except FileNotFoundError:
            return None
        return f"{archivo.name}={stat.st_mtime_ns}:{stat.st_size}"

    def firmas_por_idioma(self) -> dict[str, str | None]:
        """Firma actual de cada idioma (es y en)."""
        return {idioma: self._firma_por_idioma(idioma) for idioma in ("es", "en")}

    def _read_state(self) -> dict:
        path = settings.feedback_dir / _ARCHIVO_ESTADO
        try:
            if path.exists():
                return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            logger.exception("No se pudo leer el estado de reentrenamiento")
        return {}

    def _write_state(self, data: dict) -> None:
        settings.feedback_dir.mkdir(parents=True, exist_ok=True)
        (settings.feedback_dir / _ARCHIVO_ESTADO).write_text(
            json.dumps(data), encoding="utf-8"
        )

    def idiomas_pendientes(self) -> list[str]:
        """Idiomas cuyo feedback cambió desde el último reentrenamiento."""
        pendientes: list[str] = []
        estado = self._read_state()
        for idioma in ("es", "en"):
            firma = self._firma_por_idioma(idioma)
            if firma is None:
                continue  # el CSV no existe todavía: nada que entrenar
            clave = f"feedback_firma_{idioma}"
            if estado.get(clave) != firma:
                pendientes.append(idioma)
        return pendientes

    def hay_feedback_nuevo(self) -> bool:
        """True si ALGÚN idioma tiene feedback nuevo por entrenar."""
        return bool(self.idiomas_pendientes())

    def _baseline(self) -> None:
        """Primer arranque: registra la firma actual sin entrenar."""
        estado = self._read_state()
        if estado:
            return
        firmas = self.firmas_por_idioma()
        estado = {f"feedback_firma_{k}": v for k, v in firmas.items() if v is not None}
        if estado:
            self._write_state(estado)
            logger.info("Estado de reentrenamiento inicializado (baseline)")

    # ── Lanzamiento

    def lanzar(self, idiomas: list[str] | None = None) -> tuple[bool, str]:
        """Lanza el reentrenamiento de SOLO los idiomas con feedback pendiente.

        ``reentrenar.py`` reentrena UN idioma por invocación (posicional
        ``{en,es}``), así que se usa un pequeño controlador que lo llama una vez
        por idioma pendiente. Se entrena únicamente el idioma cuyo feedback
        cambió: el otro no se toca (no se re-sobrescribe ni se le hace backup).
        """
        pendientes = self.idiomas_pendientes() if idiomas is None else idiomas
        if not pendientes:
            return False, "No hay idiomas con feedback nuevo"
        if set(pendientes) - {"en", "es"}:
            return False, f"Idioma inválido: {pendientes}"

        # Ruta ABSOLUTA: el controlador se lanza con cwd=script.parent, así que
        # una ruta relativa rompería la resolución del script.
        script = Path(settings.retrain_script_path).resolve()
        if not script.exists():
            return False, f"Script no encontrado en {script}"
        if not isinstance(settings.retrain_min_feedback, int):
            return False, "TK_RETRAIN_MIN_FEEDBACK no es un entero"
        with self._lock:
            if self._proc is not None and self._proc.poll() is None:
                return False, "Ya hay un reentrenamiento en curso"
            comandos = [
                [sys.executable, str(script), idioma,
                 "--min-feedback", str(settings.retrain_min_feedback),
                 "--min-f1-improvement", str(settings.retrain_min_f1_improvement)]
                for idioma in pendientes
            ]
            controlador = (
                "import subprocess, sys\n"
                f"cmds = {comandos!r}\n"
                "codes = [subprocess.call(a) for a in cmds]\n"
                "sys.exit(0 if all(c == 0 for c in codes) else 1)\n"
            )
                        # PYTHONIOENCODING=utf-8: evita UnicodeEncodeError en consolas
            # Windows (cp1252) cuando el script imprime caracteres no-ASCII.
            env = os.environ.copy()
            env["PYTHONIOENCODING"] = "utf-8"
            self._proc = subprocess.Popen(
                [sys.executable, "-c", controlador],
                cwd=str(script.parent),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            self._last_exit_code = None
            self._last_error = None
            self._last_output = None
            self._idiomas_lanzados = sorted(pendientes)
        logger.info(
            "Reentrenamiento lanzado para %s (pid=%s)",
            "+".join(pendientes), self._proc.pid,
        )
        return True, "lanzado"

    def check_terminado(self) -> bool:
        """Devuelve True si el subproceso terminó. Actualiza el estado/exit code."""
        with self._lock:
            if self._proc is None:
                return True
            code = self._proc.poll()
            if code is None:
                return False  # sigue corriendo
            output = ""
            try:
                if self._proc.stdout is not None:
                    output = self._proc.stdout.read()
            except Exception:
                logger.exception("No se pudo leer la salida del reentrenamiento")
            self._last_output = (output or "").strip() or None
            self._last_exit_code = code
            self._last_resumen = self._parsear_resumen(self._last_output, code)
            self._proc = None
        idiomas = self._idiomas_lanzados or ["es", "en"]
        if code == 0:
            self._registrar_posentrenamiento(idiomas)
            if self._last_output:
                logger.info(
                    "Reentrenamiento OK (exit 0):\n%s", self._last_output
                )
        elif code in (2, 3):
            # Abortos CONTROLADOS: el script terminó a propósito porque no se
            # cumplió un umbral (feedback insuficiente o F1 peor). No es un
            # fallo de sistema; el detalle está en la salida capturada.
            self._last_error = f"reentrenar.py ABORTÓ (exit {code}): umbral no superado"
            logger.warning("Reentrenamiento ABORTADO (%s):\n%s", self._last_error, self._last_output or "(sin salida)")
            # Marcar la firma como procesada pese al abort, para no re-lanzar
            # el mismo intento en cada ciclo del bucle.
            self._registrar_procesado(idiomas)
        else:
            # Fallo REAL (exit 1 u otro inesperado): el script crasheó.
            self._last_error = f"reentrenar.py FALLÓ (exit {code})"
            logger.error("Reentrenamiento FALLÓ: %s\n%s", self._last_error, self._last_output or "(sin salida)")
            # Marcar la firma como procesada AUNQUE falle, para no re-lanzar el
            # mismo intento en cada ciclo del bucle. Solo un cambio real en el
            # feedback (nueva firma) vuelve a disparar.
            self._registrar_procesado(idiomas)
        self._idiomas_lanzados = []
        return True

    def _registrar_procesado(self, idiomas: list[str]) -> None:
        """Guarda la firma de feedback de cada idioma como conocida (sin entrenar)."""
        estado = self._read_state()
        for idioma in idiomas:
            firma = self._firma_por_idioma(idioma)
            if firma is not None:
                estado[f"feedback_firma_{idioma}"] = firma
        self._write_state(estado)

    def _registrar_posentrenamiento(self, idiomas: list[str]) -> None:
        """Tras un reentrenamiento exitoso, guarda la nueva firma del idioma."""
        estado = self._read_state()
        for idioma in idiomas:
            firma = self._firma_por_idioma(idioma)
            if firma is not None:
                estado[f"feedback_firma_{idioma}"] = firma
        estado["last_retrain_at"] = time.time()
        self._write_state(estado)
        logger.info("Reentrenamiento completado OK (%s)", "+".join(idiomas))


# Instancia única compartida por el bucle background y los endpoints
reentrenador = ReentrenadorManager()