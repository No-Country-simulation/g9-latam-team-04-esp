"""
Endpoints de clasificación de contenido técnico.

``POST /contenido``            - Clasifica un contenido individual
``POST /contenido/lote-json``  - Clasifica hasta 100 contenidos desde JSON
``POST /contenido/lote-csv``   - Clasifica hasta 100 contenidos desde CSV
``GET  /contenido/{id}``       - Obtiene detalle completo de un contenido
``PUT  /contenido/{id}``       - Actualiza un contenido y lo re-clasifica
``DELETE /contenido/{id}``     - Elimina un contenido y sus registros asociados
``GET  /contenidos``           - Lista / busca contenidos con filtros (q, categoria, paginado)
``POST /contenidos/busqueda-semantica`` - Busca contenidos por significado (embeddings)
``GET  /categorias``           - Lista las categorías disponibles
``PATCH /contenidos/{id}/clasificacion`` - Corrige/confirma la categoría de un contenido
``GET  /health``               - Health check del servicio
"""
import csv
import io

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from ..core.database import (
    actualizar_contenido_db,
    buscar_por_similitud,
    corregir_clasificacion,
    eliminar_contenido,
    guardar_clasificacion,
    listar_categorias,
    listar_contenidos,
    obtener_contenido_por_id,
)

from ..models.request import (
    BusquedaSemanticaRequest,
    ContenidoBatchRequest,
    ContenidoRequest,
    CorreccionClasificacionRequest,
)

from ..models.response import (
    BusquedaSemanticaResponse,
    CategoriasResponse,
    ContenidoBatchResponse,
    ContenidoDetalleResponse,
    ContenidoResponse,
    CorreccionClasificacionResponse,
    HealthResponse,
    HistorialItem,
    HistorialResponse,
    ItemResultadoBatch,
    ResultadoSemantico,
)

from ..services.clasificador import clasificador
from ..services.embeddings import embeddings_service


router = APIRouter(
    prefix="",
    tags=["contenido"],
)

# Probabilidad mínima para aceptar una clasificación
UMBRAL_CONFIANZA = 0.25

@router.post(
    "/contenido",
    response_model=ContenidoResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar contenido técnico",
    description=(
        "Recibe un título y un texto técnico, "
        "clasifica el contenido y lo almacena en Oracle."
    ),
)
async def clasificar_contenido(body: ContenidoRequest):
    """
    Clasifica un contenido individual.

    Flujo:

    1. Clasifica el contenido.
    2. Genera su embedding.
    3. Guarda todo en Oracle.
    """

    _verificar_modelo()

    try:

        resultado = clasificador.predecir(
            body.titulo,
            body.texto,
            idioma=body.idioma,
        )

        terminos_clave = resultado.pop(
            "terminos_clave",
            [],
        )

        if resultado["probabilidad"] < UMBRAL_CONFIANZA:

            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "El contenido no pudo clasificarse "
                    "con suficiente confianza "
                    f"({resultado['probabilidad']:.4f})"
                ),
            )

        # --------------------------------------------
        # Generación del embedding
        # --------------------------------------------

        embedding = None

        if embeddings_service.cargado:

            try:

                embedding = embeddings_service.generar(
                    f"{body.titulo}\n{body.texto}"
                )

            except Exception:
                # Si falla el modelo de embeddings
                # no impedimos guardar el contenido.
                embedding = None

        # --------------------------------------------
        # Persistencia
        # --------------------------------------------

        contenido_id = guardar_clasificacion(
            titulo=body.titulo,
            texto=body.texto,
            categoria=resultado["categoria"],
            probabilidad=resultado["probabilidad"],
            terminos_clave=terminos_clave,
            idioma=resultado["idioma"],
            embedding=embedding,
        )

        return ContenidoResponse(
            id=contenido_id,
            **resultado,
        )

    except HTTPException:
        raise

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al clasificar el contenido: {exc}",
        )

@router.post(
    "/contenido/lote-json",
    response_model=ContenidoBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar múltiples contenidos desde JSON",
    description=(
        "Recibe un arreglo JSON con hasta 100 contenidos "
        "y devuelve la clasificación de cada uno."
    ),
)
async def clasificar_lote_json(body: ContenidoBatchRequest):

    _verificar_modelo()

    try:

        items = [
            {
                "titulo": item.titulo,
                "texto": item.texto,
                "idioma": item.idioma,
            }
            for item in body.items
        ]

        resultados = _clasificar_y_persistir(
            items,
            body.items,
        )

        items_respuesta = [
            ItemResultadoBatch(
                posicion=item["posicion"],
                exito=item["exito"],
                data=(
                    ContenidoResponse(**item["data"])
                    if item["exito"]
                    else None
                ),
                error=item["error"],
            )
            for item in resultados
        ]

        exitosos = sum(
            1
            for item in items_respuesta
            if item.exito
        )

        return ContenidoBatchResponse(
            resultados=items_respuesta,
            total_procesados=len(items_respuesta),
            total_exitosos=exitosos,
            total_fallidos=len(items_respuesta) - exitosos,
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el lote: {exc}",
        )

