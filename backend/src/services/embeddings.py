from sentence_transformers import SentenceTransformer
from typing import List
import logging

logger = logging.getLogger(__name__)


class EmbeddingsService:
    """
    Servicio para generar embeddings utilizando Sentence Transformers.

    El modelo se carga una única vez cuando se instancia el servicio.
    """

    def __init__(self):
        self._modelo = None
        self.cargado = False

        try:
            logger.info("Cargando modelo de embeddings...")

            self._modelo = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2"
            )

            self.cargado = True

            logger.info("Modelo de embeddings cargado correctamente.")

        except Exception as e:
            logger.exception("No fue posible cargar el modelo de embeddings.")
            self._modelo = None
            self.cargado = False

    def generar(self, texto: str) -> List[float]:
        """
        Genera el embedding de un único texto.
        """

        if not self.cargado:
            raise RuntimeError("El modelo de embeddings no está cargado.")

        vector = self._modelo.encode(
            texto,
            normalize_embeddings=True
        )

        return vector.tolist()

    def generar_batch(self, textos: List[str]) -> List[List[float]]:
        """
        Genera embeddings para múltiples textos.
        """

        if not self.cargado:
            raise RuntimeError("El modelo de embeddings no está cargado.")

        vectores = self._modelo.encode(
            textos,
            normalize_embeddings=True
        )

        return [vector.tolist() for vector in vectores]


# Instancia única reutilizable en toda la aplicación
embeddings_service = EmbeddingsService()