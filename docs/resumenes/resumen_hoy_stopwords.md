# Resumen de hoy — Stopwords en el notebook de vectorizacion

## Que se hizo

1. **Se identifico un archivo `stop_words.py`** (compartido por Alan, ya vive en el repo como
   `shared/stop_words.py`) con listas mucho mas grandes que las que usaba el notebook: **744
   palabras EN / 946 ES**, contra las ~150 (ES, hardcodeadas) y las nativas de NLTK (198 EN / 313
   ES) que se usaban antes en distintas partes del notebook.

2. **Se verifico que no rompia nada existente**: las celdas 99/101 del notebook (que definen
   `STOP_WORDS_EN`/`STOP_WORDS_ES`) estaban **sin usar en ningun lado** -- codigo huerfano. La
   extraccion de keywords (Rake) usaba stopwords nativas de NLTK, no esas listas.

3. **Prueba chica (5+5 ejemplos) en la extraccion de keywords**: la lista de Alan filtra mejor
   relleno generico ("know", "use", "sabe") pero a veces tambien filtra algun termino util
   ("tablas" en un articulo de SQL) -- efecto real pero mixto, no se aplico todavia a esa parte.

4. **Prueba grande (dataset completo) en el vectorizador TF-IDF** -- comparando el notebook
   "normal" (stopwords actuales) contra el mismo notebook con la lista de Alan en el vectorizador:

   | | Accuracy EN | Confianza EN | Accuracy ES | Confianza ES |
   |---|---|---|---|---|
   | Normal (actual)       | 76.63%     | 68.44%     | 74.96%     | 66.81% |
   | **Con lista de Alan** | **76.84%** | **68.60%** | **75.37%** | **67.27%** |
   | Diferencia |           +0.21 pts   | +0.16 pts  | +0.41 pts  | +0.46 pts |

   Mejora **consistente en las 4 metricas**, mayor en espanol (lista mas grande respecto a NLTK).

5. **Se implemento en el notebook** (`Notebook_EquipoCienciadeDatos_Consolidado (2).ipynb`, celda
   de configuracion "1.1 Seleccion de idioma"): en vez de pegar la lista a mano, la celda ahora
   **descarga `shared/stop_words.py` directo desde el repo** (rama `develop`) y la importa --
   una sola fuente de verdad, compartida entre notebooks y la API de FastAPI.
   ```python
   !curl -sL -o shared_stop_words.py "https://raw.githubusercontent.com/No-Country-simulation/g9-latam-team-04-esp/develop/shared/stop_words.py"
   from shared_stop_words import STOP_WORDS_EN, STOP_WORDS_ES
   stop_words = STOP_WORDS_EN if IDIOMA == "en" else STOP_WORDS_ES
   ```

6. **Testeado en Colab por Liuberth**: corre correctamente de punta a punta.

## Pendiente / a decidir

- Conectar tambien la lista de Alan a la **extraccion de keywords** (celdas 99/101 + Rake) -- se
  vio que ayuda pero no se aplico todavia, quedo pendiente de decision del equipo.
- Se dejo una **lista ampliada de `irrelevant_keywords`** propuesta (para la etapa de recoleccion
  de datos, filtra spam de academias de cursos tipo "DevOps Training at Marathahalli" que aparecio
  en el dataset real) -- tambien pendiente de aplicar, a la espera de confirmacion.
- La celda de stopwords ahora depende de internet al ejecutarse (descarga del repo) -- funciona
  bien en Colab, pero si el repo cambia de rama/ubicacion habria que actualizar la URL.
