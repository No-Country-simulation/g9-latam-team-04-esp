"""
Servicio de clasificación de contenido técnico.

Maneja dos modelos (inglés / español) con detección automática de idioma.
Cada modelo tiene su propio TF-IDF y LogisticRegression.
"""

from __future__ import annotations

import re
import string
import unicodedata
from pathlib import Path

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from shared.stop_words import STOP_WORDS_EN, STOP_WORDS_ES

from ..core.config import settings


# ── Limpieza de texto

def limpiar_texto(texto: str) -> str:
    """Limpieza de texto: minúsculas y normalización de espacios.
    """
    if not texto:
        return ""
    texto = str(texto).lower()
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()

def limpiar_texto_en(texto: str) -> str:
    """Limpieza para modelo INGLÉS: elimina acentos y diacríticos."""
    if not texto:
        return ""
    texto = str(texto).lower()
    texto = unicodedata.normalize("NFKD", texto)
    texto = texto.encode("ASCII", "ignore").decode("utf-8")
    texto = texto.translate(str.maketrans("", "", string.punctuation))
    texto = re.sub(r"\d+", "", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


def limpiar_texto_es(texto: str) -> str:
    """Limpieza para modelo ESPAÑOL: conserva acentos."""
    if not texto:
        return ""
    texto = str(texto).lower()
    texto = texto.translate(str.maketrans("", "", string.punctuation))
    texto = re.sub(r"\d+", "", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


# ── Detección de idioma

_IDIOMA_MODELO = {"en": "en", "es": "es"}

try:
    from langdetect import detect as _detect_lang

    def detectar_idioma(texto: str) -> str:
        """Devuelve 'en', 'es' o 'en' (fallback)."""
        if not texto.strip():
            return "en"
        try:
            lang = _detect_lang(texto[:500])
            return lang if lang in _IDIOMA_MODELO else "en"
        except Exception:
            return "en"

except ImportError:

    def detectar_idioma(texto: str) -> str:  # type: ignore[misc]
        """Fallback: siempre inglés."""
        return "en"


# ── Stop words para extracción de términos

_LIMPIEZA_POR_IDIOMA = {"en": limpiar_texto, "es": limpiar_texto}
_STOP_WORDS_POR_IDIOMA = {"en": STOP_WORDS_EN, "es": STOP_WORDS_ES}


def _es_termino_redundante(palabra: str, elegidas: list[str]) -> bool:
    """True si 'palabra' es subconjunto de tokens de alguna ya elegida (o viceversa).

    El vectorizador genera unigramas y bigramas a la vez, así que "ci cd" y "cd"
    (o "machine learning" y "machine") terminan con peso propio. Este filtro deja
    solo el de mayor peso y evita términos repetidos en informacion_adicional.
    """
    tokens_nuevo = set(palabra.split())
    for seleccionada in elegidas:
        tokens_sel = set(seleccionada.split())
        if tokens_nuevo <= tokens_sel or tokens_sel <= tokens_nuevo:
            return True
    return False


# ── Modelo interno (EN / ES)

class _ModeloIdioma:
    """Carga y ejecuta el pipeline para un idioma específico."""

    def __init__(self, modelo_path: Path, vectorizador_path: Path) -> None:
        self._modelo_path = modelo_path
        self._vectorizador_path = vectorizador_path
        self.modelo: LogisticRegression | None = None
        self.vectorizador: TfidfVectorizer | None = None
        self.categorias: list[str] = []
        self.cargado: bool = False

    def cargar(self) -> None:
        if not self._modelo_path.exists():
            raise FileNotFoundError(
                f"Modelo no encontrado en {self._modelo_path}"
            )
        if not self._vectorizador_path.exists():
            raise FileNotFoundError(
                f"Vectorizador no encontrado en {self._vectorizador_path}"
            )
        self.modelo = joblib.load(self._modelo_path)
        self.vectorizador = joblib.load(self._vectorizador_path)
        self.categorias = list(self.modelo.classes_)
        self.cargado = True


# ── Servicio principal

class ClasificadorService:
    """Clasifica contenido técnico en EN o ES según el idioma detectado."""

    def __init__(self) -> None:
        # Modelos por idioma
        self._en = _ModeloIdioma(
            modelo_path=Path(settings.model_path_en),
            vectorizador_path=Path(settings.vectorizer_path_en),
        )
        self._es = _ModeloIdioma(
            modelo_path=Path(settings.model_path_es),
            vectorizador_path=Path(settings.vectorizer_path_es),
        )

    # ── Propiedades

    @property
    def cargado(self) -> bool:
        return self._en.cargado or self._es.cargado

    @property
    def categorias(self) -> list[str]:
        """Categorías del modelo que esté cargado (prioridad EN)."""
        if self._en.cargado:
            return self._en.categorias
        if self._es.cargado:
            return self._es.categorias
        return []

    @property
    def modelos_disponibles(self) -> list[str]:
        """Idiomas cuyos modelos están cargados."""
        disponibles = []
        if self._en.cargado:
            disponibles.append("en")
        if self._es.cargado:
            disponibles.append("es")
        return disponibles

    # ── Carga

    def cargar(self) -> None:
        """Intenta cargar AMBOS modelos. Fallar uno no impide el otro."""
        errores = []
        try:
            self._en.cargar()
            print(f"  [OK] Modelo EN cargado: {len(self._en.categorias)} categorias")
        except FileNotFoundError as e:
            errores.append(str(e))

        try:
            self._es.cargar()
            print(f"  [OK] Modelo ES cargado: {len(self._es.categorias)} categorias")
        except FileNotFoundError as e:
            errores.append(str(e))

        if not self.cargado:
            for err in errores:
                print(f"  [WARN] {err}")
            print("  La API arrancará, pero /contenido devolverá 503 hasta cargar al menos un modelo.")
        elif errores:
            for err in errores:
                print(f"  [WARN] {err}")

    # ── Predicción

    def predecir(self, titulo: str, texto: str, idioma: str = "auto") -> dict:
        """Clasifica un contenido.

        Parameters
        ----------
        titulo, texto : str
            Contenido a clasificar.
        idioma : "auto" | "en" | "es"
            Si es "auto", se detecta automáticamente.

        Returns
        -------
        dict con keys: ``categoria``, ``probabilidad``,
        ``informacion_adicional``, ``idioma``.
        """
        if idioma == "auto":
            idioma = detectar_idioma(f"{titulo} {texto}")

        modelo_idioma = self._obtener_modelo(idioma)

        # Limpiar según idioma
        limpiar = _LIMPIEZA_POR_IDIOMA[idioma]
        texto_combinado = f"{limpiar(titulo)} {limpiar(texto)}"

        # Validación post-limpieza: debe quedar contenido significativo
        tokens = texto_combinado.split()
        stop_words = _STOP_WORDS_POR_IDIOMA.get(idioma, STOP_WORDS_EN)
        tokens_significativos = [t for t in tokens if t not in stop_words]
        if len(tokens_significativos) < 2:
            raise ValueError(
                "El contenido no tiene suficiente información significativa "
                "para clasificar después de eliminar ruido y palabras vacías"
            )

        X = modelo_idioma.vectorizador.transform([texto_combinado])

        categoria = modelo_idioma.modelo.predict(X)[0]

        probs = modelo_idioma.modelo.predict_proba(X)[0]
        idx = list(modelo_idioma.modelo.classes_).index(categoria)
        probabilidad = round(float(probs[idx]), 4)

        terminos_con_peso = self._extraer_terminos(modelo_idioma, X, idioma)

        return {
            "categoria": categoria,
            "probabilidad": probabilidad,
            "informacion_adicional": [t["palabra"] for t in terminos_con_peso],
            "terminos_clave": terminos_con_peso,
            "idioma": idioma,
        }

    def predecir_batch(self, items: list[dict]) -> list[dict]:
        """Clasifica múltiples contenidos."""
        return [self.predecir(it["titulo"], it["texto"], it.get("idioma", "auto")) for it in items]

    # ── Internos

    def _obtener_modelo(self, idioma: str) -> _ModeloIdioma:
        modelo = self._en if idioma == "en" else self._es
        if not modelo.cargado or modelo.modelo is None or modelo.vectorizador is None:
            raise RuntimeError(
                f"Modelo para '{idioma}' no cargado. "
                "Ejecutá el notebook correspondiente primero."
            )
        return modelo

    def _extraer_terminos(
        self, modelo: _ModeloIdioma, X: np.ndarray, idioma: str
    ) -> list[dict]:
        """Devuelve hasta 5 términos NO redundantes con su palabra y peso TF-IDF."""
        feature_names = modelo.vectorizador.get_feature_names_out()
        indexados = list(enumerate(X.toarray()[0]))
        indexados.sort(key=lambda x: x[1], reverse=True)

        stop_words = _STOP_WORDS_POR_IDIOMA.get(idioma, STOP_WORDS_EN)
        terminos: list[dict] = []
        palabras_elegidas: list[str] = []

        for i, score in indexados:
            palabra = feature_names[i]
            if palabra in stop_words:
                continue
            if score <= 0:
                continue
            # Saltar términos que repiten tokens de uno ya elegido
            if _es_termino_redundante(palabra, palabras_elegidas):
                continue
            terminos.append({
                "palabra": palabra,
                "peso": round(float(score), 4),
            })
            palabras_elegidas.append(palabra)
            if len(terminos) >= 5:
                break
        return terminos


# Instancia singleton
clasificador = ClasificadorService()
