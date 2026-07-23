

# TechKnowledge API - Organizador Inteligente del conocimiento técnico

API inteligente para organizar contenido técnico mediante clasificación automática, extracción de información relevante y exposición de resultados en formato JSON, lista para integrarse con plataformas educativas, comunidades técnicas y repositorios de conocimiento.

## Descripción

TechKnowledge API recibe contenido técnico no estructurado, lo procesa con un modelo de Ciencia de Datos y devuelve una respuesta JSON con la categoría detectada, la probabilidad asociada y metadatos útiles para reutilización posterior

El MVP está diseñado para cumplir con los requisitos del hackathon: modelo entrenado y serializado, API REST funcional, validación de entrada, manejo de errores e integración con al menos un servicio de OCI

## Problema

Profesionales y estudiantes consumen gran cantidad de documentación, tutoriales, cursos y anotaciones técnicas, pero luego tienen dificultades para clasificar, encontrar y reutilizar ese conocimiento de forma eficiente.

Esta solución transforma texto técnico en conocimiento estructurado y consumible por otras aplicaciones a través de una API RESTful.

## Objetivo del MVP

Construir un servicio capaz de:

* Recibir contenido técnico en formato JSON.
* Clasificar automáticamente el contenido en una categoría temática.
* Extraer información adicional como palabras clave o tecnologías detectadas.
* Retornar una respuesta JSON consistente y útil para otras aplicaciones.
* Integrarse con OCI para almacenamiento, despliegue o exposición del servicio.

## Arquitectura

La arquitectura propuesta separa claramente la capa de Ciencia de Datos, la capa de API y la capa de infraestructura OCI.

### Componentes

|Componente|Función|
|-|-|
|Notebook de Ciencia de Datos|Construcción de dataset, EDA, limpieza, entrenamiento, evaluación y serialización del modelo.|
|Modelo serializado (`model.joblib`)|Empaqueta el pipeline de inferencia para que el backend lo cargue directamente.|
|API REST con FastAPI|Expone endpoints para predicción, salud y consulta de metadatos del modelo.|
|OCI Object Storage|Almacena artefactos del modelo, datasets o documentos asociados al MVP.|
|OCI API Gateway|Publica la API y permite definir despliegues mediante especificación JSON.|
|OCI Functions o Compute|Ejecuta la lógica backend según la estrategia de despliegue del equipo.|

### Flujo de procesamiento

1. El cliente envía un `POST /v1/contenido` con `titulo` y `texto`.
2. La API valida la entrada y construye el texto de inferencia.
3. El backend carga el modelo serializado y ejecuta la predicción.
4. Se calcula la categoría, probabilidad e información adicional.
5. La API devuelve un JSON consistente y listo para consumo externo.

## Dependencias principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| fastapi | ≥0.115,<1.0 | Framework web ASGI |
| uvicorn[standard] | ≥0.34,<1.0 | Servidor ASGI (el que corre la API) |
| pydantic | ≥2.0,<3.0 | Validación de datos de entrada/salida |
| pydantic-settings | ≥2.0,<3.0 | Config por variables de entorno |
| scikit-learn | ≥1.4,<2.0 | Modelo ML: TF-IDF + LogisticRegression |
| joblib | ≥1.3,<2.0 | Cargar/guardar modelo entrenado |
| numpy | ≥1.26,<2.0 | Operaciones numéricas del modelo |
| langdetect | ≥1.0.9,<2.0 | Detectar si el texto es EN o ES |

## Stack tecnológico

|Capa|Tecnología|
|-|-|
|Data Science|Python, Pandas, scikit-learn, TF-IDF, Logistic Regression, joblib.|
|API|FastAPI, Uvicorn.|
|Validación|Pydantic o validación nativa del framework.|
|OCI|Object Storage, API Gateway, Functions o Compute.|
|Documentación|README y OpenAPI generada por FastAPI.|


## Categorías del modelo

Para un MVP robusto y demostrable, se recomienda entrenar el clasificador con categorías bien diferenciadas:

* Backend
* Frontend
* Data Engineering
* Cloud
* DevOps
* Database

## Estructura del proyecto

