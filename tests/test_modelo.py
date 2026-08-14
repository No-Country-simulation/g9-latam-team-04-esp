"""
Tests del modelo de clasificacion (SPRINT-SX_QA-02).

Corren el pipeline tal como lo ejecuta el backend en produccion
(ClasificadorService), cargando los .joblib serializados en
data-science/models/en|es/. No requieren conexion a Oracle: cargar()
solo lee archivos locales.

Correr desde la raiz del repo:
    pytest tests/test_modelo.py -v
"""

from pathlib import Path

import pandas as pd
import pytest

from backend.src.services.clasificador import clasificador

RAIZ = Path(__file__).resolve().parent.parent
DATASETS = {
    "en": RAIZ / "data-science" / "data" / "processed" / "dataset_limpio_en.csv",
    "es": RAIZ / "data-science" / "data" / "processed" / "dataset_limpio_es.csv",
}


@pytest.fixture(scope="session", autouse=True)
def cargar_modelos():
    """Carga los modelos EN/ES una sola vez para toda la sesion de tests."""
    clasificador.cargar()


# ── 1. El modelo carga sin errores ──────────────────────────────────────

def test_modelo_en_carga_sin_errores():
    assert "en" in clasificador.modelos_disponibles, (
        "El modelo EN no cargo. Revisa que existan model_en.joblib y "
        "vectorizer_en.joblib en data-science/models/en/"
    )


def test_modelo_es_carga_sin_errores():
    assert "es" in clasificador.modelos_disponibles, (
        "El modelo ES no cargo. Revisa que existan model_es.joblib y "
        "vectorizer_es.joblib en data-science/models/es/"
    )


def test_categorias_no_vacias():
    assert len(clasificador.categorias) > 0


# ── 2. La prediccion devuelve la estructura esperada ────────────────────

@pytest.mark.parametrize("idioma,titulo,texto", [
    ("en", "How to deploy a Docker container",
     "Step by step guide to deploying containers with docker compose."),
    ("es", "Como desplegar un contenedor Docker",
     "Guia paso a paso para desplegar contenedores con docker compose."),
])
def test_prediccion_estructura_esperada(idioma, titulo, texto):
    resultado = clasificador.predecir(titulo, texto, idioma=idioma)

    assert set(resultado.keys()) >= {
        "categoria", "probabilidad", "informacion_adicional",
        "terminos_clave", "idioma",
    }
    assert isinstance(resultado["categoria"], str)
    assert resultado["categoria"] in clasificador.categorias
    assert isinstance(resultado["probabilidad"], float)
    assert 0.0 <= resultado["probabilidad"] <= 1.0
    assert isinstance(resultado["informacion_adicional"], list)
    assert resultado["idioma"] == idioma


# ── 3. Cada categoria del dataset se puede predecir ─────────────────────

def _muestra_por_categoria(idioma: str, n_por_categoria: int = 1):
    path = DATASETS[idioma]
    if not path.exists():
        pytest.skip(f"No se encontro el dataset {path}")
    df = pd.read_csv(path, encoding="utf-8-sig")
    df = df.dropna(subset=["titulo", "texto", "categoria"])
    partes = [
        grupo.sample(min(n_por_categoria, len(grupo)), random_state=42)
        for _, grupo in df.groupby("categoria")
    ]
    return pd.concat(partes, ignore_index=True)


@pytest.mark.parametrize("idioma", ["en", "es"])
def test_todas_las_categorias_predicen_sin_error(idioma):
    muestra = _muestra_por_categoria(idioma)
    categorias_vistas = set()

    for _, fila in muestra.iterrows():
        resultado = clasificador.predecir(fila["titulo"], fila["texto"], idioma=idioma)
        assert resultado["categoria"] in clasificador.categorias
        categorias_vistas.add(fila["categoria"])

    # No es un test de accuracy (eso ya se valido aparte) -- solo confirma
    # que el pipeline no rompe con texto real de cada categoria del dataset.
    assert len(categorias_vistas) == muestra["categoria"].nunique()


# ── 4. Texto vacio no rompe ──────────────────────────────────────────────

@pytest.mark.parametrize("idioma", ["en", "es"])
def test_texto_vacio_no_rompe(idioma):
    resultado = clasificador.predecir("", "", idioma=idioma)
    assert resultado["categoria"] in clasificador.categorias
    assert isinstance(resultado["probabilidad"], float)
    assert resultado["informacion_adicional"] == []


@pytest.mark.parametrize("idioma", ["en", "es"])
def test_solo_espacios_no_rompe(idioma):
    resultado = clasificador.predecir("   ", "   \n\t", idioma=idioma)
    assert resultado["categoria"] in clasificador.categorias
