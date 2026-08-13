# Resumen general — Data Science (para el equipo)

## 1. Dataset final (EN/ES)

- Limpieza completa del scraping de dev.to, deduplicado, sin ambiguedad de categorias ("etiquetas
  puras" -- se descartaron articulos con tags que cruzan mas de una categoria).
- Dataset final: **31,590 filas** por idioma, 7 categorias (Backend, Cloud, Data Engineering,
  Data Science, Database, DevOps, Frontend).
- Traduccion EN->ES hecha con modelo local **MarianMT** (`Helsinki-NLP/opus-mt-en-es`), offline,
  sin depender de ninguna API externa con limite de peticiones.
- Archivos: `dataset_devto_pure_labels_clean_en.csv` / `_es.csv`.

## 2. Modelo de clasificacion — historial de evaluacion

Metodologia siempre igual: split 80/20 estratificado, oversampling solo en train, TF-IDF + Logistic
Regression, comparado contra el mismo baseline en cada paso.

| Modelo / configuracion | Accuracy EN | Accuracy ES |
|---|---|---|
| Original sin balancear | 70.69% | -- |
| Real balanceado (oversampling) | 72.22% | 70.88% |
| Etiquetas puras (sin ambiguedad de categoria) | 76.47% | -- |
| **TF-IDF Config B (max_features=10000, min_df=2) + LogReg -- FINAL** | **77.21%** | **75.78%** |

Se evaluaron 6 alternativas para superar la Config B, **ninguna gano de forma significativa**:
LinearSVC (74.06/72.27%), XGBoost (74.80/73.20%, 50x mas lento), embeddings+LogReg (68.65/67.27%),
ComplementNB (75.56/74.17%), LinearSVC calibrado (76.31/75.09%), ensamble de los 3 (77.29/75.89%,
diferencia estadisticamente ruido). Se documenta para justificar por que seguimos con Config B.

**Hallazgo y fix de preprocesamiento**: se detecto que `clasificador.py` (Backend) limpiaba el texto
distinto al notebook de entrenamiento (quitaba puntuacion/digitos/acentos), rompiendo tokens como
"node.js" o "s3"/"gpt4". Se verifico que alinear el entrenamiento a esa limpieza mas agresiva
EMPEORA el modelo (-0.70pts EN, -0.28pts ES) -- se le paso el fix correcto a Backend
(`limpiar_texto_en/es` simplificadas a solo `.lower()` + normalizacion de espacios), consistente con
el preprocesamiento real de entrenamiento.

## 3. Notebooks del equipo (Colab)

- **`Limpieza_Datos_NLP.ipynb`** y **`02_vectorizacion_modelo.ipynb`**: adaptados con selector de
  idioma (`IDIOMA = "en"/"es"`, una corrida por idioma), Config B aplicada, oversampling agregado
  (el notebook original no lo tenia), serializacion en `model/en/` y `model/es/` separados.
- **`Notebook_EquipoCienciadeDatos_Consolidado.ipynb`** (el notebook grande del equipo, ambas
  versiones que se compartieron): se corrigieron bugs reales que rompian la ejecucion --
  - Traduccion rota: 2 bloques redundantes con `deep_translator.GoogleTranslator` (fallaban con
    "too many requests"), reemplazados por un unico bloque con MarianMT local.
  - Ruta de carga rota en la seccion EDA (trataba un archivo como si fuera una carpeta).
  - Nombre de archivo confuso (`dataset_devto_pure_labels_clean_es.csv` reusado para un dataset
    distinto) -- renombrado a `dataset_devto_es_prototipo.csv`.
  - `drive.mount()` triplicado y celdas vacias -- limpiado.
  - Bug de NaN reintroducido al recargar CSV (rompia `.apply(len)`) -- corregido con `fillna`.

## 4. PRs mergeados a `develop`

| PR | Contenido |
|---|---|
| **#2** (DS-04) | Modelo + vectorizador + label_mapping serializados, EN y ES, en `data-science/models/en/` y `es/` |
| **#3** (DS-02) | Datasets limpios EN/ES en `data-science/data/processed/` |
| **#5** (DS-01, abierto) | `shared/embeddings.py`: modulo reutilizable de embeddings para busqueda semantica |

## 5. Busqueda Semantica (evaluacion, seccion 3 de `enpoints-adicionales.md`)

- Modelo elegido: **`paraphrase-multilingual-MiniLM-L12-v2`** (sentence-transformers), 384
  dimensiones, multilingue EN/ES, local/offline.
- Validado con 2 pruebas: consistencia por categoria (65% match top-5, diferencia de medias muy
  significativa, p=2.68e-40) y 10 consultas manuales simulando busquedas reales de usuario (8/10
  con resultados muy relevantes).
- **Veredicto: el coseno de similitud SI refleja proximidad tematica real**, se recomienda avanzar
  con la feature.
- Entregado: `shared/embeddings.py` (PR #5) con `generar_embedding`, `generar_embeddings_batch`,
  `similitud_coseno`, y el umbral minimo recomendado (0.45) para filtrar resultados poco relevantes.

## 6. Sistema de Reentrenamiento (seccion 5 del doc)

- Recomendacion: **Opcion A** (`GET /dataset/exportar` + reentrenamiento externo en notebook), no
  Opcion B (automatico en backend, requiere infraestructura de tareas en background no justificada
  todavia).
- **Dependencia bloqueante detectada**: requiere primero la seccion 4 (columna
  `verificado_por_humano` + endpoint `PATCH /contenidos/{id}/clasificacion`), que **no esta
  implementada todavia** en ningun repo revisado.
- Se le paso a Backend una propuesta de codigo (sin tocar su repo) para ambos endpoints: migracion
  SQL, funciones de `database.py`, modelo de request, y los 2 endpoints nuevos.

## 7. Nota sobre la rama `BE-03/endpoint-semantica`

Se reviso a pedido: **no contiene busqueda semantica implementada** (su propia documentacion interna
la lista como pendiente). Ademas, su historial de Git no tiene ningun commit en comun con `develop`
-- mergearla tal cual borraria trabajo ya aprobado (modelos, datasets, docs de convenciones). Se
dejo sin tocar, pendiente de que el equipo decida como proceder.
