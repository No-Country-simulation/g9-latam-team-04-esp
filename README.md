# TechMind — El cerebro que entiende tu contenido técnico. La API, lo comparte

API inteligente + app web para organizar contenido técnico mediante clasificación automática, extracción de términos clave, búsqueda semántica y retroalimentación humana para reentrenar los modelos. Todo expuesto en JSON, listo para integrarse con plataformas educativas, comunidades técnicas y repositorios de conocimiento.

## Descripción

TechMind recibe contenido técnico no estructurado (título + texto), lo procesa con modelos de Ciencia de Datos entrenados por idioma (EN y ES) y devuelve una respuesta JSON con la categoría detectada, la probabilidad asociada, los términos clave y metadatos útiles para reutilización posterior.

El MVP cubre los requisitos del hackathon: modelos entrenados y serializados, API REST funcional con FastAPI, validación de entrada, manejo de errores, frontend completo (SPA en vanilla JS) e integración con OCI (Compute + Docker) y Oracle Database.

## Problema

Profesionales y estudiantes consumen gran cantidad de documentación, tutoriales, cursos y anotaciones técnicas, pero luego tienen dificultades para clasificar, encontrar y reutilizar ese conocimiento de forma eficiente.

Esta solución transforma texto técnico en conocimiento estructurado y consumible por otras aplicaciones a través de una API RESTful y una interfaz web.

## Objetivo del MVP

* Clasificar contenido técnico en 7 categorías temáticas por idioma (EN/ES).
* Extraer términos clave (TF-IDF) y detectar el idioma automáticamente.
* Buscar contenidos por significado (embeddings + similitud coseno).
* Permitir corrección humana de clasificaciones y exportar el feedback como dataset de reentrenamiento.
* Reentrenar los modelos en caliente cuando hay feedback nuevo.
* Proveer una app web (TechMind) que consume la misma API: clasificar, listar, editar, buscar y ver métricas en vivo.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Data Science | Python, pandas, scikit-learn (TF-IDF + Logistic Regression), joblib, sentence-transformers (embeddings) |
| API | FastAPI, Uvicorn |
| Base de datos | Oracle Database (oracledb, wallet/DSN) |
| Frontend | HTML + Tailwind CSS + vanilla JS (SPA con vistas por módulo) |
| Infraestructura | Docker, Docker Compose, OCI Compute |
| Validación | Pydantic v2 |

## Categorías del modelo

El clasificador (entrenado por separado para EN y ES) distingue **7 categorías**:

* `backend`
* `cloud`
* `data engineering`
* `data science`
* `database`
* `devops`
* `frontend`

## Estructura del proyecto

```text
g9-latam-team-04-esp/
├── .github/
│   ├── ISSUE_TEMPLATE/             → Templates de issues (bug/feature/task)
│   ├── pull_request_template.md    → Template de PR con checklist
│   └── workflows/
│       └── pr-conventions.yml      → CI que valida título y branch del PR
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── contenido.py        → Endpoints de contenido/clasificación/gestión
│   │   │   └── metricas.py         → GET/DELETE /metrics (telemetría en memoria)
│   │   ├── core/
│   │   │   ├── config.py           → Settings (variables TK_*)
│   │   │   ├── database.py         → Oracle: conexiones, CRUD, embeddings
│   │   │   └── telemetria.py       → Buffer en memoria para métricas de la API
│   │   ├── models/
│   │   │   ├── request.py          → Schemas de entrada (Pydantic)
│   │   │   ├── response.py         → Schemas de salida (Pydantic)
│   │   │   └── validators/         → Validadores reutilizables
│   │   ├── services/
│   │   │   ├── clasificador.py     → Carga/recarga de modelos EN/ES
│   │   │   ├── embeddings.py       → Generación de embeddings
│   │   │   └── reentrenador.py     → Dispara reentrenamiento en segundo plano
│   │   └── main.py                 → Entry point FastAPI (API + frontend estático)
│   └── requirements.txt
├── data-science/
│   ├── data/                       → Datasets (raw/processed/feedback)
│   ├── notebooks/                  → EDA, limpieza, entrenamiento
│   ├── models/                     → Modelos .joblib (EN y ES)
│   └── scripts/                    → reentrenar.py, etc.
├── frontend/
│   ├── index.html                  → SPA (vistas cargadas por módulos JS)
│   ├── css/                        → Tailwind + tema
│   ├── js/
│   │   ├── api.js                  → Wrapper de la API (mismo origen o TECHMIND_API_BASE)
│   │   ├── shell.js                → Layout/navegación
│   │   ├── i18n.js                 → Textos ES/EN
│   │   ├── contenido.js            → Vista Clasificar/Correcciones
│   │   ├── metricas.js             → Vista Métricas (telemetría real /metrics)
│   │   ├── buscar.js               → Búsqueda semántica
│   │   └── modelo.js               → Vista Modelo (reentrenamiento, F1)
│   └── assets/                     → Logos, avatares, data/team.json
├── docs/                            → Documentación del equipo (ver Anexos)
│   ├── api-contract.md              → Contrato de API
│   ├── git-guia-rapida.md           → Guía rápida de Git
│   ├── runbook-reentrenamiento.md   → Runbook de reentrenamiento
│   ├── reporte-testing-endpoints.md → Reporte de testing de endpoints
│   ├── development-patterns/        → Patrones de desarrollo (git, issues, branches)
│   ├── insomnia/                    → Colección Insomnia de la API
│   └── resumenes/                   → Resúmenes de decisiones del equipo
├── Dockerfile                       → Imagen única: API + frontend (puerto 8000)
├── docker-compose.yml               → Deploy OCI (volumen para feedback)
├── .env.example                     → Variables TK_* documentadas
├── .dockerignore
└── README.md
```

