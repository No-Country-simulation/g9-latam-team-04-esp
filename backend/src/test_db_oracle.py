"""
Test de búsqueda semántica con filtro por categoría "frontend".
"""
import array
from dotenv import load_dotenv

load_dotenv()

from core.database import get_connection
from services.embeddings import embeddings_service

# ── 1. Verificar el modelo de embeddings
print("Verificando modelo de embeddings...")
if not embeddings_service.cargado:
    raise SystemExit("No se pudo cargar el modelo. Revisá que 'sentence-transformers' esté instalado.")

# ── 2. Texto de consulta y parámetros
TEXTO_CONSULTA = "estilos dinámicos componentes reactivos"
CATEGORIA = "frontend"
TOP_N = 5

print(f"\nConsulta: {TEXTO_CONSULTA!r} (Categoría: {CATEGORIA!r})")
vector_consulta = embeddings_service.generar(TEXTO_CONSULTA)

# ── 3. Query directa contra Oracle con filtro por categoría
with get_connection() as conn:
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                c.id,
                c.titulo,
                cat.nombre AS categoria,
                VECTOR_DISTANCE(c.embedding, :query_vec, COSINE) AS distancia
            FROM contenidos c
            JOIN clasificaciones cl ON c.id = cl.contenido_id
            JOIN categorias cat     ON cl.categoria_id = cat.id
            WHERE c.embedding IS NOT NULL
              AND LOWER(cat.nombre) = LOWER(:categoria)
            ORDER BY distancia ASC
            FETCH FIRST :top_n ROWS ONLY
            """,
            {
                "query_vec": array.array("f", vector_consulta),
                "categoria": CATEGORIA,
                "top_n": TOP_N,
            },
        )
        rows = cursor.fetchall()

# ── 4. Mostrar resultados
print(f"\n{len(rows)} resultado(s) encontrado(s):\n")
for row in rows:
    contenido_id, titulo, cat_nombre, distancia = row
    similitud = round(1.0 - float(distancia), 4)
    print(f"  [{similitud:.4f}] #{contenido_id} · {cat_nombre} · {titulo}")