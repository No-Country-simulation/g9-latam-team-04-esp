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
    cors_origins: list[str] = ["*"]

    # Modelos de clasificación
    # Inglés
    model_path_en: Path = Path("data-science/models/en/model_en.joblib")
    vectorizer_path_en: Path = Path("data-science/models/en/vectorizer_en.joblib")
    # Español
    model_path_es: Path = Path("data-science/models/es/model_es.joblib")
    vectorizer_path_es: Path = Path("data-science/models/es/vectorizer_es.joblib")

    # Oracle Database
    oracle_user: str = "USERNAME_SCHEMA_SGOEJ"
    oracle_password: str = ""
    oracle_dsn: str = "tcps://db.freesql.com:2484/23ai_34ui2"
    oracle_wallet_dir: str | None = None
    oracle_wallet_password: str | None = None

    # OCI Object Storage
    oci_enabled: bool = False
    oci_config_path: Path | None = None
    oci_bucket_name: str = "techknowledge-models"
    oci_namespace: str = ""

    # Lenguaje por defecto
    default_language: str = "auto"  # "auto" | "en" | "es"

    model_config = {"env_prefix": "TK_", "env_file": ".env"}

settings = Settings()
