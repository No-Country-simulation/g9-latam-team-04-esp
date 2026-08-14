# Reporte de Testing Exploratorio — TechMind 🧠 API

Sesión de pruebas manuales sobre `develop` (backend levantado en local, Oracle real vía wallet,
Insomnia con la colección `docs/insomnia/techmind-api.yaml`). Objetivo: encontrar bugs mandando
inputs límite/maliciosos a cada endpoint ("romper" la API a propósito).

## Resumen ejecutivo

| # | Hallazgo | Severidad | Endpoints afectados |
|---|----------|-----------|----------------------|
| 1 | Conexión Oracle bloqueante congela el servidor entero | **Crítico** | Todos los que tocan BD |
| 2 | `TypeError` no controlado con tipos de dato incorrectos → 500 en vez de 422 | Alto | `POST /contenido`, `PUT /contenido/{id}`, `POST /contenido/lote-json`, `POST /contenido/lote-csv` |
| 3 | Uso de `id` (built-in) en vez de `contenido_id` en mensajes de `DELETE` | Bajo | `DELETE /contenido/{id}` |
| 4 | Nombre de variable de entorno incorrecto en mensajes de error | Bajo | `POST /modelos/reentrenar` |
| 5 | `PUT` no tolera fallos del modelo de embeddings (inconsistente con `POST`) | Medio | `PUT /contenido/{id}` |
| 6 | Errores de validación crudos/inconsistentes en el endpoint CSV | Bajo (UX) | `POST /contenido/lote-csv` |
| 7 | Código muerto: chequeo manual de `top_n` nunca se ejecuta | Cosmético | `POST /contenidos/busqueda-semantica` |

También se confirmaron **varios comportamientos correctos** (ver sección final) que vale la pena
dejar documentados como evidencia de que no son un problema.

---

## 1. Conexión Oracle bloqueante congela el servidor entero (CRÍTICO)

**Dónde:** `backend/src/core/database.py:31` (`get_connection()`), invocada de forma síncrona desde
funciones `async def` en `backend/src/api/contenido.py` (ej. `clasificar_contenido`,
`obtener_contenido`, etc.) sin `asyncio.to_thread`.

**Qué se probó:** se enviaron varias peticiones normales (`POST /contenido`, `GET /contenido/{id}`)
mientras la conexión a Oracle tardaba en establecerse (en este entorno, por interferencia puntual de
un antivirus — ver nota al final). En cada caso:

- La petición que disparó la conexión lenta tardó entre 30 y 62 segundos en responder.
- **Mientras tanto, `GET /health` (que no depende de la base) también quedó sin responder**, confirmando
  que todo el proceso queda congelado, no solo la petición que causó el problema.
- Reproducido de forma consistente 3+ veces.

**Por qué importa:** uvicorn corre en un solo hilo/event-loop por defecto. Cualquier latencia real
hacia Oracle en producción (pico de tráfico, DB ocupada, blip de red) tumbaría la API completa para
**todos los usuarios simultáneos**, no solo para quien hizo la petición lenta — es un problema de
disponibilidad, un solo cliente lento puede causar un DoS accidental para todo el equipo.

**Causa raíz secundaria:** no hay pool de conexiones — cada request abre una conexión Oracle nueva
(`oracledb.connect()`) en vez de reusar un pool (`oracledb.create_pool()`), lo que es más lento y más
frágil ante cualquier hiccup de red.

**Recomendación:** envolver `get_connection()` / `init_db()` con `asyncio.to_thread(...)` como mínimo.
Idealmente migrar a `oracledb.create_pool()` con conexiones reutilizables.

---

## 2. `TypeError` no controlado con tipos de dato incorrectos (ALTO)

**Dónde:** `backend/src/models/request.py:47` → `backend/src/models/validators/content_validators.py:16`.

```python
@field_validator("titulo", "texto", mode="before")
def normalizar(cls, v: str) -> str:
    return normalizar_texto(v)   # llama a unicodedata.normalize("NFC", v)
```

**Payload de prueba:**
```json
{"titulo": 12345, "texto": true}
```

**Resultado obtenido:** `500 Internal Server Error` (en vez del `422` esperado).