```text
g9-latam-team-04-esp/
├── .github/
│    ├── ISSUE_TEMPLATE/
│    │   ├── bug.md                     → Template para reportar bugs
│    │   ├── feature.md                 → Template para nuevas funcionalidades
│    │   └── task.md                    → Template para tareas generales/chore
│    ├── pull_request_template.md       → Template de PR con checklist
│    └── workflows/
│        └── pr-conventions.yml         → CI que valida título y branch del PR
├── backend/                            → Todo lo relacionado a la Lógica de Negocio
│   ├── src/
│   │   ├── api/                        → Controladores / Rutas
│   │   ├── core/                       → Configuración, BD, servicios externos
│   │   ├── models/                     → DTOs / Schemas (lo que entra y sale)
│   │   ├── services/                   → Lógica de negocio
│   │   └── main.py                     → Entry point
│   └── requirements.txt
├── data/
├── data-science/                       → Todo lo relacionado al Modelado, procesamiento y servicio de ML (Python)
│   ├── data/                           → Archivos de datos (no subir archivos muy pesados)
│   │   ├── raw/                        → Los textos crudos originales (ej. dataset.csv)
│   │   └── processed/                  → Los textos limpios listos para entrenar
│   ├── notebooks/                      → Cuadernos de experimentación, exploración y limpieza de datos, entrenamiento del modelo
│   ├── models/                         → Modelos ya entrenados y listos para usar
│   └── requirements.txt                → Librerías de Python (pandas, scikit-learn, etc.)
├── frontend/                           → (Opcional) Todo lo relacionado a la Interfaz de Usuario
├── infrastructure/                     → Todo lo relacionado a la Infraestructura
├── docs/                               → Documentación adicional del proyecto
│   ├── development-patterns.md         → README principal de patrones
│   └── development-patterns/
│       ├── git-workflow.md             → Flujo Git (branches, hotfixes, limpieza)
│       ├── issues.md                   → Uso de Issues (vinculación obligatoria)
│       ├── branches.md                 → Nomenclatura de ramas
│       ├── commits.md                  → Conventional Commits + scopes
│       └── pull-requests.md            → PRs + Squash Merge + template
│
├── .gitignore                          → Para evitar subir archivos basura (__pycache__/, .vscode/, .env, target/, etc.)
└── README.md                           → El documento principal de presentación del proyecto
```

## Notebook de Ciencia de Datos

El notebook del equipo debe incluir como mínimo:

* Exploración y limpieza de datos.
* Tratamiento de textos.
* Construcción del corpus usando `titulo + texto`.
* Entrenamiento del pipeline `TF-IDF + Logistic Regression`, un enfoque alineado con las tecnologías sugeridas y adecuado para clasificación textual rápida y explicable.
* Evaluación con accuracy, precision, recall, F1-score y matriz de confusión.
* Serialización del modelo con `joblib`.

## Endpoints de la API

### 1\. Health check

**GET** `/v1/health`

Verifica que la API esté operativa.

**Response 200**

```json
{
  "status": "ok",
  "service": "techknowledge-api",
  "version": "1.0.0"
}
```

### 2\. Información del modelo

**GET** `/v1/model-info`

Devuelve metadatos del modelo cargado.

**Response 200**

```json
{
  "model\_name": "tfidf-logreg-v1",
  "version": "1.0.0",
  "algorithm": "TF-IDF + Logistic Regression",
  "categories": \[
    "Backend",
    "Frontend",
    "Data Engineering",
    "Cloud",
    "DevOps",
    "Database"
  ]
}
```

### 3\. Listado de categorías

**GET** `/v1/categorias`

Devuelve las categorías soportadas por el modelo.

**Response 200**

```json
{
  "categorias": \[
    "Backend",
    "Frontend",
    "Data Engineering",
    "Cloud",
    "DevOps",
    "Database"
  ]
}
```

### 4\. Predicción principal

**POST** `/v1/contenido`

Recibe contenido técnico y devuelve el resultado procesado por el modelo, cumpliendo el requisito mínimo funcional del hackathon.\[cite:68]

#### Request

```json
{
  "titulo": "Introducción a Spring Boot",
  "texto": "En este contenido se presentan los conceptos básicos para la creación de APIs REST utilizando Java y Spring Boot."
}
```

#### Response 200

```json
{
  "categoria": "Backend",
  "probabilidad": 0.89,
  "informacion\_adicional": \[
    "Java",
    "Spring Boot",
    "API REST"
  ],
  "modelo": {
    "nombre": "tfidf-logreg-v1",
    "version": "1.0.0"
  },
  "metadata": {
    "idioma": "es",
    "longitud\_texto": 109
  }
}
```

### 5\. Relacionados opcional

**POST** `/v1/contenido/relacionados`

Endpoint opcional para devolver contenidos similares usando similitud textual o embeddings, si el equipo alcanza a implementarlo.\[cite:46]

#### Request

```json
{
  "titulo": "Guía de Apache Spark",
  "texto": "Apache Spark permite procesar datos distribuidos mediante DataFrames y pipelines ETL.",
  "top\_k": 3
}
```

#### Response 200

```json
{
  "relacionados": \[
    {
      "id": "doc\_001",
      "titulo": "Introducción a Databricks",
      "categoria": "Data Engineering",
      "score": 0.94
    },
    {
      "id": "doc\_014",
      "titulo": "Procesamiento distribuido con Spark",
      "categoria": "Data Engineering",
      "score": 0.90
    },
    {
      "id": "doc\_031",
      "titulo": "ETL con PySpark",
      "categoria": "Data Engineering",
      "score": 0.87
    }
  ]
}
```

## Payloads de error

Una API REST madura debe usar respuestas de error consistentes, con payload estructurado y códigos HTTP apropiados.\[cite:55]\[cite:57]

