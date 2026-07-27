"""
Endpoints de clasificación de contenido técnico.

``POST /contenido``            - Clasifica un contenido individual
``POST /contenido/batch``      - Clasifica hasta 100 contenidos en lote
``GET  /contenido/historial``  - Historial paginado de clasificaciones
``GET  /categorias``           - Lista las categorías disponibles
``POST /busqueda``             - Busca contenidos por palabra clave
``POST /recomendar``           - Recomenda contenidos relacionados
``GET  /health``               - Health check del servicio
"""

from fastapi import APIRouter, HTTPException, Query, status

# from ..core.database import guardar_clasificacion, obtener_historial
# from ..models.request import ContenidoBatchRequest, ContenidoRequest

from ..models.response import (HealthResponse)
# from ..models.response import (
#     ContenidoBatchResponse,
#     ContenidoResponse,
#     HealthResponse,
#     HistorialItem,
#     HistorialResponse,
# )

from ..services.clasificador import clasificador

router = APIRouter(prefix="", tags=["contenido"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Verifica que la API y el modelo estén operativos.",
)
async def health_check():
    """Health check del servicio."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        model_loaded=clasificador.cargado,
    )

# ── Helpers

def _verificar_modelo():
    """Lanza 503 si el modelo no está cargado."""
    if not clasificador.cargado:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo de clasificación no está cargado. "
            "Intentá de nuevo en unos segundos.",
        )
