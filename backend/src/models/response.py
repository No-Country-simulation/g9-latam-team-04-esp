"""
Esquemas Pydantic para las respuestas de la API.
"""

from datetime import datetime
from typing import Optional

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

class ItemResultadoBatch(BaseModel):
    """Resultado individual dentro de una solicitud por lote."""

    posicion: int = Field(..., description="Índice original del contenido en la solicitud")
    exito: bool = Field(..., description="Indica si el ítem superó el umbral y fue persistido")
    data: ContenidoResponse | None = Field(
        None, description="Datos de la clasificación si fue exitosa"
    )
    error: str | None = Field(
        None, description="Mensaje de error si la clasificación falló o no superó el umbral"
    )

class ContenidoBatchResponse(BaseModel):
    """Resultado global de clasificación por lote."""

    resultados: list[ItemResultadoBatch]
    total_procesados: int
    total_exitosos: int
    total_fallidos: int

class HistorialItem(BaseModel):
    """Una entrada del historial de clasificaciones."""

    id: int
    titulo: str
    texto: str
    categoria: str
    probabilidad: float
    informacion_adicional: list[str]
    idioma: str = "en"
    creado_en: str

class HistorialResponse(BaseModel):
    """Página del historial de clasificaciones."""

    items: list[HistorialItem]
    total: int
    pagina: int
    total_paginas: int

class ContenidoDetalleResponse(BaseModel):
    """Detalle completo de un contenido clasificado."""

    id: int = Field(..., description="ID del contenido")
    titulo: str = Field(..., description="Título del contenido")
    texto: str = Field(..., description="Texto completo del contenido")
    categoria: str = Field(..., description="Categoría asignada por el modelo")
    probabilidad: float = Field(
        ..., ge=0.0, le=1.0, description="Nivel de confianza de la clasificación"
    )
    informacion_adicional: list[str] = Field(
        ..., description="Términos clave extraídos del contenido"
    )
    idioma: str = Field(..., description="Idioma detectado o forzado")
    creado_en: str = Field(..., description="Fecha de clasificación")

class CorreccionClasificacionResponse(BaseModel):
    """Respuesta de PATCH /contenidos/{id}/clasificacion."""

    contenido_id: int = Field(..., description="ID del contenido corregido")
    categoria_anterior: str = Field(
        ..., description="Categoría que tenía el contenido antes del feedback"
    )
    categoria_nueva: str = Field(
        ..., description="Categoría asignada o confirmada por el humano"
    )
    corregida: bool = Field(
        ...,
        description="True si cambió de categoría; False si solo confirmó la actual",
    )
    usuario: str | None = Field(
        None, description="Quién realizó la corrección (opcional)"
    )
    motivo: str | None = Field(None, description="Motivo de la corrección (opcional)")
    creado_en: str = Field(..., description="Fecha en que se registró el feedback")

class CategoriaItem(BaseModel):
    """Una categoría disponible en el sistema."""

    id: int = Field(..., description="ID de la categoría")
    nombre: str = Field(..., description="Nombre de la categoría")

class CategoriasResponse(BaseModel):
    """Lista de categorías disponibles."""

    categorias: list[CategoriaItem] = Field(
        ...,
        examples=[[{"id": 1, "nombre": "Backend"}]],
        description="Categorías registradas en el sistema",
    )

class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud."""

    status: str = Field(..., examples=["ok"])
    version: str = Field(..., examples=["1.0.0"])
    model_loaded: bool
