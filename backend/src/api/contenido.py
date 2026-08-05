"""
Endpoints de clasificación de contenido técnico.

``POST /contenido``                       - Clasifica un contenido individual
``POST /contenido/lote-json``             - Clasifica hasta 100 contenidos desde JSON
``POST /contenido/lote-csv``              - Clasifica hasta 100 contenidos desde CSV
``GET  /contenido/{id}``                  - Obtiene detalle completo de un contenido
``PUT  /contenido/{id}``                  - Actualiza un contenido y lo re-clasifica
``DELETE /contenido/{id}``                - Elimina un contenido y sus registros asociados
``GET  /contenidos``                      - Lista / busca contenidos con filtros (q, categoria, paginado)
``POST /contenidos/busqueda-semantica``   - Busca contenidos por significado (embeddings)
``GET  /categorias``                      - Lista las categorías disponibles
``PATCH /contenidos/{id}/clasificacion``  - Corrige/confirma la categoría de un contenido
``GET  /contenidos/exportar-dataset``     - Exporta el dataset de entrenamiento (CSV/JSON)
``GET  /health``                          - Health check del servicio
"""
import csv
import io
from typing import Literal

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)

from ..core.database import (
    actualizar_contenido_db,
    buscar_por_similitud,
    corregir_clasificacion,
    eliminar_contenido,
    exportar_dataset,
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
UMBRAL_CONFIANZA: float = 0.25

@router.post(
    "/contenido",
    response_model=ContenidoResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar contenido técnico",
    description="Recibe un título y texto técnico, y devuelve la categoría asignada por el modelo junto con los términos clave extraídos.",
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
                    "El contenido no pudo clasificarse con suficiente confianza "
                    f"(probabilidad: {resultado['probabilidad']:.4f}, "
                    f"mínimo requerido: {UMBRAL_CONFIANZA})"
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

        # Persistir en BD
        contenido_id = guardar_clasificacion(
            titulo=body.titulo,
            texto=body.texto,
            categoria=resultado["categoria"],
            probabilidad=resultado["probabilidad"],
            terminos_clave=terminos_clave, # list[dict] con palabra + peso
            idioma=resultado["idioma"],
            embedding=embedding,
        )

        resultado["titulo"] = body.titulo
        resultado["texto"] = body.texto

        return ContenidoResponse(**resultado, id=contenido_id)

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
            detail=f"Error al clasificar el contenido: {exc}",
        )

@router.post(
    "/contenido/lote-json",
    response_model=ContenidoBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar múltiples contenidos desde JSON",
    description=("Recibe un arreglo JSON con hasta 100 contenidos y devuelve la clasificación de cada uno."),
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

        # Mapear los datos de cada ítem a ItemResultadoBatch
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
    description="Sube un archivo CSV con columnas 'titulo' y 'texto' (opcional: 'idioma') y clasifica hasta 100 contenidos.",
)
async def clasificar_lote_csv(
    archivo: UploadFile = File(..., description="Archivo CSV con los contenidos"),
):
    """Clasifica un lote de contenidos desde un archivo CSV."""
    _verificar_modelo()

    # Validar extensión de archivo
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
            raise ValueError("El archivo CSV está vacío o no tiene filas de datos")

        if len(filas) > 100:
            raise ValueError(
                f"El CSV contiene {len(filas)} filas. El máximo permitido es 100."
            )

        # Validar encabezados requeridos
        columnas = filas[0].keys() if filas[0] else []
        if "titulo" not in columnas or "texto" not in columnas:
            raise ValueError(
                "El CSV debe incluir las columnas requeridas: 'titulo' y 'texto'. "
                "Columna opcional: 'idioma'."
            )
        
        items_validados = []

        for fila in filas:

            items_validados.append(
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
            for item in items_validados
        ]

        resultados = _clasificar_y_persistir(items_dict, items_validados)

        # Mapear la salida idéntica al endpoint JSON
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
    
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Error al decodificar el archivo. Asegúrate de que tenga codificación UTF-8.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Datos inválidos: {exc}",
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el CSV: {exc}",
        )

@router.get(
    "/contenidos",
    response_model=HistorialResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar / buscar contenidos",
    description="Endpoint unificado para listar y buscar contenidos clasificados. "
    "Si no se pasa ``q``, devuelve el historial paginado. "
    "Si se pasa ``q``, busca en título, texto y términos clave. "
    "Se puede combinar con ``categoria`` para filtrar.",
)
async def listar_contenidos_endpoint(
    q: str | None = Query(None, description="Término de búsqueda (busca en título, texto y términos clave)"),
    categoria: str | None = Query(None, description="Filtrar por categoría"),
    pagina: int = Query(1, ge=1, description="Número de página"),
    limite: int = Query(20, ge=1, le=100, description="Resultados por página"),
):
    """Lista o busca contenidos con filtros opcionales."""
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
    "/contenido/{contenido_id}",
    response_model=ContenidoDetalleResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener contenido por ID",
    description="Devuelve el detalle completo de un contenido clasificado, incluyendo el texto completo y los términos clave.",
)
async def obtener_contenido(contenido_id: int):

    """Obtiene un contenido por su ID."""
    contenido = obtener_contenido_por_id(contenido_id)

    if contenido is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contenido no encontrado.",
        )

    return ContenidoDetalleResponse(**contenido)

@router.delete(
    "/contenido/{contenido_id}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar contenido",
    description="Elimina un contenido y todos sus registros asociados (clasificación y términos clave).",
)
async def eliminar_contenido_endpoint(
    contenido_id: int,
):

    eliminado = eliminar_contenido(contenido_id)
    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró contenido con id {id}",
        )
    return {"mensaje": f"Contenido {id} eliminado correctamente"}

