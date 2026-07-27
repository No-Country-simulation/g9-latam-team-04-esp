"""
Esquemas Pydantic para las respuestas de la API.
"""

from datetime import datetime

from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud."""

    status: str = Field(..., examples=["ok"])
    version: str = Field(..., examples=["1.0.0"])
    model_loaded: bool
