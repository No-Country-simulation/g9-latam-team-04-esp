"""
Esquemas Pydantic para las respuestas de la API.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ContenidoResponse(BaseModel):
    """Resultado de la clasificación de un contenido."""

    categoria: str = Field(
        ...,
        examples=["Backend"],
        description="Categoría asignada por el modelo",
    )
    probabilidad: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        examples=[0.89],
        description="Nivel de confianza de la clasificación",
    )
    informacion_adicional: list[str] = Field(
        ...,
        examples=[["Java", "Spring Boot", "API REST"]],
        description="Términos clave extraídos del contenido",
    )
    idioma: str = Field(
        "en",
        examples=["es", "en"],
        description="Idioma detectado o forzado del contenido",
    )
    id: int | None = Field(
        None,
        description="ID en el historial (si se persistió)",
    )

class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud."""

    status: str = Field(..., examples=["ok"])
    version: str = Field(..., examples=["1.0.0"])
    model_loaded: bool