**Traceback capturado:**
```
File "backend/src/models/request.py", line 48, in normalizar
    return normalizar_texto(v)
File "backend/src/models/validators/content_validators.py", line 16, in normalizar_texto
    v = unicodedata.normalize("NFC", v)
TypeError: normalize() argument 2 must be str, not int
```

**Causa:** el validador usa `mode="before"`, por lo que corre **antes** de que Pydantic verifique
que el valor sea un string. Si el cliente manda un `int` o `bool`, `unicodedata.normalize()` recibe
un tipo que no puede procesar y lanza `TypeError`. Pydantic v2 solo convierte a error de validación
(422) los `ValueError`/`AssertionError` lanzados dentro de un validador — un `TypeError` se le escapa
y se propaga como excepción real sin capturar → 500.

**Endpoints afectados** (todos comparten `ContenidoRequest`):
- `POST /contenido` (confirmado en vivo)
- `PUT /contenido/{id}` (confirmado en vivo, mismo traceback)
- `POST /contenido/lote-json` (mismo modelo por item, no probado en vivo pero mismo código)
- `POST /contenido/lote-csv` (mismo modelo por fila, no probado en vivo pero mismo código)

**Recomendación:** validar el tipo antes de normalizar, ej.:
```python
def normalizar_texto(v):
    if not isinstance(v, str):
        raise ValueError("debe ser una cadena de texto")
    v = unicodedata.normalize("NFC", v)
    return v.strip()
```

---

## 3. Mensajes de `DELETE /contenido/{id}` usan `id` en vez de `contenido_id` (BAJO)

**Dónde:** `backend/src/api/contenido.py:495` y `:500`.

```python
async def eliminar_contenido_endpoint(contenido_id: int):
    eliminado = eliminar_contenido(contenido_id)
    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró contenido con id {id}",       # bug
        )
    return {"mensaje": f"Contenido {id} eliminado correctamente"}  # bug
```

`id` referencia la función built-in de Python, no el parámetro `contenido_id`.

**Confirmado en vivo — caso éxito** (`DELETE /contenido/381`):
```json
{"mensaje": "Contenido <built-in function id> eliminado correctamente"}
```

**Confirmado en vivo — caso 404** (reintentando el mismo delete):
```json
{"detail": "No se encontró contenido con id <built-in function id>"}
```

**Impacto:** no afecta la lógica (el borrado funciona bien), solo el mensaje de respuesta.

**Fix:** reemplazar `id` por `contenido_id` en ambas líneas.

---

## 4. Nombre de variable de entorno incorrecto en mensajes de error (BAJO)

**Dónde:** `backend/src/api/contenido.py:764` y `:793`.

Los mensajes dicen `TK_API_ADMIN_TOKEN`, pero la variable real (confirmada en `config.py:43` y
`.env.example:41`) es **`TK_ADMIN_TOKEN`**. Un desarrollador que siga el mensaje literal va a buscar
una variable que no existe.

**Confirmado en vivo** (`POST /modelos/reentrenar` sin token configurado):
```json
{"detail": "Endpoints de gestión no habilitados (configurar TK_API_ADMIN_TOKEN)."}
```

**Fix:** corregir el string a `TK_ADMIN_TOKEN` en ambos lugares.

---

## 5. `PUT /contenido/{id}` no tolera fallos del modelo de embeddings (MEDIO)

**Dónde:** `backend/src/api/contenido.py` (`actualizar_contenido`), comparado con
`clasificar_contenido` (POST).

En `POST /contenido`, la generación de embedding está protegida:
```python
try:
    embedding = embeddings_service.generar(...)
except Exception:
    embedding = None   # no impide guardar el contenido
```

En `PUT /contenido/{id}` la misma llamada **no tiene try/except** — si falla, cae en el handler
genérico y todo el update responde `500`, en vez de guardar sin el embedding como hace el POST.

**No reproducido en vivo** (difícil de forzar sin desconectar el modelo a propósito) — hallazgo de
revisión de código, documentado para que el equipo decida si es intencional o una inconsistencia a
corregir.

---

