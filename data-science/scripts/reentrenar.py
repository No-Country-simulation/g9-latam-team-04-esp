#!/usr/bin/env python3
"""
Reentrena un modelo de clasificación (EN/ES) con base + feedback humano.

Replica EXACTA de la Config B del notebook ``02_vectorizacion_modelo_DS05_reentrenamiento.ipynb``
(tus compañeros), con pandas, salvo que el dataset de entrenamiento es SIEMPRE
``base + feedback`` (nunca solo feedback):

- Corpus: ``(titulo + ' ' + texto).str.lower()``
- ``dropna(subset=['titulo', 'texto'])``
- Split 80/20 estratificado (``random_state=42``, ``test_size=0.2``)
- Oversampling solo en TRAIN con ``groupby(...).sample(n=max_size, replace=True, random_state=42)``
- TF-IDF: ``ngram_range=(1, 2)``, ``max_features=10000``, ``min_df=2``
- LogisticRegression: ``max_iter=1000``, ``class_weight='balanced'``, ``C=1.0``, ``random_state=42``
- Stopwords desde ``shared/stop_words.py`` (misma fuente que la API y el notebook)

El feedback se lee de ``data/feedback/dataset_feedback_<idioma>.csv``. Ese archivo lo
genera el endpoint ``GET /contenidos/exportar-dataset?idioma=<idioma>&guardar=true``,
que ahora lo escribe directo en la carpeta de feedback (sin copy-paste manual).

Uso:
    python reentrenar.py es
    python reentrenar.py en --min-feedback 100 --force

Variables de entorno (con defaults):
    RETRAIN_MIN_FEEDBACK        mínimo de filas de feedback para entrenar (default: 50)
    RETRAIN_MIN_F1_IMPROVEMENT  mejora mínima de F1 macro para sobrescribir (default: 0.0)

Exit codes:
    0 -> entrenó y sobrescribió los artefactos
    2 -> datos insuficientes (feedback < mínimo) — no entrenó
    3 -> el F1 no superó al vigente — no sobrescribió
    1 -> error
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

# Raíz del repo (data-science/scripts/ -> repo) para importar shared.stop_words
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from shared.stop_words import STOP_WORDS_EN, STOP_WORDS_ES  # noqa: E402

# ── Config por defecto (puede pisarse con variables de entorno / flags)

DATA_DIR = REPO_ROOT / "data-science" / "data"
MODELS_DIR = REPO_ROOT / "data-science" / "models"

MIN_FEEDBACK = int(os.getenv("RETRAIN_MIN_FEEDBACK", "50"))
MIN_F1_IMPROVEMENT = float(os.getenv("RETRAIN_MIN_F1_IMPROVEMENT", "0.0"))

RANDOM_STATE = 42


# ── Carga de datos (pandas, igual que el notebook)

def _cargar_dataframe(path: Path) -> pd.DataFrame:
    """Lee un CSV con columnas titulo, texto, categoria."""
    df = pd.read_csv(path)
    # Mantener solo las columnas que el pipeline usa (el base trae metadatos extra)
    for col in ("titulo", "texto", "categoria"):
        if col not in df.columns:
            raise ValueError(f"El CSV {path.name} no tiene la columna '{col}'")
    return df[["titulo", "texto", "categoria"]]


def _preparar_df(df: pd.DataFrame) -> pd.DataFrame:
    """Quita nulos, normaliza categorías y construye el corpus.

    ``categoria`` se normaliza (strip + lower) para alinearla con las etiquetas
    de la base ``dataset_limpio_*.csv`` (todas en minúsculas). Sin esto, un
    feedback con mayúsculas ("Backend") crea clases duplicadas ("backend" +
    "Backend"), y clases con 1 solo ejemplo rompen el split estratificado
    (``stratify``). ``corpus`` ya se minúscula, como en el notebook.
    """
    df = df.dropna(subset=["titulo", "texto", "categoria"]).reset_index(drop=True)
    df["categoria"] = df["categoria"].astype(str).str.strip().str.lower()
    df["corpus"] = (df["titulo"].astype(str) + " " + df["texto"].astype(str)).str.lower()
    return df


def _oversample_train(
    X_train: pd.Series,
    y_train: pd.Series,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.Series, pd.Series]:
    """Sobremuestrea (con reemplazo) hasta que todas las clases igualen a la mayor.

    Mismo código del notebook: se alimenta desde un DataFrame auxiliar y se hace
    ``groupby('categoria').sample(n=max_size, replace=True, random_state=42)``.
    Se vuelve a mezclar (``sample(frac=1)``) antes de devolver.
    """
    train_df = pd.DataFrame({"corpus": X_train.values, "categoria": y_train.values})
    max_size = train_df["categoria"].value_counts().max()

    balanced_parts = []
    for categoria, grupo in train_df.groupby("categoria"):
        balanced_parts.append(grupo.sample(n=max_size, replace=True, random_state=random_state))

    train_balanced = (
        pd.concat(balanced_parts)
        .sample(frac=1, random_state=random_state)
        .reset_index(drop=True)
    )
    return train_balanced["corpus"], train_balanced["categoria"]


# ── Entrenamiento y evaluación (replica del notebook)

def entrenar_modelo(
    X_train: pd.Series,
    y_train: pd.Series,
    stop_words: list[str],
) -> tuple[TfidfVectorizer, LogisticRegression]:
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=10000,
        min_df=2,
        stop_words=stop_words,
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)

    modelo = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        C=1.0,
        random_state=RANDOM_STATE,
    )
    modelo.fit(X_train_tfidf, y_train)
    return vectorizer, modelo


def evaluar_modelo(
    modelo: LogisticRegression,
    vectorizer: TfidfVectorizer,
    X_test: pd.Series,
    y_test: pd.Series,
) -> dict:
    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = modelo.predict(X_test_tfidf)
    return {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "f1_macro": round(float(f1_score(y_test, y_pred, average="macro")), 4),
        "reporte": classification_report(y_test, y_pred, zero_division=0),
    }


# ── Persistencia

def _metricas_path(idioma: str) -> Path:
    return MODELS_DIR / idioma / "metrics.json"


def leer_metricas_vigentes(idioma: str) -> dict | None:
    path = _metricas_path(idioma)
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _backup_artefactos(idioma: str) -> None:
    """Copia los artefactos vigentes a backups/ antes de sobrescribir."""
    dir_modelo = MODELS_DIR / idioma
    stamp = time.strftime("%Y%m%d_%H%M%S")
    backup_dir = dir_modelo / "backups" / stamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    for nombre in (
        f"model_{idioma}.joblib",
        f"vectorizer_{idioma}.joblib",
        f"label_mapping_{idioma}.json",
        "metrics.json",
    ):
        origen = dir_modelo / nombre
        if origen.exists():
            shutil.copy2(origen, backup_dir / nombre)


def guardar_artefactos(
    idioma: str,
    modelo: LogisticRegression,
    vectorizer: TfidfVectorizer,
    metricas: dict,
) -> None:
    dir_modelo = MODELS_DIR / idioma
    dir_modelo.mkdir(parents=True, exist_ok=True)

    _backup_artefactos(idioma)

    joblib.dump(modelo, dir_modelo / f"model_{idioma}.joblib")
    joblib.dump(vectorizer, dir_modelo / f"vectorizer_{idioma}.joblib")

    label_mapping = {i: cat for i, cat in enumerate(modelo.classes_)}
    with (dir_modelo / f"label_mapping_{idioma}.json").open("w", encoding="utf-8") as f:
        json.dump(label_mapping, f, indent=2, ensure_ascii=False)

    with _metricas_path(idioma).open("w", encoding="utf-8") as f:
        json.dump(metricas, f, indent=2, ensure_ascii=False)


# ── Main

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Reentrena el modelo de un idioma.")
    parser.add_argument("idioma", choices=["en", "es"], help="Idioma a reentrenar")
    parser.add_argument(
        "--min-feedback",
        type=int,
        default=MIN_FEEDBACK,
        help=f"Mínimo de filas de feedback para entrenar (default: {MIN_FEEDBACK})",
    )
    parser.add_argument(
        "--min-f1-improvement",
        type=float,
        default=MIN_F1_IMPROVEMENT,
        help=f"Mejora mínima de F1 macro para sobrescribir (default: {MIN_F1_IMPROVEMENT})",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ignora los umbrales y sobrescribe igual",
    )
    args = parser.parse_args(argv)

    idioma = args.idioma
    stop_words = STOP_WORDS_EN if idioma == "en" else STOP_WORDS_ES

    print("=" * 60)
    print(f"  REENTRENAMIENTO " f"{idioma.upper()}")
    print("=" * 60)

    base_path = DATA_DIR / "processed" / f"dataset_limpio_{idioma}.csv"
    feedback_path = DATA_DIR / "feedback" / f"dataset_feedback_{idioma}.csv"

    if not base_path.exists():
        print(f"[ERROR] No se encontró el dataset base: {base_path}")
        return 1

    df_base = _cargar_dataframe(base_path)
    df_feedback = _cargar_dataframe(feedback_path) if feedback_path.exists() else pd.DataFrame()
    print(f"Base:     {len(df_base)} filas ({base_path.name})")
    print(f"Feedback: {len(df_feedback)} filas ({feedback_path.name if feedback_path.exists() else 'no existe'})")

    # ── Umbral 1: ¿hay suficiente feedback?
    if len(df_feedback) < args.min_feedback and not args.force:
        faltan = args.min_feedback - len(df_feedback)
        print(
            f"[ABORT] Feedback insuficiente para entrenar el modelo {idioma.upper()}.\n"
            f"  - Filas de feedback actuales:    {len(df_feedback)}\n"
            f"  - Mínimo requerido (--min-feedback): {args.min_feedback}\n"
            f"  - Faltan {faltan} fila(s) para alcanzar el mínimo.\n"
            "Exportá más feedback con GET /contenidos/exportar-dataset?guardar=true "
            f"o usá --force para forzar con lo disponible."
        )
        print("-" * 60)
        return 2

    # ── Datos combinados (base + feedback) y preparación
    df = _preparar_df(pd.concat([df_base, df_feedback], ignore_index=True))
    print(f"Filas útiles tras limpieza: {len(df)} | Categorías: {df['categoria'].nunique()}")

    if df["categoria"].nunique() < 2:
        print("[ERROR] Se necesitan al menos 2 categorías para entrenar.")
        return 1

    X = df["corpus"]
    y = df["categoria"]

    # ── Split estratificado + oversampling (solo en train)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    X_train_bal, y_train_bal = _oversample_train(X_train, y_train)
    print(f"Train (balanceado): {len(X_train_bal)} | Test: {len(X_test)}")

    # ── Entrenar y evaluar
    vectorizer, modelo = entrenar_modelo(X_train_bal, y_train_bal, stop_words)
    metricas = evaluar_modelo(modelo, vectorizer, X_test, y_test)
    metricas.update({
        "idioma": idioma,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "filas_base": len(df_base),
        "filas_feedback": len(df_feedback),
    })
    print(f"Accuracy: {metricas['accuracy']:.4f} | F1 macro: {metricas['f1_macro']:.4f}")

    # ── Umbral 2: ¿supera al modelo vigente?
    vigentes = leer_metricas_vigentes(idioma)
    if vigentes is not None and not args.force:
        f1_vigente = vigentes.get("f1_macro")
        if f1_vigente is not None and metricas["f1_macro"] < f1_vigente + args.min_f1_improvement:
            diferencia = metricas["f1_macro"] - f1_vigente
            if diferencia < 0:
                veredicto = "el nuevo es PEOR al vigente"
                regla = "No se sobrescribió nada ni se generó backup (regla: no reemplazar con un modelo peor)."
            else:
                veredicto = "el nuevo es MEJOR, pero no alcanza la mejora mínima requerida"
                regla = "No se generó backup (regla: se exige mejorar al menos la mejora mínima para reemplazar)."
            print(
                f"[ABORT] El modelo {idioma.upper()} no pasó la prueba de métricas: {veredicto}.\n"
                f"  - F1 macro NUEVO (con feedback):     {metricas['f1_macro']:.4f}\n"
                f"  - F1 macro VIGENTE (en producción):  {f1_vigente:.4f}\n"
                f"  - Mejora mínima requerida:          +{args.min_f1_improvement:.4f}\n"
                f"  - Diferencia:                        {diferencia:.4f}  -> NO se sobrescribe\n"
                f"{regla}\n"
                f"Para forzar el reemplazo:  python reentrenar.py {idioma} --force"
            )
            print("-" * 60)
            return 3

    guardar_artefactos(idioma, modelo, vectorizer, metricas)
    print("-" * 60)
    print("[OK] Entrenamiento completado y modelos reemplazados.")
    print(f"     Artefactos escritos en {MODELS_DIR / idioma}/")
    print("-" * 60)
    print(json.dumps({k: v for k, v in metricas.items() if k != "reporte"}, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001 - último recurso: dar un mensaje claro
        print(f"[ERROR] No se pudo completar el reentrenamiento: {e}")
        print("Revisá los datos de entrada (base y feedback) o ejecutá desde una terminal para ver el traceback completo.")
        sys.exit(1)