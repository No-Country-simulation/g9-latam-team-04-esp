"""
Esquemas Pydantic para las peticiones entrantes.
"""

from pydantic import BaseModel, Field, field_validator

from .validators.content_validators import (
    normalizar_texto,
    rechazar_caracteres_control,
    rechazar_demasiado_ruido,
    rechazar_palabra_repetida,
    rechazar_patrones_repetitivos,
    rechazar_solo_especiales,
)


class ContenidoRequest(BaseModel):
    """Cuerpo esperado por POST /contenido."""

    titulo: str = Field(
        ...,
        min_length=1,
        max_length=500,
        examples=["Introducción a Spring Boot"],
        description="Título del contenido técnico",
    )
    texto: str = Field(
        ...,
        min_length=1,
        max_length=10_000, # Podemos ampliar este límite si es necesario - 50_000
        examples=[
            "En este contenido se presentan los conceptos básicos para la creación de APIs REST utilizando Java y Spring Boot."
        ],
        description="Texto o descripción del contenido técnico",
    )
    idioma: str = Field(
        "auto",
        pattern=r"^(auto|en|es)$",
        examples=["auto", "en", "es"],
        description="Idioma del contenido: 'auto' para detectar, 'en' o 'es' para forzar",
    )

    @field_validator("titulo", "texto", mode="before")
    @classmethod
    def normalizar(cls, v: str) -> str:
        return normalizar_texto(v)

    @field_validator("titulo", "texto")
    @classmethod
    def validar_caracteres_control(cls, v: str) -> str:
        return rechazar_caracteres_control(v)

    @field_validator("titulo", "texto")
    @classmethod
    def validar_patrones_repetitivos(cls, v: str) -> str:
        return rechazar_patrones_repetitivos(v)

    @field_validator("titulo", "texto")
    @classmethod
    def validar_palabra_repetida(cls, v: str) -> str:
        return rechazar_palabra_repetida(v)

    @field_validator("titulo", "texto")
    @classmethod
    def validar_solo_especiales(cls, v: str) -> str:
        return rechazar_solo_especiales(v)

    @field_validator("titulo", "texto")
    @classmethod
    def validar_demasiado_ruido(cls, v: str) -> str:
        return rechazar_demasiado_ruido(v)

class ContenidoBatchRequest(BaseModel):
    """Cuerpo para clasificación por lote."""

    items: list[ContenidoRequest] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Lista de contenidos a clasificar",
    )
