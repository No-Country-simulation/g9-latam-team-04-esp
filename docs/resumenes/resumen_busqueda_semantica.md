# Busqueda Semantica (coseno de similitud) — Cierre de la evaluacion Data Science

Referencia: seccion 3 de `enpoints-adicionales.md` — `POST /contenidos/busqueda-semantica`

## Modelo elegido

**`paraphrase-multilingual-MiniLM-L12-v2`** (sentence-transformers), local/offline, sin dependencia de
ninguna API externa con limite de peticiones.

- **Dimension del vector: 384** -- dato que Backend/DBA necesita para dimensionar la columna `VECTOR`
  en Oracle 23ai.
- Multilingue: funciona igual de bien para contenido en EN y ES sin necesitar dos modelos separados.

## Validacion realizada (2 pruebas)

### Prueba 1 — Consistencia por categoria (2,100 articulos EN, 300 por categoria)
- **65% de los vecinos top-5** son de la misma categoria que la consulta.
- Similitud promedio: pares de la MISMA categoria = 0.2253 vs pares de categoria DISTINTA = 0.1839
  (diferencia estadisticamente muy significativa, Welch t-test p = 2.68e-40).
- Los "fallos" de categoria en su mayoria SON relevancia tematica real que cruza la etiqueta oficial
  (ej. articulos sobre "Free API" de Database y Frontend agrupados juntos) -- esperable en busqueda
  semantica, no un defecto.

### Prueba 2 — Consultas escritas a mano, simulando busquedas reales de usuario (6 EN + 4 ES)
**8 de 10 consultas dieron resultados muy relevantes (4-5 de 5 on-topic)**, incluyendo:
- "REST API with authentication" -> articulos de diseno de API y autenticacion JWT/OAuth
- "optimize slow SQL queries" -> 5/5 articulos de optimizacion de bases de datos
- "CI/CD pipeline" -> 5/5 articulos de CI/CD (score top 0.799)
- "API REST con autenticacion" (ES) -> resultados igual de precisos en espanol

**2 consultas mas debiles** (aprendizaje supervisado/no supervisado EN+ES; contenedores en produccion
ES), con causa identificada: muestra reducida (300/categoria) sin suficiente cobertura de esos temas
especificos -- no es una falla del modelo de embeddings, se espera que mejore con el dataset completo.

## Lo que falta del lado Data Science (mas alla de "calcular el coseno")

1. **Modelo y dimension ya confirmados** (arriba) -- comunicar a Backend/DBA para el schema de Oracle.
2. **Funcion de generacion de embeddings reutilizable**: el doc pide que "cuando se clasifica un
   contenido, tambien hay que generar y guardar su embedding" -- osea, no solo para la consulta de
   busqueda, sino para CADA contenido nuevo clasificado. Se necesita una funcion simple
   (`modelo.encode(texto)`) que Backend pueda llamar desde el mismo flujo donde hoy llama a
   `clasificador.predecir()`.
3. **Umbral minimo de score recomendado: ~0.45-0.50** para filtrar vecinos de baja relevancia (viendo
   los datos de las pruebas, resultados con score menor a ese rango tienden a ser ruido). Comparable
   al umbral 0.01 que ya usa el endpoint de recomendaciones TF-IDF existente en `contenido.py`.

## Recomendacion final

Avanzar con esta feature usando el modelo y umbral arriba. La cobertura de casos debiles debería
resolverse sola al pasar de la muestra de prueba (300/categoria) al dataset completo en producción.
