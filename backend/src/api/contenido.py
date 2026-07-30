"""
Endpoints de clasificación de contenido técnico.

``POST /contenido``            - Clasifica un contenido individual
``POST /contenido/lote-json``  - Clasifica hasta 100 contenidos desde JSON
``POST /contenido/lote-csv``   - Clasifica hasta 100 contenidos desde CSV
``GET  /contenidos``           - Lista / busca contenidos con filtros (q, categoria, paginado)
``GET  /categorias``           - Lista las categorías disponibles
``POST /busqueda``             - Busca contenidos por palabra clave
``POST /recomendar``           - Recomenda contenidos relacionados
``GET  /health``               - Health check del servicio
"""
import csv
import io

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from ..core.database import guardar_clasificacion, listar_contenidos
from ..models.request import ContenidoBatchRequest, ContenidoRequest
from ..models.response import (
    ContenidoBatchResponse,
    ContenidoResponse,
    HealthResponse,
    HistorialItem,
    HistorialResponse,
    ItemResultadoBatch,
)
from ..services.clasificador import clasificador

router = APIRouter(prefix="", tags=["contenido"])

# Umbral mínimo de confianza para aceptar una clasificación
UMBRAL_CONFIANZA: float = 0.25

@router.post(
    "/contenido",
    response_model=ContenidoResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar contenido técnico",
    description="Recibe un título y texto técnico, y devuelve la categoría "
    "asignada por el modelo junto con los términos clave extraídos.",
)
async def clasificar_contenido(body: ContenidoRequest):
    """Clasifica un contenido individual y lo guarda en el historial."""
    _verificar_modelo()

    try:
        resultado = clasificador.predecir(body.titulo, body.texto, idioma=body.idioma)

        # Extraer terminos_clave ANTES de pasar a ContenidoResponse
        terminos_clave = resultado.pop("terminos_clave", [])

        # Umbral de confianza
        if resultado["probabilidad"] < UMBRAL_CONFIANZA:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"El contenido no pudo clasificarse con suficiente confianza "
                    f"(probabilidad: {resultado['probabilidad']:.4f}, "
                    f"mínimo requerido: {UMBRAL_CONFIANZA})"
                ),
            )

        # Persistir en BD
        registro_id = guardar_clasificacion(
            titulo=body.titulo,
            texto=body.texto,
            categoria=resultado["categoria"],
            probabilidad=resultado["probabilidad"],
            terminos_clave=terminos_clave, # list[dict] con palabra + peso
            idioma=resultado["idioma"],
        )

        return ContenidoResponse(**resultado, id=registro_id)
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
            detail=f"Error al procesar el contenido: {exc}",
        )