@router.put(
    "/contenido/{contenido_id}",
    response_model=ContenidoDetalleResponse,
    status_code=status.HTTP_200_OK,
    summary="Actualizar contenido",
    description="Actualiza título y texto de un contenido existente. "
    "Re-clasifica automáticamente con el modelo y reemplaza "
    "la categoría, probabilidad y términos clave.",
)
async def actualizar_contenido(
    contenido_id: int,
    body: ContenidoRequest,
):

    """Actualiza un contenido y lo re-clasifica."""

    _verificar_modelo()

    contenido = obtener_contenido_por_id(contenido_id)

    if contenido is None:
        raise HTTPException(
            status_code=404,
            detail="Contenido no encontrado.",
        )

    try:
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

        if resultado["probabilidad"] < UMBRAL_CONFIANZA:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"El contenido no pudo clasificarse con suficiente confianza "
                    f"(probabilidad: {resultado['probabilidad']:.4f}, "
                    f"mínimo requerido: {UMBRAL_CONFIANZA})"
                ),
            )

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
            idioma=resultado["idioma"],
            categoria=resultado["categoria"],
            probabilidad=resultado["probabilidad"],
            informacion_adicional=terminos_texto,
            creado_en=contenido["creado_en"],
        )
    
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
            detail=f"Error al actualizar el contenido: {exc}",
        )
@router.get(
    "/categorias",
    response_model=CategoriasResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar categorías",
    description="Devuelve todas las categorías registradas en el sistema, ordenadas alfabéticamente.",
)
async def listar_categorias_endpoint():
    """Lista las categorías disponibles."""
    return CategoriasResponse(categorias=listar_categorias())

@router.patch(
    "/contenidos/{contenido_id}/clasificacion",
    response_model=CorreccionClasificacionResponse,
    status_code=status.HTTP_200_OK,
    summary="Corregir o confirmar clasificación",
    description="Permite a un humano corregir la categoría de un contenido "
    "(o confirmar la actual). Registra el par original→corregida en "
    "feedback_clasificacion como dataset para mejorar el modelo.",
)
async def corregir_clasificacion_endpoint(
    contenido_id: int, body: CorreccionClasificacionRequest
):
    """Corrige o confirma manualmente la clasificación de un contenido."""
    try:
        resultado = corregir_clasificacion(
            contenido_id=contenido_id,
            nueva_categoria_id=body.nueva_categoria_id,
            usuario=body.usuario,
            motivo=body.motivo,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Datos inválidos: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al corregir la clasificación: {exc}",
        )

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró contenido con id {contenido_id}",
        )

    return CorreccionClasificacionResponse(**resultado)

@router.get(
    "/contenidos/exportar-dataset",
    status_code=status.HTTP_200_OK,
    summary="Exportar dataset de entrenamiento",
    description="Exporta contenidos clasificados como CSV o JSON con columnas "
    "titulo, texto y categoria (la vigente). Filtra por idioma y opcionalmente "
    "solo los contenidos verificados por humanos (ground truth). "
    "Formato por defecto: CSV descargable.",
)
async def exportar_dataset_endpoint(
    idioma: Literal["en", "es", "todos"] = Query(
        "todos", description="Idioma de los contenidos a exportar"
    ),
    solo_verificados: bool = Query(
        True,
        description="True: solo contenidos con feedback humano (ground truth). "
        "False: todos, con la categoría vigente.",
    ),
    formato: Literal["csv", "json"] = Query(
        "csv", description="Formato de salida: csv (descargable) o json"
    ),
):
    """Exporta el dataset de entrenamiento desde la BD."""
    filas = exportar_dataset(idioma=idioma, solo_verificados=solo_verificados)

    sufijo = "" if idioma == "todos" else f"_{idioma}"
    prefijo = "feedback" if solo_verificados else "contenidos"
    nombre_base = f"dataset_{prefijo}{sufijo}"

    if formato == "json":
        return filas

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=["titulo", "texto", "categoria"])
    writer.writeheader()
    writer.writerows(filas)
    csv_texto = buffer.getvalue()

    return Response(
        content=csv_texto,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nombre_base}.csv"'},
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
        embeddings=embeddings_service.cargado,
    )

# ── Helpers

def _clasificar_y_persistir(
    items: list[dict],
    modelos: list[ContenidoRequest],
) -> list[dict]:
    """Clasifica una lista de contenidos y persiste los resultados.

    Parameters
    ----------
    items : list[dict]
        Lista con keys ``titulo``, ``texto``, ``idioma`` para pasar al clasificador.
    modelos : list[ContenidoRequest]
        Lista de objetos ``ContenidoRequest`` (o similares con ``.titulo``, ``.texto``)
        para extraer los valores originales al persistir.

    Returns
    -------
    list[dict]
        Resultados devueltos por el clasificador.
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

    
    for indice, (modelo, resultado, embedding) in enumerate(
        zip(modelos, predicciones, embeddings),
        start=1,
    ):

        try:

            # Validar umbral de confianza
            probabilidad = resultado.get("probabilidad", 0.0)
            if probabilidad < UMBRAL_CONFIANZA:
                raise ValueError(
                    f"El contenido no pudo clasificarse con suficiente confianza "
                    f"(probabilidad: {probabilidad:.4f}, mínimo requerido: {UMBRAL_CONFIANZA})"
                )

            # Extraer terminos_clave antes de pasar a ContenidoResponse
            terminos = resultado.pop(
                "terminos_clave",
                [],
            )

            # Persistir ÚNICAMENTE si superó el umbral sin excepciones

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
    """Lanza 503 si el modelo no está cargado."""
    if not clasificador.cargado:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo de clasificación no está cargado. "
            "Intentá de nuevo en unos segundos.",
        )