FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para Oracle DB
RUN apt update && apt install -y --no-install-recommends \
    libaio1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente del backend
COPY ./src /app/src

# Copiar modelos de ML necesarios para el clasificador
COPY ../data-science/models /app/data-science/models

# Copiar directorio shared (stop words)
COPY ../shared /app/shared

EXPOSE 8000

# Ejecutamos FastAPI usando variables de entorno para host y puerto
CMD ["sh", "-c", "uvicorn src.main:app --host ${TK_HOST:-0.0.0.0} --port ${TK_PORT:-8000}"]
