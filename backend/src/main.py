"""
TechMind API - El cerebro que entiende tu contenido técnico. La API, lo comparte

FastAPI application entry point.
"""

# imports de la biblioteca estándar
import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

# imports de terceros
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# imports de nuestros módulos (los relativos con .)
from .api.contenido import router as contenido_router
from .api.metricas import router as metricas_router
from .core.config import settings
from .core.database import init_db
from .core.telemetria import telemetria
from .services.clasificador import clasificador
from .services.reentrenador import reentrenador

logger = logging.getLogger(__name__)


async def _bucle_automatizacion():
    """Ciclo de vida del modelo: detecta feedback nuevo -> reentrena -> recarga.

    1. Al arrancar, registra la firma del feedback actual (baseline) para no
       re-entrenar a ciegas.
    2. En cada intervalo, si hay feedback NUEVO y no hay entrenamiento en
       curso, lanza ``reentrenar.py`` como subproceso.
    3. Cuando el subproceso termina, recarga los modelos en caliente.
    """
    intervalo = settings.reload_check_interval_s
    if intervalo <= 0:
        return

    await asyncio.to_thread(reentrenador._baseline)

    while True:
        try:
            # 1) ¿Terminó el subproceso lanzado antes? Si sí, reevalúa el estado
            #    (exit code + registro de la firma como procesada). Esto DEBE ir
            #    antes de decidir relanzar, o re-lanzamos el feedback ya entrenado
            #    en cada ciclo formando una espiral.
            terminado = await asyncio.to_thread(reentrenador.check_terminado)
            if terminado and reentrenador.last_exit_code == 0:
                resultado = await asyncio.to_thread(clasificador.recargar)
                logger.info("Reentrenamiento OK -> recarga: %s", resultado)

            # 2) ¿Hay idiomas con feedback nuevo SIN entrenar y sin trabajo?
            pendientes = await asyncio.to_thread(reentrenador.idiomas_pendientes)
            if pendientes and reentrenador.estado == "idle":
                lanzado, detalle = await asyncio.to_thread(
                    reentrenador.lanzar, pendientes
                )
                logger.info("Feedback nuevo (%s) -> %s", "+".join(pendientes), detalle)
        except Exception:
            logger.exception("Fallo en el bucle de automatización del modelo")
        await asyncio.sleep(intervalo)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Inicializa BD, carga el modelo y arranca el bucle de automatización."""
    # Inicializar base de datos
    init_db()
    print("  [OK] Base de datos lista")

    # Cargar modelos (EN + ES). Cada uno reporta su estado internamente.
    clasificador.cargar()

    # Tarea en segundo plano (si está habilitada)
    tarea_auto = None
    if settings.reload_check_interval_s > 0:
        tarea_auto = asyncio.create_task(_bucle_automatizacion())
        print(
            f"  [OK] Automatización de reentrenamiento cada {settings.reload_check_interval_s}s"
        )
    else:
        print("  [WARN] Automatización deshabilitada (RELOAD_CHECK_INTERVAL_S=0)")

    yield

    if tarea_auto is not None:
        tarea_auto.cancel()
        try:
            await tarea_auto
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "API para clasificar contenido técnico usando un modelo "
        "de TF-IDF + Regresión Logística entrenado con scikit-learn."
    ),
    lifespan=lifespan,
)

# ── Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def telemetria_middleware(request, call_next):
    """Registra método, ruta, status y latencia de cada request en memoria.

    Alimenta ``GET /metrics``. Se excluye el propio ``/metrics`` para que las
    consultas del panel no contaminen las métricas que muestra.
    """
    inicio = time.perf_counter()
    response = await call_next(request)
    latencia_ms = (time.perf_counter() - inicio) * 1000

    ruta = request.url.path
    if not ruta.startswith("/metrics"):
        telemetria.registrar(
            method=request.method,
            endpoint=ruta,
            http_status=response.status_code,
            latencia_ms=latencia_ms,
        )
    return response


# ── Routers (primero, para que tengan prioridad)
app.include_router(contenido_router)
app.include_router(metricas_router)

# ── Frontend
# Sirve TODA la carpeta frontend/ (index.html + css/js/assets/vendor) desde la
# raíz. Debe ir DESPUÉS del router para que los endpoints de la API tengan
# prioridad; /docs y /redoc de FastAPI siguen funcionando (se registran al crear
# la app, antes de este mount). html=True resuelve "/" a index.html.
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount(
        "/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend"
    )
    print(f"  [OK] Frontend servido en / desde {FRONTEND_DIR}")
else:
    print(f"  [WARN] Frontend no encontrado en {FRONTEND_DIR}")


# ── Entry point
if __name__ == "__main__":
    uvicorn.run(
        "backend.src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