### 400 Bad Request

Se usa cuando el JSON está mal formado o la solicitud no cumple requisitos básicos del protocolo.\[cite:55]

```json
{
  "error": {
    "code": "BAD\_REQUEST",
    "message": "El cuerpo de la solicitud no es un JSON válido"
  }
}
```
### 422 Unprocessable Entity

Se usa cuando el JSON está bien formado pero faltan campos requeridos o los valores no cumplen reglas de negocio.\[cite:55]\[cite:57]

```json
{
  "error": {
    "code": "VALIDATION\_ERROR",
    "message": "El campo texto es obligatorio y debe tener al menos 20 caracteres",
    "details": \[
      {
        "field": "texto",
        "issue": "too\_short"
      }
    ]
  }
}
```

### 500 Internal Server Error

Se usa cuando ocurre una falla inesperada durante la carga del modelo o el proceso de inferencia.\[cite:57]

```json
{
  "error": {
    "code": "INFERENCE\_ERROR",
    "message": "No fue posible procesar el contenido en este momento"
  }
}
```

## Esquema de validación sugerido

### Request schema

```json
{
  "titulo": "string, obligatorio, mínimo 5 caracteres",
  "texto": "string, obligatorio, mínimo 20 caracteres"
}
```

### Response schema

```json
{
  "categoria": "string",
  "probabilidad": "float",
  "informacion\_adicional": \["string"],
  "modelo": {
    "nombre": "string",
    "version": "string"
  },
  "metadata": {
    "idioma": "string",
    "longitud\_texto": "integer"
  }
}
```

## Ejemplos de uso

### Ejemplo 1: Backend

```bash
curl -X POST "http://localhost:8000/v1/contenido" \\
  -H "Content-Type: application/json" \\
  -d '{
    "titulo": "Introducción a Spring Boot",
    "texto": "En este contenido se presentan los conceptos básicos para la creación de APIs REST utilizando Java y Spring Boot."
  }'
```

### Ejemplo 2: DevOps

```bash
curl -X POST "http://localhost:8000/v1/contenido" \\
  -H "Content-Type: application/json" \\
  -d '{
    "titulo": "Automatización con Docker y CI/CD",
    "texto": "Este artículo explica cómo construir pipelines de integración continua y despliegue continuo usando contenedores y automatización."
  }'
```

### Ejemplo 3: Data Engineering

```bash
curl -X POST "http://localhost:8000/v1/contenido" \\
  -H "Content-Type: application/json" \\
  -d '{
    "titulo": "Procesamiento distribuido con Spark",
    "texto": "Apache Spark permite transformar grandes volúmenes de datos usando DataFrames, particionamiento y pipelines ETL distribuidos."
  }'
```

## Cómo ejecutar el proyecto

### 1\. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2\. Ejecutar la API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI puede utilizarse para construir una API de predicción ligera y exponer documentación OpenAPI automáticamente, lo que resulta útil para la demo del hackathon.

### 3\. Probar documentación automática

* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

## Integración con OCI

La integración mínima recomendada para cumplir el requisito obligatorio de OCI consiste en almacenar artefactos del modelo en Object Storage y desplegar la API mediante Compute o Functions, expuesta por API Gateway.

### Opción recomendada para desafío

* **Object Storage** para `model.joblib`, dataset demo y artefactos auxiliares.
* **API Gateway** para publicar rutas versionadas y ordenadas.
* **Compute** para alojar FastAPI si el equipo prioriza estabilidad de demo.
* **Functions** si el equipo prefiere una arquitectura serverless con backend gestionado por OCI API Gateway.

### Ejemplo base de despliegue OCI API Gateway

OCI permite definir un deployment en JSON para enrutar métodos y paths hacia un backend específico.

```json
{
  "routes": \[
    {
      "path": "/v1/contenido",
      "methods": \["POST"],
      "backend": {
        "type": "ORACLE\_FUNCTIONS\_BACKEND",
        "functionId": "ocid1.fnfunc.oc1..example"
      }
    }
  ]
}
```

## Dependencias sugeridas

```txt
fastapi
uvicorn
scikit-learn
pandas
numpy
joblib
pydantic
python-multipart
```

## Roadmap

### P0

* Dataset inicial.
* Notebook completo.
* Modelo serializado.
* Endpoint `POST /v1/contenido`.
* Validación y errores.
* Integración OCI mínima.
* README funcional.


### P1

* `GET /v1/model-info`
* `GET /v1/categorias`
* Persistencia simple.
* Tres ejemplos preparados para demo.

### P2

* Relacionados.
* Búsqueda semántica.
* Batch CSV.
* Docker.
* Tests automatizados.

## Mensaje final para la demo

TechKnowledge API no es solo un clasificador de texto: es la base de un repositorio inteligente de conocimiento técnico, capaz de transformar contenido no estructurado en información organizada, reutilizable y consumible por otras aplicaciones mediante una API REST desplegada sobre OCI.

