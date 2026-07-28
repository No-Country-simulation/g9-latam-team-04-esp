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

from ..core.database import guardar_clasificacion
from ..models.request import ContenidoRequest

from ..models.response import (HealthResponse, ContenidoResponse)

from ..services.clasificador import clasificador

router = APIRouter(prefix="", tags=["contenido"])

# Umbral mínimo de confianza para aceptar una clasificación
UMBRAL_CONFIANZA: float = 0.25

@router.post(
    "/contenido",
    response_model=ContenidoResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar contenido técnico",
    description="Recibe un título y texto técnico, y devuelve la categoría "
    "asignada por el modelo junto con los términos clave extraídos.",
)
async def clasificar_contenido(body: ContenidoRequest):
    """Clasifica un contenido individual y lo guarda en el historial."""
    _verificar_modelo()

    try:
        resultado = clasificador.predecir(body.titulo, body.texto, idioma=body.idioma)

        # Extraer terminos_clave ANTES de pasar a ContenidoResponse
        terminos_clave = resultado.pop("terminos_clave", [])

        # Umbral de confianza
        if resultado["probabilidad"] < UMBRAL_CONFIANZA:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"El contenido no pudo clasificarse con suficiente confianza "
                    f"(probabilidad: {resultado['probabilidad']:.4f}, "
                    f"mínimo requerido: {UMBRAL_CONFIANZA})"
                ),
            )

        # Persistir en BD
        registro_id = guardar_clasificacion(
            titulo=body.titulo,
            texto=body.texto,
            categoria=resultado["categoria"],
            probabilidad=resultado["probabilidad"],
            terminos_clave=terminos_clave, # list[dict] con palabra + peso
            idioma=resultado["idioma"],
        )

        return ContenidoResponse(**resultado, id=registro_id)
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Datos inválidos: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el contenido: {exc}",
        )


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
