"""
Telemetría en memoria de la API.

Registra cada request HTTP (método, endpoint, status, latencia) en memoria y
expone agregados para el endpoint ``GET /metrics``: total, latencia P95, tasa
de éxito, tráfico por endpoint, serie temporal y logs recientes.

Thread-safe: el middleware corre en el event loop, pero las llamadas a Oracle
se ejecutan en hilos (``asyncio.to_thread``) y pueden registrar métricas desde
otros hilos del pool de uvicorn; por eso todo el acceso al buffer va con lock.
"""
import threading
import time
import uuid
from collections import deque
from dataclasses import dataclass, field

MAX_EVENTOS = 500
MAX_SERIE = 60
MAX_LOGS = 10


@dataclass
class Telemetria:
    """Buffer circular de eventos de request, con agregados en memoria."""

    _lock: threading.Lock = field(default_factory=threading.Lock)
    eventos: deque = field(default_factory=lambda: deque(maxlen=MAX_EVENTOS))

    def registrar(
        self,
        method: str,
        endpoint: str,
        http_status: int,
        latencia_ms: float,
    ) -> None:
        """Registra un request HTTP completado."""
        with self._lock:
            self.eventos.append(
                {
                    "request_id": f"req_{uuid.uuid4().hex[:8]}",
                    "timestamp": int(time.time() * 1000),  # epoch ms (Date.now del navegador)
                    "method": method,
                    "endpoint": endpoint,
                    "http_status": http_status,
                    "latencia_ms": round(latencia_ms, 3),
                }
            )

    def limpiar(self) -> None:
        """Borra todos los eventos acumulados."""
        with self._lock:
            self.eventos.clear()

    def _p95(self, valores: list[float]) -> float:
        if not valores:
            return 0.0
        ordenados = sorted(valores)
        indice = min(len(ordenados) - 1, int(len(ordenados) * 0.95))
        return ordenados[indice]

    def snapshot(self) -> dict:
        """Devuelve el resumen agregado listo para ``GET /metrics``."""
        with self._lock:
            eventos = list(self.eventos)

        total = len(eventos)
        latencias = [e["latencia_ms"] for e in eventos]
        exitosos = sum(1 for e in eventos if e["http_status"] < 400)

        # Por endpoint (método + ruta), con su propio P95
        por_endpoint: dict[tuple[str, str], list[float]] = {}
        for e in eventos:
            clave = (e["method"], e["endpoint"])
            por_endpoint.setdefault(clave, []).append(e["latencia_ms"])

        endpoint_resumen = sorted(
            [
                {
                    "method": metodo,
                    "endpoint": ruta,
                    "count": len(latencias_ep),
                    "p95_ms": round(self._p95(latencias_ep), 3),
                }
                for (metodo, ruta), latencias_ep in por_endpoint.items()
            ],
            key=lambda x: x["count"],
            reverse=True,
        )

        # Serie temporal (últimos N, cronológicos)
        serie = [
            {
                "ts": e["timestamp"],
                "endpoint": e["endpoint"],
                "http_status": e["http_status"],
                "latencia_ms": e["latencia_ms"],
            }
            for e in eventos[-MAX_SERIE:]
        ]

        # Logs recientes (últimos N, más recientes primero)
        logs = [
            {
                "request_id": e["request_id"],
                "timestamp": e["timestamp"],
                "method": e["method"],
                "endpoint": e["endpoint"],
                "http_status": e["http_status"],
                "latencia_ms": e["latencia_ms"],
            }
            for e in reversed(eventos[-MAX_LOGS:])
        ]

        return {
            "total": total,
            "p95_latencia_ms": round(self._p95(latencias), 3),
            "tasa_exito": round((exitosos / total * 100) if total else 0.0, 2),
            "por_endpoint": endpoint_resumen,
            "serie": serie,
            "logs": logs,
        }


# Instancia única de la app
telemetria = Telemetria()