## Endpoints de la API

Todos los endpoints viven bajo la raíz (sin prefijo `/v1`). La documentación interactiva está en `/docs` (Swagger UI) y `/redoc`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/contenido` | Clasifica un contenido individual y lo persiste |
| `POST` | `/contenido/lote-json` | Clasifica hasta 100 contenidos desde JSON |
| `POST` | `/contenido/lote-csv` | Clasifica hasta 100 contenidos desde un CSV |
| `GET` | `/contenidos` | Lista/busca contenidos con filtros (q, categoria, página) |
| `GET` | `/contenido/{id}` | Detalle completo de un contenido |
| `PUT` | `/contenido/{id}` | Actualiza un contenido y lo re-clasifica |
| `DELETE` | `/contenido/{id}` | Elimina un contenido y sus registros asociados |
| `POST` | `/contenidos/busqueda-semantica` | Busca por significado (embeddings) |
| `GET` | `/categorias` | Lista las categorías soportadas |
| `PATCH` | `/contenidos/{id}/clasificacion` | Corrige/confirma la categoría (feedback humano) |
| `GET` | `/contenidos/exportar-dataset` | Exporta dataset de entrenamiento (CSV/JSON) |
| `GET` | `/health` | Health check (estado de API, modelos, embeddings) |
| `GET` | `/modelos/reentrenar/estado` | Estado del último reentrenamiento |
| `POST` | `/modelos/reentrenar` | Lanza reentrenamiento (requiere `X-Admin-Token`) |
| `GET` | `/metrics` | Métricas de telemetría en vivo (en memoria) |
| `DELETE` | `/metrics` | Limpia la telemetría (requiere `X-Admin-Token`) |

### Ejemplo: clasificar un contenido

```bash
curl -X POST "http://localhost:8000/contenido" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Introducción a Spring Boot",
    "texto": "En este contenido se presentan los conceptos básicos para la creación de APIs REST utilizando Java y Spring Boot.",
    "idioma": "auto"
  }'
