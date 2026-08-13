"""
Configuración centralizada de la aplicación.
Las variables de entorno tienen prioridad sobre los valores por defecto.
"""

from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # FastAPI
    app_name: str = "TechKnowledge"
    app_version: str = "1.0.0"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5500", "http://127.0.0.1:5500"] # Des-hardcodear estas URLs.
    host: str = "0.0.0.0" # Ver si esto y lo de abajo seguirá siendo útil
    port: int = 8000

    # Modelos de clasificación
    # Inglés
    model_path_en: Path = Path("data-science/models/en/model_en.joblib")
    vectorizer_path_en: Path = Path("data-science/models/en/vectorizer_en.joblib")
    # Español
    model_path_es: Path = Path("data-science/models/es/model_es.joblib")
    vectorizer_path_es: Path = Path("data-science/models/es/vectorizer_es.joblib")

    # Carpeta donde el endpoint de export puede guardar los datasets de feedback
    # (para alimentar el reentrenamiento sin copiar/pegar manual).
    feedback_dir: Path = Path("data-science/data/feedback")

    # Recarga en caliente de modelos
    # Carpeta base de los modelos (métricas por idioma: data-science/models/{lang}/metrics.json)
    metrics_dir: Path = Path("data-science/models")
    # Intervalo en segundos del chequeo automático de recarga (0 = deshabilitado)
    reload_check_interval_s: int = 86400
    # Ruta al script de reentrenamiento lanzado por POST /modelos/reentrenar
    retrain_script_path: Path = Path("data-science/scripts/reentrenar.py")

    # Umbrales de reentrenamiento (usados por reentrenar.py); declarados aquí
    # para leerlos desde .env (prefijo TK_) sin que fallen por "extra".
    retrain_min_feedback: int = 50
    retrain_min_f1_improvement: float = 0.00

    # Token requerido en X-Admin-Token para endpoints de gestión
    # (POST /modelos/reentrenar). Vacío = gestión deshabilitada.
    admin_token: str = ""

    # Oracle Database
    # Pydantic buscará automáticamente TK_ORACLE_USER, TK_ORACLE_PASSWORD, etc.
    oracle_user: str = ""
    oracle_password: str = ""
    oracle_dsn: str = ""
    oracle_wallet_dir: str | None = None
    oracle_wallet_password: str | None = None

    # OCI Object Storage
    # Pydantic buscará automáticamente TK_OCI_ENABLED, TK_OCI_BUCKET_NAME, etc.
    oci_enabled: bool = False
    oci_config_path: Path | None = None
    oci_bucket_name: str = ""
    oci_namespace: str = ""

    # Lenguaje por defecto
    default_language: str = "auto"  # "auto" | "en" | "es"

    model_config = {
        "env_prefix": "TK_",
        "env_file": ".env",
        "extra": "ignore",
    }

settings = Settings()
