"""
Categorias del clasificador y su(s) tag(s) correspondiente(s) en la API de dev.to.

Fuente unica de verdad, usada por los notebooks de recoleccion de datos
(RecopilacionDatos_DEVTO.ipynb y el consolidado) para saber que buscar.
Agregar una categoria nueva es agregar una linea aca -- no hace falta
tocar los notebooks.

El valor puede ser un solo tag (str) o una lista de tags -- los notebooks
recolectan articulos de todos los tags listados para esa categoria.
"""

CATEGORIAS = {
    "Backend": "backend",
    "Cloud": "cloud",   
    # Ampliado para el reentrenamiento del 02.08.2026: "engineering" solo no traia,  # suficientes articulos de Data Engineering.
    "Data Engineering": [
        "engineering", "pipeline", "etl", "python", "bigdata", "apachespark",
        "snowflake", "onpremise", "airflow", "kafka", "dbt", "warehouse",
    ],
    "Database": "database",
    "Data Science": "datascience",
    "DevOps": "devops",
    "Frontend": "frontend",
}
