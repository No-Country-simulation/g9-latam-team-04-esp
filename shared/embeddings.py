"""
Generacion de embeddings semanticos multilingues, para la feature de
Busqueda Semantica (similitud de coseno).

Usado por:
- La API de FastAPI: al clasificar contenido nuevo (para guardar su embedding),
  y al resolver una consulta de busqueda (POST /contenidos/busqueda-semantica).
- Los notebooks de Data Science: para validacion y evaluacion.

Modelo elegido: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
(multilingue, EN/ES sin necesitar dos modelos separados).
Dimension del vector: 384 -- este es el tamano que necesita la columna VECTOR
en Oracle 23ai (o BLOB si se prefiere serializar el vector).
"""

from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

# Score de similitud de coseno por debajo de este valor se considera poco
# relevante y deberia filtrarse de los resultados de busqueda (ver
# resumen_busqueda_semantica.md para el detalle de como se llego a este numero).
UMBRAL_SIMILITUD_MINIMO = 0.45

_modelo: SentenceTransformer | None = None


def _obtener_modelo() -> SentenceTransformer:
    """Carga el modelo una sola vez (singleton) y lo reutiliza en llamadas siguientes."""
    global _modelo
    if _modelo is None:
        _modelo = SentenceTransformer(MODEL_NAME)
    return _modelo


def generar_embedding(texto: str) -> list[float]:
    """Genera el embedding normalizado (384-dim) de un unico texto.

    Uso tipico: embedding de una consulta de busqueda, o de un contenido
    individual recien clasificado.
    """
    modelo = _obtener_modelo()
    vector = modelo.encode(texto, normalize_embeddings=True)
    return vector.tolist()


def generar_embeddings_batch(textos: list[str], batch_size: int = 64) -> list[list[float]]:
    """Genera embeddings normalizados para una lista de textos, en lotes.

    Uso tipico: backfill de embeddings para contenido existente, o
    reentrenamiento/reindexado masivo.
    """
    modelo = _obtener_modelo()
    vectores = modelo.encode(
        textos, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False
    )
    return vectores.tolist()


def similitud_coseno(vector_a: list[float], vector_b: list[float]) -> float:
    """Similitud de coseno entre dos vectores ya normalizados (equivale al producto punto).

    Util como alternativa en Python si el motor de base de datos no resuelve
    la busqueda por vector nativamente (ej. mientras no este listo el indice
    vectorial en Oracle).
    """
    return float(np.dot(vector_a, vector_b))