@router.post(
    "/contenido/lote-csv",
    response_model=ContenidoBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar múltiples contenidos desde CSV",
)
async def clasificar_lote_csv(
    archivo: UploadFile = File(...)
):

    _verificar_modelo()

    if not (archivo.filename or "").lower().endswith(".csv"):

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El archivo debe ser un CSV.",
        )

    try:

        contenido = (
            await archivo.read()
        ).decode("utf-8-sig")

        try:
            dialecto = csv.Sniffer().sniff(
                contenido[:1024]
            )
            delimitador = dialecto.delimiter

        except csv.Error:
            delimitador = ","

        reader = csv.DictReader(
            io.StringIO(contenido),
            delimiter=delimitador,
        )

        filas = list(reader)

        if len(filas) == 0:
            raise ValueError(
                "El archivo está vacío."
            )

        if len(filas) > 100:
            raise ValueError(
                "El máximo permitido es 100 registros."
            )

        items = []

        for fila in filas:

            items.append(
                ContenidoRequest(
                    titulo=(fila.get("titulo") or "").strip(),
                    texto=(fila.get("texto") or "").strip(),
                    idioma=(fila.get("idioma") or "auto").strip(),
                )
            )

        items_dict = [
            {
                "titulo": item.titulo,
                "texto": item.texto,
                "idioma": item.idioma,
            }
            for item in items
        ]

        resultados = _clasificar_y_persistir(
            items_dict,
            items,
        )

        items_respuesta = [
            ItemResultadoBatch(
                posicion=item["posicion"],
                exito=item["exito"],
                data=(
                    ContenidoResponse(**item["data"])
                    if item["exito"]
                    else None
                ),
                error=item["error"],
            )
            for item in resultados
        ]

        exitosos = sum(
            1
            for item in items_respuesta
            if item.exito
        )

        return ContenidoBatchResponse(
            resultados=items_respuesta,
            total_procesados=len(items_respuesta),
            total_exitosos=exitosos,
            total_fallidos=len(items_respuesta) - exitosos,
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )

@router.get(
    "/historial",
    response_model=HistorialResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar / buscar contenidos",
    description=(
        "Lista contenidos clasificados o realiza búsquedas "
        "por texto y categoría."
    ),
)
async def listar_contenidos_endpoint(
    q: str | None = Query(
        None,
        description="Texto a buscar"
    ),
    categoria: str | None = Query(
        None,
        description="Filtrar por categoría"
    ),
    pagina: int = Query(
        1,
        ge=1,
        description="Página"
    ),
    limite: int = Query(
        20,
        ge=1,
        le=100,
        description="Cantidad de resultados"
    ),
):

    items, total = listar_contenidos(
        q=q,
        categoria=categoria,
        pagina=pagina,
        limite=limite,
    )

    return HistorialResponse(
        items=[
            HistorialItem(**item)
            for item in items
        ],
        total=total,
        pagina=pagina,
        total_paginas=max(
            1,
            -(-total // limite),
        ),
    )

@router.post(
    "/contenidos/busqueda-semantica",
    response_model=BusquedaSemanticaResponse,
    status_code=status.HTTP_200_OK,
    summary="Búsqueda semántica",
    description=(
        "Busca contenidos utilizando embeddings "
        "y similitud semántica."
    ),
)
async def busqueda_semantica_endpoint(
    body: BusquedaSemanticaRequest
):

    if not embeddings_service.cargado:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo de embeddings no está disponible.",
        )

    if body.top_n <= 0:

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="top_n debe ser mayor que cero.",
        )

    try:

        embedding = embeddings_service.generar(
            body.texto_consulta
        )

        resultados = buscar_por_similitud(
            embedding=embedding,
            top_n=body.top_n,
            categoria=body.categoria,
        )

        return BusquedaSemanticaResponse(
            resultados=[
                ResultadoSemantico(**item)
                for item in resultados
            ],
            total=len(resultados),
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la búsqueda semántica: {exc}",
        )

