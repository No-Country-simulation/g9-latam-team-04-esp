FROM python:3.12-slim

WORKDIR /app

# Variables de entorno Python (buenas prácticas Docker)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Variables para forzar solo CPU (sin CUDA/GPU)
ENV CUDA_VISIBLE_DEVICES=""
ENV TORCH_CUDA_ARCH_LIST=""

# Instalar dependencias del sistema necesarias para Oracle DB
RUN apt update && apt install -y --no-install-recommends \
    libaio1t64 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para caché de Docker layer
# NOTA: Compose construye desde la raíz del proyecto con context: .
COPY backend/requirements.txt .

# Instalar PyTorch CPU-only primero (más ligero)
RUN pip install --no-cache-dir --prefer-binary \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Instalar dependencias Python
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt && \
    pip cache purge

# Copiar código fuente del backend (solo lo necesario)
COPY backend/src/ ./src/

# Copiar shared desde el contexto de construcción (raíz del proyecto)
COPY shared/ ./shared/

# NOTA: Los modelos de ML NO se incluyen en la imagen de producción.
# En Docker Compose (desarrollo) se montan como volumen: ./data-science/models:/app/data-science/models
# En Kubernetes producción se montarán como ConfigMap/Secret o se descargarán de storage externo
# Esto permite actualizar modelos sin reconstruir la imagen.

EXPOSE 8000

# Ejecutamos FastAPI usando variables de entorno para host y puerto
CMD ["sh", "-c", "uvicorn src.main:app --host ${TK_HOST:-0.0.0.0} --port ${TK_PORT:-8000}"]
