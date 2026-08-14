# TechMind — imagen única: API FastAPI + frontend estático servido por el mismo
# proceso (main.py monta frontend/ en la raíz). Lista para OCI Compute.
FROM python:3.12-slim

# Sin .pyc en el contenedor y logs sin buffer (importante en Docker)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias primero: aprovecha la capa de cache de Docker
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Código completo: backend + frontend + modelos joblib + datos procesados.
# El .dockerignore mantiene la imagen liviana (sin .git, notebooks, raw, etc.).
COPY . .

EXPOSE 8000

# uvicorn sirve API + frontend en el mismo puerto (mismo origin, sin CORS).
CMD ["uvicorn", "backend.src.main:app", "--host", "0.0.0.0", "--port", "8000"]