@router.get(
    "/contenidos/{contenido_id}",
    response_model=ContenidoDetalleResponse,
    status_code=status.HTTP_200_OK,
)
async def obtener_contenido(contenido_id: int):

    contenido = obtener_contenido_por_id(contenido_id)

    if contenido is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contenido no encontrado.",
        )

    return ContenidoDetalleResponse(**contenido)

@router.delete(
    "/contenidos/{contenido_id}",
    status_code=204,
)
async def eliminar_contenido_endpoint(
    contenido_id: int,
):

    eliminar_contenido(contenido_id)

@router.put(
    "/contenidos/{contenido_id}",
    response_model=ContenidoDetalleResponse,
)
async def actualizar_contenido(
    contenido_id: int,
    body: ContenidoRequest,
):

    _verificar_modelo()

    contenido = obtener_contenido_por_id(contenido_id)

    if contenido is None:
        raise HTTPException(
            status_code=404,
            detail="Contenido no encontrado.",
        )

    resultado = clasificador.predecir(
        body.titulo,
        body.texto,
        idioma=body.idioma,
    )

    terminos = resultado.pop(
        "terminos_clave",
        [],
    )

    terminos_texto = [
    t["palabra"] for t in terminos
]

    embedding = None

    if embeddings_service.cargado:
        embedding = embeddings_service.generar(
            f"{body.titulo}\n{body.texto}"
        )

    actualizar_contenido_db(
    contenido_id=contenido_id,
    titulo=body.titulo,
    texto=body.texto,
    idioma=resultado["idioma"],
    categoria=resultado["categoria"],
    probabilidad=resultado["probabilidad"],
    terminos_clave=terminos,
    embedding=embedding,
)

    return ContenidoDetalleResponse(
    id=contenido_id,
    titulo=body.titulo,
    texto=body.texto,
    categoria=resultado["categoria"],
    probabilidad=resultado["probabilidad"],
    informacion_adicional=terminos_texto,
    idioma=resultado["idioma"],
    creado_en=contenido["creado_en"],
)

@router.get(
    "/categorias",
    response_model=CategoriasResponse,
)
async def obtener_categorias():

    return CategoriasResponse(
        categorias=listar_categorias()
    )

@router.patch(
    "/contenidos/{contenido_id}/corregir",
    response_model=CorreccionClasificacionResponse,
)
async def corregir_contenido(
    contenido_id: int,
    body: CorreccionClasificacionRequest,
):

    corregir_clasificacion(
        contenido_id,
        body.categoria,
    )

    return CorreccionClasificacionResponse(
        mensaje="Clasificación corregida correctamente."
    )

@router.get(
    "/health",
    response_model=HealthResponse,
)
async def health():

    return HealthResponse(
        clasificador=clasificador.cargado,
        embeddings=embeddings_service.cargado,
        estado="ok",
    )

# ── Helpers

def _clasificar_y_persistir(
    items: list[dict],
    modelos: list[ContenidoRequest],
) -> list[dict]:
    """
    Clasifica múltiples contenidos, genera embeddings en lote y los guarda.

    Devuelve una lista con el resultado de cada elemento.
    """

    resultados = []

    # Clasificación en lote
    predicciones = clasificador.predecir_batch(items)

    # -------------------------------------------------------
    # Generación de embeddings en batch
    # -------------------------------------------------------

    embeddings = []

    if embeddings_service.cargado:

        textos = [
            f"{item['titulo']}\n{item['texto']}"
            for item in items
        ]

        try:

            embeddings = embeddings_service.generar_batch(textos)

        except Exception:

            embeddings = [None] * len(items)

    else:

        embeddings = [None] * len(items)

    # -------------------------------------------------------
    # Persistencia
    # -------------------------------------------------------

    for indice, (modelo, resultado, embedding) in enumerate(
        zip(modelos, predicciones, embeddings),
        start=1,
    ):

        try:

            terminos = resultado.pop(
                "terminos_clave",
                [],
            )

            contenido_id = guardar_clasificacion(
                titulo=modelo.titulo,
                texto=modelo.texto,
                categoria=resultado["categoria"],
                probabilidad=resultado["probabilidad"],
                idioma=resultado["idioma"],
                terminos_clave=terminos,
                embedding=embedding,
            )

            resultados.append(
                {
                    "posicion": indice,
                    "exito": True,
                    "data": {
                        "id": contenido_id,
                        **resultado,
                    },
                    "error": None,
                }
            )

        except Exception as exc:

            resultados.append(
                {
                    "posicion": indice,
                    "exito": False,
                    "data": None,
                    "error": str(exc),
                }
            )

    return resultados

def _verificar_modelo():

    if not clasificador.cargado:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo de clasificación no está disponible.",
        )