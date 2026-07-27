"""
TechKnowledge API - Organizador Inteligente de Conocimiento Técnico.

FastAPI application entry point.
"""

# imports de la biblioteca estándar
import os
from contextlib import asynccontextmanager
from pathlib import Path

# imports de terceros
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# imports de nuestros módulos (los relativos con .)
from .api.contenido import router as contenido_router
from .core.config import settings
from .core.database import init_db
from .services.clasificador import clasificador


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Inicializa BD y carga el modelo al arrancar la aplicación."""
    # Inicializar base de datos
    init_db()
    print("  [OK] Base de datos lista")

    # Cargar modelos (EN + ES). Cada uno reporta su estado internamente.
    clasificador.cargar()
    yield


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

# ── Routers (primero, para que tengan prioridad)
app.include_router(contenido_router)

# ── Frontend
# FRONTEND_HTML = Path(__file__).resolve().parent.parent.parent / "frontend" / "index.html"

# if FRONTEND_HTML.exists():

#     @app.get("/")
#     async def index():
#         return FileResponse(str(FRONTEND_HTML))

#     print("  [OK] Frontend servido en /")

# else:
#     print(f"  [WARN] Frontend no encontrado en {FRONTEND_HTML}")


# ── Entry point
if __name__ == "__main__":
    uvicorn.run(
        "backend.src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
