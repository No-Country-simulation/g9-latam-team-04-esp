"""
Endpoints de telemetría (métricas en vivo).

``GET    /metrics``  - Agregados en memoria: total, P95, tasa de éxito,
                       tráfico por endpoint, serie temporal y logs recientes.
``DELETE /metrics``  - Limpia el buffer de eventos (requiere X-Admin-Token).

El registro de eventos lo hace el middleware HTTP en ``main.py``; acá solo se
lee el snapshot o se limpia. Nada de esto toca la base de datos.
"""
import hmac

from fastapi import APIRouter, Header, HTTPException, status

from ..core.config import settings
from ..core.telemetria import telemetria

router = APIRouter(tags=["métricas"])


@router.get(
    "/metrics",
    summary="Métricas de telemetría en vivo",
    description=(
        "Devuelve métricas reales de la API en memoria: total de requests, "
        "latencia P95, tasa de éxito, tráfico por endpoint, serie temporal y "
        "logs recientes. Es el respaldo del panel de Métricas del frontend "
        "(reemplaza la demo simulada del dashboard.py)."
    ),
)
async def obtener_metricas():
    """Snapshot actual del buffer de telemetría."""
    return telemetria.snapshot()


@router.delete(
    "/metrics",
    status_code=status.HTTP_200_OK,
    summary="Limpiar telemetría",
    description=(
        "Borra todos los eventos acumulados en memoria. "
        "Requiere header X-Admin-Token (configurar TK_ADMIN_TOKEN)."
    ),
)
async def limpiar_metricas(admin_token: str = Header(None, alias="X-Admin-Token")):
    """Limpia el buffer de eventos (requiere token de administrador)."""
    esperado = settings.admin_token
    if not esperado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoints de gestión no habilitados (configurar TK_ADMIN_TOKEN).",
        )
    if not admin_token or not hmac.compare_digest(admin_token, esperado):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de administrador inválido.",
        )
    telemetria.limpiar()
    return {"mensaje": "Telemetría limpiada."}