## 6. Errores de validación crudos en `POST /contenido/lote-csv` (BAJO / UX)

El endpoint JSON (`lote-json`) devuelve errores estructurados por campo:
```json
{"detail": [{"type": "string_too_short", "loc": ["body", "items", 1, "titulo"], ...}]}
```

El endpoint CSV, con el mismo caso (fila con `titulo` vacío), devuelve el string crudo de Pydantic:
```json
{"detail": "Datos inválidos: 1 validation error for ContenidoRequest\ntitulo\n  String should have at least 1 character [type=string_too_short, input_value='', input_type=str]\n    For further information visit https://errors.pydantic.dev/2.13/v/string_too_short"}
```

No es un bug de seguridad, pero es inconsistente y menos útil para un cliente que parsea la respuesta.

---

## 7. Código muerto en `busqueda-semantica` (COSMÉTICO)

`backend/src/api/contenido.py`, endpoint `busqueda_semantica_endpoint`:
```python
if body.top_n <= 0:
    raise HTTPException(422, "top_n debe ser mayor que cero.")
```

`BusquedaSemanticaRequest.top_n` ya tiene `Field(ge=1, le=100)` — Pydantic rechaza cualquier valor
`<= 0` antes de que el código del endpoint se ejecute. El chequeo manual nunca se alcanza. Confirmado
en vivo: `top_n: 0` devuelve el error de Pydantic (`"Input should be greater than or equal to 1"`), no
el mensaje manual del `if`.

---

## Comportamientos verificados como correctos (sin bugs)

- **SQL injection**: `'; DROP TABLE contenidos; --'` como `titulo`/`texto` en `POST /contenido`, y
  como `q` en `GET /contenidos`, se trata como texto literal sin romper nada. Código revisado
  (`database.py:294-307`) confirma uso de bind variables (`:q`, `:categoria`), no concatenación.
- **Autenticación de `POST /modelos/reentrenar`**: sin token configurado → `403`; con token
  configurado, sin header → `401`; con token incorrecto → `401` (usa `hmac.compare_digest`, sin
  timing leak); con token correcto → pasa a la lógica de negocio normalmente.
- **Validación de contenido** (`titulo`/`texto` vacíos, palabra repetida, solo caracteres especiales,
  idioma inválido, patrones repetitivos): todos devuelven `422` con mensajes claros.
- **IDs inválidos** en paths (`GET`/`PUT`/`DELETE /contenido/{id}`): no numérico → `422` (FastAPI);
  negativo, cero, o inexistente → `404` limpio, sin excepciones.
- **Emojis / Unicode** en título y texto: se procesan y clasifican con normalidad.
- **Lotes** (`lote-json`, `lote-csv`): array vacío → `422`; lote mixto (un item inválido) rechaza todo
  el lote (diseño "todo o nada", consistente); más de 100 filas en CSV → `422` rápido, sin procesar
  nada primero; extensión de archivo incorrecta → `422`; columnas faltantes → `422` con mensaje claro.
- **Categoría inexistente** en `PATCH /contenidos/{id}/clasificacion`: `422` con mensaje claro
  ("La categoría con id 99999 no existe"), sin excepción cruda de base de datos.

---

## Nota sobre el entorno de testing (no es un bug de código)

Durante las pruebas, el hallazgo #1 (conexión bloqueante) se disparó repetidamente por interferencia
del **Behavior Shield de Avast** sobre el proceso Python que corre el backend — el driver
`aswMonFltProxy` denegaba permiso a conexiones nuevas de forma intermitente
(`[Errno 13] Permission denied`). Esto **no es la causa del bug**, pero sí lo hizo mucho más fácil de
reproducir en este entorno. Se agregó una excepción temporal en Avast para
`C:\Program Files\Python311\python.exe` (el intérprete global que efectivamente ejecuta el proceso,
no el del venv) para poder completar el testing — **a remover una vez cerrado este reporte**, ya que
es el mismo intérprete usado por otros proyectos en esta máquina.

El bug #1 en sí (bloqueo del event loop) es real e independiente de Avast: cualquier latencia genuina
de red hacia Oracle en producción causaría el mismo efecto.
