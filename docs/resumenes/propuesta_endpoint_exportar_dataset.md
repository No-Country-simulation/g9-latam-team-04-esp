# Propuesta — Sección 5 (Opción A): Exportar dataset para reentrenamiento

**Estado de las otras secciones del doc `enpoints-adicionales.md`:**
- ✅ Sección 3 (Búsqueda semántica) — ya implementada en `BE-03/busqueda-semantica`.
- ⚠️ Sección 4 (Feedback humano) — implementada en la misma rama, y el diseño es mejor de
  lo que pedía el doc: en vez de un simple flag booleano, agrega una tabla
  `feedback_clasificacion` que guarda el par categoría-original → categoría-corregida (con
  usuario y motivo opcionales), y marca `probabilidad = 1.0` en la clasificación vigente
  cuando un humano corrige o confirma. Esa señal es justo lo que usa esta propuesta para el
  filtro `solo_verificados`. **Pero tiene un bug que hace que el endpoint falle en cada
  llamada** — ver el punto 3 al final de este documento.
- 🔲 Sección 5 — sin resolver todavía. Esta propuesta cubre la Opción A (exportar el
  dataset para reentrenar externamente, recomendada por el equipo de Data Science por
  sobre la Opción B de reentrenar dentro del propio backend).

No requiere ninguna migración ni columna nueva — reutiliza el esquema que ya existe
(`contenidos`, `clasificaciones`, `categorias`, `feedback_clasificacion`).

---

## 1. Nueva función en `backend/src/core/database.py`

```python
def exportar_dataset_entrenamiento(
    idioma: str | None = None, solo_verificados: bool = False
) -> list[dict]:
    """Devuelve titulo, texto y categoria vigente, listos para reentrenar el modelo.

    solo_verificados=True filtra por probabilidad = 1.0 -- la señal que deja
    corregir_clasificacion() cuando un humano confirma o corrige una categoría.
    No hace falta ninguna columna nueva, ya existe desde el feedback (BE-03).
    """
    condiciones = []
    params: dict = {}

    if idioma:
        condiciones.append("c.idioma = :idioma")
        params["idioma"] = idioma
    if solo_verificados:
        condiciones.append("cl.probabilidad = 1.0")

    where = f"WHERE {' AND '.join(condiciones)}" if condiciones else ""

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT c.titulo, c.texto, cat.nombre
                FROM contenidos c
                JOIN clasificaciones cl ON c.id = cl.contenido_id
                JOIN categorias cat ON cl.categoria_id = cat.id
                {where}
            """, params)
            rows = cursor.fetchall()
            return [{"titulo": r[0], "texto": r[1], "categoria": r[2]} for r in rows]
```

## 2. Nuevo endpoint en `backend/src/api/contenido.py`

```python
import csv
import io
from fastapi.responses import StreamingResponse
from ..core.database import exportar_dataset_entrenamiento

@router.get(
    "/dataset/exportar",
    summary="Exportar dataset para reentrenamiento",
    description="Descarga un CSV con titulo, texto y categoria vigente, filtrado por "
    "idioma y, opcionalmente, solo registros confirmados/corregidos por un humano.",
)
async def exportar_dataset(
    idioma: str | None = Query(None, description="Filtrar por idioma ('en' o 'es')"),
    solo_verificados: bool = Query(
        False, description="Solo registros con feedback humano (probabilidad=1.0)"
    ),
):
    filas = exportar_dataset_entrenamiento(idioma=idioma, solo_verificados=solo_verificados)

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=["titulo", "texto", "categoria"])
    writer.writeheader()
    writer.writerows(filas)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dataset_exportado.csv"},
    )
```

## Resumen

| Archivo | Cambio |
|---|---|
| `backend/src/core/database.py` | 1 función nueva: `exportar_dataset_entrenamiento` |
| `backend/src/api/contenido.py` | 1 endpoint nuevo: `GET /dataset/exportar` |

Sin migraciones, sin columnas nuevas — se apoya 100% en lo que ya existe en
`BE-03/busqueda-semantica`. Ideal para integrarlo directo en esa misma rama antes
de pedir el merge, ya que depende de sus tablas (`feedback_clasificacion`,
`clasificaciones.probabilidad`).

Esto es solo una propuesta de código — no se tocó el repositorio. Backend la revisa,
ajusta a su criterio, y la integra siguiendo su propio flujo de branch/PR.

---

## 3. (Adicional) Fix del bug en el endpoint de la Sección 4

El endpoint `PATCH /contenidos/{contenido_id}/corregir` (`backend/src/api/contenido.py:565-581`)
falla en **cada** llamada con un `AttributeError`, porque lee un campo que no existe en el
modelo de request.

**El problema:**

```python
# request.py — el modelo solo define estos 3 campos:
class CorreccionClasificacionRequest(BaseModel):
    nueva_categoria_id: int
    usuario: str | None
    motivo: str | None
```

```python
# contenido.py:574-577 — pero el endpoint usa un campo que no existe:
corregir_clasificacion(
    contenido_id,
    body.categoria,   # <- AttributeError: no existe 'categoria' en el modelo
)
```

**El fix** — usar el campo real (`nueva_categoria_id`) y de paso pasar `usuario`/`motivo`,
que la función de base de datos ya soporta pero hoy se descartan sin usar:

```python
# contenido.py:574-578

corregir_clasificacion(
    contenido_id,
    body.nueva_categoria_id,
    usuario=body.usuario,
    motivo=body.motivo,
)
```

Con eso, el endpoint queda 100% funcional y aprovecha todo lo que ya guarda
`feedback_clasificacion` (usuario y motivo de la corrección), en vez de perder esos datos.

**Nota aparte (no bloqueante):** la ruta registrada es `PATCH /contenidos/{contenido_id}/corregir`,
mientras que el enunciado original pedía `PATCH /contenidos/{id}/clasificacion`. No rompe nada,
pero si quieren que coincida exactamente con la documentación, es cuestión de renombrar el
path en el decorador `@router.patch(...)`.
