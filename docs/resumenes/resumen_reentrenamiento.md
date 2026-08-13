# Sistema de Reentrenamiento — Recomendacion Data Science

Referencia: seccion 5 de `enpoints-adicionales.md`

## Decision: Opcion A (extraccion para entrenamiento externo), no Opcion B

El doc plantea dos caminos. Se recomienda la **Opcion A** (`GET /dataset/exportar`):

- El propio doc la marca como *"Recomendado para empezar"*.
- La **Opcion B** (`POST /modelo/reentrenar`, automatico en el backend) requiere infraestructura nueva
  (Celery, Redis, o `BackgroundTasks`) solo para evitar que el entrenamiento bloquee el servidor --
  carga de ingenieria considerable, no justificada en esta etapa.
- La Opcion A **reutiliza el pipeline ya existente y validado** (`Limpieza_Datos_NLP.ipynb` ->
  `02_vectorizacion_modelo.ipynb`, con la Config B de hiperparametros ya elegida: TF-IDF
  max_features=10000, min_df=2 + Logistic Regression). El endpoint solo necesita devolver un CSV con
  columnas `titulo`, `texto`, `categoria` -- exactamente el esquema que el notebook ya espera. Cero
  cambios de codigo en el notebook.

## Dependencia bloqueante: Seccion 4 (Sistema de Feedback) no existe todavia

`GET /dataset/exportar?idioma=es&solo_verificados=true` necesita filtrar por `solo_verificados`, lo
cual depende de la columna `verificado_por_humano` descripta en la seccion 4 del doc. Se verifico en
ambos repos (`g9-latam-team-04-esp` y `mvp-team-05`) que **esa columna y el endpoint
`PATCH /contenidos/{id}/clasificacion` no estan implementados todavia**.

**Consecuencia:** la seccion 5 (al menos la parte de "solo verificados") no se puede cerrar del todo
hasta que Backend implemente primero la seccion 4. Se recomienda priorizar la seccion 4 antes que la 5
en el backlog del equipo.

## Entregables de Data Science para la Opcion A

1. **Esquema del CSV/JSON requerido**: `titulo`, `texto`, `categoria` (la corregida por el humano) --
   ya confirmado, sin cambios necesarios en el notebook de entrenamiento.
2. **Criterio de "cuando vale la pena reentrenar"**: en base a los experimentos ya realizados en este
   proyecto (agregar volumen bruto no mejoro accuracy de forma relevante; lo que si funciono fue
   resolver ambiguedad de etiquetas entre categorias solapadas como Backend/Cloud/DevOps), se propone
   priorizar la **calidad** de los registros verificados por categoria por sobre la cantidad bruta.
   Sugerencia concreta: no reentrenar hasta tener al menos ~200-300 registros verificados por
   categoria, y revisar que no se concentren todos en una sola categoria.
3. **Disciplina de reemplazo de modelo**: nunca sobrescribir los `.joblib` de produccion sin antes
   correr la misma metodologia de evaluacion comparativa que se uso en todo este proyecto (split
   estratificado + oversampling + comparacion de accuracy/F1 contra el modelo vigente antes de
   reemplazarlo).

## Proximo paso

Queda del lado de Backend: implementar primero la seccion 4 (columna `verificado_por_humano` +
endpoint `PATCH /contenidos/{id}/clasificacion`), y despues el endpoint `GET /dataset/exportar` de la
seccion 5 con el esquema de columnas confirmado arriba.
