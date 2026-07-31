"""
Esquemas Pydantic para las peticiones entrantes.
"""

from pydantic import BaseModel, Field, field_validator

from .validators.content_validators import (
    normalizar_opcional,
    normalizar_texto,
    rechazar_caracteres_control,
    rechazar_demasiado_ruido,
    rechazar_palabra_repetida,
    rechazar_patrones_repetitivos,
    rechazar_separadores_repetidos,
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

class CorreccionClasificacionRequest(BaseModel):
    """Cuerpo esperado por PATCH /contenidos/{id}/clasificacion."""

    nueva_categoria_id: int = Field(
        ...,
        gt=0,
        examples=[5],
        description="ID de la categoría correcta asignada por un humano",
    )
    usuario: str | None = Field(
        None,
        min_length=1,
        max_length=100,
        examples=["juan.perez"],
        description="Nombre o identificador opcional de quien corrige",
    )
    motivo: str | None = Field(
        None,
        min_length=1,
        max_length=500,
        examples=["La categoría real es Backend, no DevOps"],
        description="Razón opcional de la corrección",
    )

    @field_validator("usuario", "motivo", mode="before")
    @classmethod
    def normalizar_campos_opcionales(cls, v: str | None) -> str | None:
        return normalizar_opcional(v)

    @field_validator("usuario", "motivo")
    @classmethod
    def validar_caracteres_control_opcionales(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return rechazar_caracteres_control(v)

    @field_validator("usuario", "motivo")
    @classmethod
    def validar_patrones_repetitivos_opcionales(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return rechazar_patrones_repetitivos(v)

    @field_validator("usuario", "motivo")
    @classmethod
    def validar_solo_especiales_opcionales(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return rechazar_solo_especiales(v)

    @field_validator("usuario", "motivo")
    @classmethod
    def validar_demasiado_ruido_opcionales(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return rechazar_demasiado_ruido(v)

    @field_validator("usuario", "motivo")
    @classmethod
    def validar_separadores_repetidos_opcionales(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return rechazar_separadores_repetidos(v)


class ContenidoBatchRequest(BaseModel):
    """Cuerpo para clasificación por lote."""

    items: list[ContenidoRequest] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Lista de contenidos a clasificar",
    )