```

Respuesta:

```json
{
  "id": 701,
  "titulo": "Introducción a Spring Boot",
  "texto": "En este contenido se presentan los conceptos básicos para la creación de APIs REST utilizando Java y Spring Boot.",
  "categoria": "backend",
  "probabilidad": 0.89,
  "informacion_adicional": ["Java", "Spring Boot", "API REST"],
  "idioma": "es"
}
```

### Autenticación

Todos los endpoints son abiertos salvo los de gestión, que requieren el header `X-Admin-Token` (variable `TK_ADMIN_TOKEN`):

* `POST /modelos/reentrenar`
* `DELETE /metrics`

La app nunca guarda el token: se pide en cada uso.

## Frontend (TechMind)

La app web es una SPA en vanilla JS servida por el mismo FastAPI (`/`). Incluye:

* **Clasificar** — formulario individual y carga por lote (JSON/CSV) con feedback de errores legibles.
* **Contenidos** — listado, búsqueda por texto/categoría, edición y eliminación.
* **Correcciones** — corregir/confirmar clasificaciones para alimentar el reentrenamiento.
* **Búsqueda semántica** — consultas por significado con embeddings.
* **Modelo** — estado de los modelos, F1 nuevo vs vigente y botón de reentrenamiento con token.
* **Métricas** — KPIs reales (API, modelos, embeddings, contenidos) y telemetría en vivo (`GET /metrics`): peticiones, latencia P95, tasa de éxito, tráfico por endpoint y logs recientes, con streaming opcional cada 2 s.
* **FAQ** — preguntas frecuentes y referencias de endpoints.
* **i18n** — textos en ES/EN con cambio de idioma en vivo y tema oscuro/claro.

Para desarrollo del frontend sin recargar el backend, servilo aparte y apuntá la API:

```html
<script>window.TECHMIND_API_BASE = "http://localhost:8000";</script>
```

## Cómo ejecutar el proyecto

### 1. Instalar dependencias

```bash
pip install -r backend/requirements.txt
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Completar credenciales Oracle (TK_ORACLE_*) y opcionales de OCI
```

### 3. Ejecutar la API (sirve también el frontend)

```bash
uvicorn backend.src.main:app --reload --host 0.0.0.0 --port 8000
```

La API y el frontend corren en el **mismo origen**:

* App TechMind: `http://localhost:8000/`
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

### 4. (Alternativa) Frontend standalone para desarrollo

```bash
# Terminal 1 — backend (puerto 8000)
uvicorn backend.src.main:app --reload --port 8000

# Terminal 2 — frontend estático (puerto 8080)
cd frontend && py -m http.server 8080
```

## Deploy en OCI (Compute + Docker)

La app está dockerizada como **una sola imagen** (API + frontend estático) lista para Oracle Cloud Infrastructure. La BD se mantiene en Oracle Database (FreeSQL.com o Autonomous Database), así que la VM solo necesita salida HTTPS hacia el DSN configurado en `.env`.

### 1. Preparar la imagen localmente (opcional, para validar)

```bash
docker build -t techmind:latest .
docker run --rm --env-file .env -p 8000:8000 techmind:latest
# Abrir http://localhost:8000 — debe verse la app TechMind completa
```

### 2. Crear la VM en OCI

1. **Compute → Instances → Create instance** (shape VM.Standard.E2.1.Micro o mayor; Ubuntu 22.04/24.04 o compatible con Docker).
2. En **Add SSH keys** subí tu clave pública.
3. En la **security list** de la VCN/subnet, abrí el puerto **8000** (ingress TCP 8000/8000, source `0.0.0.0/0`).
4. `docker` y `docker compose` vienen en la imagen de Ubuntu de OCI (o instalalos con `apt install docker.io docker-compose-v2`).

### 3. Desplegar

```bash
ssh ubuntu@<IP-PUBLICA>
git clone https://github.com/No-Country-simulation/g9-latam-team-04-esp.git
cd g9-latam-team-04-esp
cp .env.example .env
nano .env          # completar TK_ORACLE_* (y TK_ADMIN_TOKEN si querés reentrenar)
docker compose up -d --build
```

La app queda en `http://<IP-PUBLICA>:8000/`.

### 4. Actualizaciones

```bash
git pull
docker compose up -d --build   # reconstruye y reinicia con los cambios
```

### 5. Notas del deploy

* El frontend usa **mismo origen** (rutas relativas), así que no hay CORS en producción; `TK_CORS_ORIGINS` solo importa si servís el frontend aparte.
* Los modelos `.joblib` van dentro de la imagen; el reentrenamiento los reemplaza en caliente dentro del contenedor.
* El volumen `techmind_data` persiste el feedback exportado entre reinicios.
* La telemetría (`GET /metrics`) es **en memoria**: se pierde al reiniciar el contenedor y se limpia con `DELETE /metrics`.

## Roadmap

### P0 — Base

* Dataset inicial y notebook de entrenamiento.
* Modelos serializados (EN y ES) con `joblib`.
* API REST con FastAPI, validación Pydantic y manejo de errores.
* Persistencia en Oracle Database.
* README funcional.

### P1 — Producto

