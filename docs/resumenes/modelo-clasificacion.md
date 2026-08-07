# Cómo clasifica el modelo — TechKnowledge API

Este documento explica, para quien no conoce mucho la parte de Data Science, cómo el
modelo decide a qué categoría pertenece un contenido técnico, qué información
devuelve y qué limitaciones hay que tener en cuenta.

## 1. Resumen del enfoque

El modelo es un pipeline clásico de clasificación de texto:

```
texto crudo → limpieza → vectorización TF-IDF → Regresión Logística → categoría + probabilidad
```

No es una red neuronal ni un modelo de lenguaje: es un modelo estadístico que
aprende qué **palabras y pares de palabras** están asociados a cada categoría,
a partir de ~31.000 artículos técnicos reales (dev.to) ya etiquetados.

Hay **dos modelos independientes**, uno por idioma (`model_en.joblib` /
`model_es.joblib`), cada uno con su propio vectorizador. El sistema detecta el
idioma del contenido automáticamente y usa el modelo que corresponde.

## 2. Paso a paso de una predicción

### 2.1 Detección de idioma

Se usa la librería `langdetect` sobre los primeros 500 caracteres de
`título + texto`. Si no puede determinarlo, cae por defecto a inglés.

> **Límite conocido:** con textos muy cortos o con vocabulario técnico mezclado
> (ej. nombres de librerías en inglés dentro de un texto en español),
> la detección puede equivocarse.

### 2.2 Limpieza de texto

El texto se limpia distinto según el idioma — **a propósito, no es un descuido**:

| | Inglés (`limpiar_texto_en`) | Español (`limpiar_texto_es`) |
|---|---|---|
| Minúsculas | Sí | Sí |
| Quita puntuación | Sí | Sí |
| Quita números | Sí | Sí |
| Quita acentos/diacríticos | **Sí** | **No** |

Se probó empíricamente aplicar la misma limpieza estricta (sin acentos) también
en español, y **bajaba el accuracy** (-0.7pt EN, -0.28pt ES en la comparación
que se hizo) — por eso el español conserva los acentos.

### 2.3 Vectorización (TF-IDF)

El texto limpio (`título + texto`) se convierte en un vector numérico con
`TfidfVectorizer`, configurado así (Config B, la que mejor resultado dio tras
evaluar varias combinaciones):

- `ngram_range=(1, 2)` — considera palabras sueltas y pares de palabras
  (ej. "api rest", "machine learning") como unidades con significado propio.
- `max_features=10000` — vocabulario limitado a los 10.000 términos más
  relevantes vistos en el entrenamiento.
- `min_df=2` — ignora términos que aparecen en menos de 2 documentos (ruido).
- `stop_words` — lista curada por el equipo (`shared/stop_words.py`, ~750
  palabras EN / ~950 ES) que se descarta antes de vectorizar. Reemplazó a las
  stopwords nativas de NLTK/una lista hardcodeada más chica; se validó una
  mejora de +0.2 a +0.5 puntos de accuracy y confianza en ambos idiomas.

> **Límite conocido:** el vocabulario es fijo (aprendido en el entrenamiento).
> Términos nuevos o jerga que no existía en el dataset original no aportan
> señal al modelo hasta que se reentrena con datos que los incluyan (por eso
> existe la tarjeta de re-entrenamiento periódico, DS-05).

### 2.4 Clasificación (Regresión Logística)

El vector TF-IDF se pasa a un `LogisticRegression` (`class_weight="balanced"`,
`C=1.0`) entrenado para elegir entre **7 categorías**:

`Backend`, `Frontend`, `Cloud`, `DevOps`, `Database`, `Data Engineering`, `Data Science`

El modelo no da una única respuesta binaria: calcula una **probabilidad para
cada una de las 7 categorías** y devuelve la de mayor probabilidad como
`categoria`, junto con ese valor como `probabilidad` (0 a 1, funciona como
"confianza" de la predicción).

`class_weight="balanced"` compensa que hay categorías con más ejemplos que
otras en el dataset (ej. Frontend tiene ~5200 artículos, Cloud solo ~3000),
para que el modelo no favorezca de más a las categorías mayoritarias.

> **Límite conocido:** no hay un umbral mínimo de confianza implementado
> actualmente — el endpoint siempre devuelve *alguna* categoría, incluso si la
> probabilidad es baja (ej. 30%) porque el contenido es ambiguo o toca varios
> temas a la vez (ej. "cómo desplegar una base de datos en la nube" compite
> entre Database, Cloud y DevOps). Quien consuma la API debe mirar también
> el valor de `probabilidad`, no solo la `categoria`.

### 2.5 Términos clave (`informacion_adicional`)

Además de la categoría, se devuelven hasta 5 palabras: las de mayor peso
TF-IDF dentro del texto de entrada, excluyendo stopwords. No es un extractor
de keywords independiente (no usa RAKE ni un modelo aparte) — son literalmente
los términos que más pesaron en la propia decisión de clasificación, así que
sirven también para entender *por qué* el modelo eligió esa categoría.

## 3. Desempeño actual

Medido con split 80/20 estratificado (oversampling solo en entrenamiento, para
no filtrar información al set de prueba):

| | Accuracy | Confianza promedio |
|---|---|---|
| Inglés | 76.84% | 68.60% |
| Español | 75.37% | 67.27% |

Se evaluaron alternativas (XGBoost, ComplementNB, LinearSVC calibrado +
ensemble por soft-voting) y ninguna superó de forma consistente a este
pipeline, por lo que se mantiene TF-IDF + Regresión Logística en producción.

## 4. Consideraciones generales

- **Es un modelo "bag of words"**: no entiende contexto ni relaciones
  semánticas profundas, solo frecuencia de palabras/pares de palabras. Un
  texto irónico, ambiguo o que mezcla varios temas técnicos puede confundirlo.
- **Determinístico y explicable**: dado el mismo texto, siempre da el mismo
  resultado, y se puede explicar la decisión mirando los términos clave — a
  diferencia de un modelo tipo red neuronal, más difícil de auditar.
- **Necesita reentrenamiento periódico**: la tecnología cambia rápido; nuevas
  herramientas/frameworks no aparecen en el vocabulario hasta reentrenar con
  datos que los incluyan.
- **La búsqueda semántica es un mecanismo aparte**: usa embeddings
  (`sentence-transformers`) y similitud de coseno, no este modelo — están
  documentados por separado porque resuelven problemas distintos (clasificar
  vs. encontrar contenido parecido por significado).
- **Validado con tests automatizados** (`tests/test_modelo.py`, tarjeta QA-02):
  confirman que el modelo carga, predice con la estructura esperada, cubre las
  7 categorías y no rompe con entradas vacías — pero no miden accuracy (eso se
  hace aparte, con el notebook de evaluación).

## 5. Dónde vive cada pieza

| Qué | Dónde |
|---|---|
| Modelos serializados | `data-science/models/en/`, `data-science/models/es/` |
| Lógica de carga y predicción | `backend/src/services/clasificador.py` |
| Lista de stopwords compartida | `shared/stop_words.py` |
| Notebook de entrenamiento | `data-science/notebooks/` |
| Tests del modelo | `tests/test_modelo.py` |
