# Correcciones aplicadas a Notebook_EquipoCienciadeDatos_Consolidado.ipynb

Archivo: `Notebook_EquipoCienciadeDatos_Consolidado (1).ipynb`
Total de celdas: 73 -> 66 (se eliminaron 4 celdas por consolidacion de la traduccion, 2 `drive.mount()` duplicados y 2 celdas vacias)

---

## 1. Traduccion EN -> ES rota (celdas 19-26 originales, 8 celdas)

**Problema:** Habia dos bloques de codigo distintos, ambos usando `deep_translator.GoogleTranslator`
(scraping no oficial de Google Translate, no una API):

- Bloque 1: fallaba con `Server Error: You made too many requests to the server` al enviar miles
  de peticiones en paralelo (`ThreadPoolExecutor`).
- Bloque 2 ("Probando Otra alternativa - Resultado de ejecucion lenta"): agregaba reintentos con
  backoff exponencial, pero **recalculaba todo desde cero**, pisando el resultado del bloque 1, y
  seguia usando el mismo endpoint (solo mas lento).
- Cuando fallaba, el codigo caia silenciosamente al texto original sin traducir, corrompiendo la
  calidad del dataset sin lanzar ningun error visible.

**Reemplazo (ahora celdas 18-21, 4 celdas):** un unico bloque de traduccion con **MarianMT local**
(`Helsinki-NLP/opus-mt-en-es`, via `transformers`), que corre offline sin depender de ningun
servicio externo con limite de peticiones. Usa GPU automaticamente si esta disponible
(`torch.cuda.is_available()`), y CPU si no. Guarda el resultado en las mismas rutas que ya
esperaba la celda siguiente (Drive + `/content/sample_data/`), sin tocar el resto del notebook.

---

## 2. Ruta de carga rota en la seccion EDA (ahora celda 55)

**Problema:**
```python
df = pd.read_csv('/content/sample_data/dataset.csv/dataset_inicial_devto_hackaton_eng_esp_final.csv', sep=';')
```
Trataba `dataset.csv` como si fuera una carpeta (copy-paste de dos rutas distintas mezcladas).
Lanzaba `FileNotFoundError` y bloqueaba toda la seccion de EDA que segia (distribucion de
categorias, longitud de textos, keywords, etc.).

**Fix:** corregida a la ruta real que exporta la celda anterior:
```python
df = pd.read_csv('/content/sample_data/dataset_inicial_devto_hackaton_eng_esp_final.csv', sep=';')
```

---

## 3. Nombre de archivo confuso (ahora celda 53)

**Problema:** el dataset traducido para prototipo se exportaba como `dataset_devto_pure_labels_clean_es.csv`
-- el mismo nombre que usan los datasets ya filtrados por "etiquetas puras" (sin ambiguedad entre
categorias) que se generaron en un pipeline distinto. Mismo nombre, contenido distinto: alto
riesgo de que alguien del equipo use el archivo equivocado.

**Fix:** renombrado a `dataset_devto_es_prototipo.csv` en las 3 rutas donde se exportaba
(Drive, `/content/sample_data/`, `/content/data/`).

---

## 4. Limpieza menor

- **`drive.mount('/content/drive/')` triplicado** (celdas 2, 15, 21 originales): se dejo solo la
  primera llamada; las otras dos eran redundantes (Drive ya queda montado para todo el notebook
  con la primera).
- **2 celdas de codigo vacias**: eliminadas.

---

## 5. Errores detectados durante la ejecucion real en Colab (post-fix)

Estos aparecieron al correr el notebook ya corregido, y se resolvieron sin tocar codigo (son de
entorno) o con un ajuste puntual:

### 5.1 `ValueError: Mountpoint must not already contain files` (al montar Drive)
**Causa:** quedo un montaje anterior a medias en la VM de Colab (runtime desconectado sin
desmontar, o el notebook ya se habia corrido antes en la misma sesion).
**Solucion:** `!rm -rf /content/drive` antes de volver a montar, o `Runtime > Restart runtime`
para limpiar el estado de la VM por completo. No requirio cambios en el notebook.

### 5.2 `TypeError: object of type 'float' has no len()` en la celda de longitud de textos (ahora celda 62)
**Causa:** en la seccion de limpieza se rellenan los nulos de `titulo_esp`/`texto_esp` con
`fillna('')`, pero al exportar a CSV y volver a cargarlo en la seccion de EDA, pandas relee los
campos vacios como `NaN` de nuevo (comportamiento por defecto de `read_csv`). Por eso `.apply(len)`
fallaba en las filas que habian quedado vacias tras la traduccion.
**Fix aplicado al notebook** (agregado al inicio de la celda 62):
```python
# Rellenar nulos: al exportar e importar CSV, los strings vacios que ya habiamos
# limpiado con fillna('') vuelven a leerse como NaN (comportamiento por defecto de
# read_csv), por eso hay que rellenarlos de nuevo antes de calcular longitudes con len()
for col in ['titulo', 'texto', 'titulo_esp', 'texto_esp']:
    df[col] = df[col].fillna('')
```

---

## Resumen ejecutivo

| # | Problema | Tipo | Estado |
|---|---|---|---|
| 1 | Traduccion con Google Translate (2 bloques redundantes, rate-limited) | Bug de arquitectura/confiabilidad | Reemplazado por MarianMT local |
| 2 | Ruta rota en carga de EDA (`dataset.csv/` como carpeta) | Bug de codigo (crash) | Corregido |
| 3 | Nombre de archivo ambiguo (`..._pure_labels_clean_es.csv`) | Riesgo de confusion, no crash | Renombrado |
| 4 | `drive.mount()` triplicado + celdas vacias | Limpieza | Eliminado |
| 5.1 | Mountpoint con archivos residuales | Error de entorno (VM), no de codigo | Workaround (rm -rf / restart) |
| 5.2 | NaN reintroducido al recargar CSV, rompe `.apply(len)` | Bug de codigo (crash) | Corregido (fillna agregado) |

El notebook quedo validado con `nbformat.validate()` en cada paso. No se ejecuto de punta a punta
de este lado -- las correcciones de la seccion 5 surgieron de la ejecucion real que hizo Liuberth
en Colab.