* Frontend completo (SPA): clasificar, listar, editar, búsqueda semántica, modelo, métricas.
* Búsqueda semántica con embeddings.
* Batch JSON/CSV.
* Corrección humana de clasificaciones (feedback).
* Export de dataset para reentrenamiento.
* Docker + Docker Compose + deploy OCI.

### P2 — Mejoras

* Reentrenamiento automático con feedback nuevo (ya implementado, en caliente).
* Telemetría de la API en vivo (ya implementado, en memoria).
* Connection pool para Oracle (`oracledb.create_pool()`).
* Tests automatizados.

## Equipo

| Nombre | Rol | GitHub | LinkedIn |
|--------|-----|--------|----------|
| Gabriel Sorrentino | Architect | [GabrielSorrentino](https://github.com/GabrielSorrentino) | [LinkedIn](https://www.linkedin.com/in/gabriel-sorrentino-5466283a1/) |
| Alan Arce | Data Scientist | [AlanSebastianArce](https://github.com/AlanSebastianArce) | [LinkedIn](https://www.linkedin.com/in/alansebastianarce) |
| Liuberth Escalona | Data Scientist | [Liuberth33](https://github.com/Liuberth33) | [LinkedIn](https://www.linkedin.com/in/liuberth-escalona) |
| Jaime Pradenas | BI Analyst | [jpraden](https://github.com/jpraden) | [LinkedIn](https://www.linkedin.com/in/jaime-esteban-pradenas-pizarro) |
| Román Martín | Backend Developer | [romannang01](https://github.com/romannang01) | [LinkedIn](https://www.linkedin.com/in/román-martín/) |
| Lucas Pavez | Backend Developer | [LucasKronos10](https://github.com/LucasKronos10) | [LinkedIn](https://www.linkedin.com/in/lucas-pavez/) |
| Jhonny Alvino | Full Stack Developer | [alvinoDev](https://github.com/alvinoDev) | [LinkedIn](https://www.linkedin.com/in/alvinodev/) |
| Henry Aspeti | Full Stack Developer | [HenBri](https://github.com/HenBri) | [LinkedIn](https://www.linkedin.com/in/henryaspeti/) |

## Anexos

Documentación adicional del equipo dentro de [`docs/`](docs/):

### Guías y referencias

| Documento | Descripción |
|-----------|-------------|
| [Guía rápida de Git](docs/git-guia-rapida.md) | Comandos esenciales y flujo de trabajo diario con Git. |
| [Patrones de desarrollo](docs/development-patterns.md) | Índice de patrones: git workflow, issues, branches, commits y PRs. |
| [Contrato de API](docs/api-contract.md) | Contrato formal de la API: rutas, payloads y códigos de respuesta. |
| [Despliegue de Infraestructura Cloud en OCI](https://github.com/No-Country-simulation/g9-latam-team-04-esp/blob/main/docs/Despliegue%20de%20Infraestructura%20Cloud%20en%20OCI.md) | Documentación de OCI. |
| [Guía de ejecución Docker](https://github.com/No-Country-simulation/g9-latam-team-04-esp/blob/main/docs/GUIA-EJECUCION.md) | Procedimiento paso a paso de ejecución Docker |
| [Runbook de reentrenamiento](docs/runbook-reentrenamiento.md) | Procedimiento paso a paso para reentrenar los modelos. |
| [Reporte de testing de endpoints](docs/reporte-testing-endpoints.md) | Resultados del testing exploratorio sobre los endpoints. |

### Patrones de desarrollo

* [Git workflow](docs/development-patterns/git-workflow.md) — flujo de ramas, hotfixes y limpieza.
* [Branches](docs/development-patterns/branches.md) — nomenclatura de ramas del equipo.
* [Commits](docs/development-patterns/commits.md) — Conventional Commits + scopes.
* [Issues](docs/development-patterns/issues.md) — uso de issues y vinculación obligatoria.
* [Pull requests](docs/development-patterns/pull-requests.md) — PRs + Squash Merge + template.

### Colecciones y resúmenes

* [Colección Insomnia de la API](docs/insomnia/techmind-api.yaml) — importable en Insomnia para probar todos los endpoints.
* [Resúmenes del equipo](docs/resumenes/) — decisiones y resúmenes de arquitectura, modelo de clasificación, búsqueda semántica y reentrenamiento.
