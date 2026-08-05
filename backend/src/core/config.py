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
    host: str = "0.0.0.0"  # Pydantic buscará TK_HOST automáticamente
    port: int = 8000  # Pydantic buscará TK_PORT automáticamente

    # Modelos de clasificación
    # Inglés
    model_path_en: Path = Path("/app/data-science/models/en/model_en.joblib")
    vectorizer_path_en: Path = Path("/app/data-science/models/en/vectorizer_en.joblib")
    # Español
    model_path_es: Path = Path("/app/data-science/models/es/model_es.joblib")
    vectorizer_path_es: Path = Path("/app/data-science/models/es/vectorizer_es.joblib")

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

    model_config = {"env_prefix": "TK_", "env_file": ".env"}

settings = Settings()