@router.post(
    "/contenido/lote-json",
    response_model=ContenidoBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar múltiples contenidos desde JSON",
    description="Recibe un array JSON con hasta 100 contenidos y devuelve la clasificación de cada uno.",
)
async def clasificar_lote_json(body: ContenidoBatchRequest):
    """Clasifica un lote de contenidos desde JSON y los persiste."""
    _verificar_modelo()

    try:
        items = [
            {"titulo": it.titulo, "texto": it.texto, "idioma": it.idioma}
            for it in body.items
        ]
        resultados_batch = _clasificar_y_persistir(items, body.items)

        # Mapear los datos de cada ítem a ItemResultadoBatch
        items_procesados = [
            ItemResultadoBatch(
                posicion=r["posicion"],
                exito=r["exito"],
                data=ContenidoResponse(**r["data"]) if r["exito"] else None,
                error=r["error"],
            )
            for r in resultados_batch
        ]

        exitosos = sum(1 for item in items_procesados if item.exito)

        return ContenidoBatchResponse(
            resultados=items_procesados,
            total_procesados=len(items_procesados),
            total_exitosos=exitosos,
            total_fallidos=len(items_procesados) - exitosos,
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
    description="Sube un archivo CSV con columnas 'titulo' y 'texto' "
    "(opcional: 'idioma') y clasifica hasta 100 contenidos.",
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
            detail="El archivo debe tener extensión .csv",
        )

    try:
        raw = await archivo.read()
        # 'utf-8-sig' maneja el BOM automáticamente si fue exportado desde Excel
        text = raw.decode("utf-8-sig")

        # Detectar automáticamente si usa comas, punto y coma, tabuladores, etc.
        try:
            dialecto = csv.Sniffer().sniff(text[:1024])
            delimitador = dialecto.delimiter
        except csv.Error:
            # Si falla la detección automática, por defecto usamos la coma
            delimitador = ","

        reader = csv.DictReader(io.StringIO(text), delimiter=delimitador)
        filas = list(reader)

        if not filas:
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

        # Instanciar y validar cada fila con ContenidoRequest
        items_validados = []
        for i, fila in enumerate(filas, start=1):
            try:
                # Tratar valores 'None' (columnas vacías en CSV) y limpiar espacios
                titulo = (fila.get("titulo") or "").strip()
                texto = (fila.get("texto") or "").strip()
                idioma = (fila.get("idioma") or "auto").strip() or "auto"

                req = ContenidoRequest(
                    titulo=titulo,
                    texto=texto,
                    idioma=idioma,
                )
                items_validados.append(req)
            except ValueError as e:
                raise ValueError(f"Fila {i}: {e}") from e

        # Preparar diccionarios para la función de persistencia
        items_dict = [
            {"titulo": it.titulo, "texto": it.texto, "idioma": it.idioma}
            for it in items_validados
        ]
        
        resultados_batch = _clasificar_y_persistir(items_dict, items_validados)

        # Mapear la salida idéntica al endpoint JSON
        items_procesados = [
            ItemResultadoBatch(
                posicion=r["posicion"],
                exito=r["exito"],
                data=ContenidoResponse(**r["data"]) if r["exito"] else None,
                error=r["error"],
            )
            for r in resultados_batch
        ]

        exitosos = sum(1 for item in items_procesados if item.exito)

        return ContenidoBatchResponse(
            resultados=items_procesados,
            total_procesados=len(items_procesados),
            total_exitosos=exitosos,
            total_fallidos=len(items_procesados) - exitosos,
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
        q=q, categoria=categoria, pagina=pagina, limite=limite,
    )
    return HistorialResponse(
        items=[HistorialItem(**it) for it in items],
        total=total,
        pagina=pagina,
        total_paginas=max(1, -(-total // limite)),  # ceil division
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
    )

# ── Helpers

def _clasificar_y_persistir(
    items_dict: list[dict],
    items_originales: list,
) -> list[dict]:
    """Clasifica una lista de contenidos y persiste los resultados.

    Parameters
    ----------
    items_dict : list[dict]
        Lista con keys ``titulo``, ``texto``, ``idioma`` para pasar al clasificador.
    items_originales : list
        Lista de objetos ``ContenidoRequest`` (o similares con ``.titulo``, ``.texto``)
        para extraer los valores originales al persistir.

    Returns
    -------
    list[dict]
        Resultados devueltos por el clasificador.
    """
    
    # 1. Predecir todo el lote en el modelo
    resultados_raw = clasificador.predecir_batch(items_dict)

    respuestas_batch = []

    # 2. Procesar cada resultado en paralelo con su ítem original
    for idx, (item, res) in enumerate(zip(items_originales, resultados_raw)):
        try:
            # Validar umbral de confianza
            probabilidad = res.get("probabilidad", 0.0)
            if probabilidad < UMBRAL_CONFIANZA:
                raise ValueError(
                    f"El contenido no pudo clasificarse con suficiente confianza "
                    f"(probabilidad: {probabilidad:.4f}, mínimo requerido: {UMBRAL_CONFIANZA})"
                )

            # Extraer terminos_clave antes de pasar a ContenidoResponse
            terminos_clave = res.pop("terminos_clave", [])

            # Persistir ÚNICAMENTE si superó el umbral sin excepciones
            registro_id = guardar_clasificacion(
                titulo=item.titulo,
                texto=item.texto,
                categoria=res["categoria"],
                probabilidad=probabilidad,
                terminos_clave=terminos_clave,
                idioma=res["idioma"],
            )

            # Inyectar el ID devuelto por la BD
            res["id"] = registro_id

            # Agregar resultado exitoso
            respuestas_batch.append({
                "posicion": idx,
                "exito": True,
                "data": res,
                "error": None,
            })

        except Exception as exc:
            # Captura el error de este ítem (confianza baja, datos nulos, etc.)
            # y evita que el resto del lote falle.
            respuestas_batch.append({
                "posicion": idx,
                "exito": False,
                "data": None,
                "error": str(exc),
            })

    return respuestas_batch

def _verificar_modelo():
    """Lanza 503 si el modelo no está cargado."""
    if not clasificador.cargado:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo de clasificación no está cargado. "
            "Intentá de nuevo en unos segundos.",
        )
