# TechKnowledge - Guía de Ejecución

## 📋 Requerimientos
- Máquina con cualquier Windows, macOS o Linux, de 64 bits.
- Docker Desktop (si se está en Linux, también puede ser y se recomienda Docker CE nativo, y para usar Docker Desktop la virtualización debe estar activada en la BIOS).
- Git adecuadamente configurado (con e-mail y nombre de usuario seteados).
- Cualquier editor de código, aunque se recomienda VSCodium o cualquier derivado suyo (como VSCode).
- Cuenta de Docker Hub para subir imágenes (para producción Kubernetes).

## 🚀 Entorno de Desarrollo (Docker Compose)

### Configuración Inicial
1. Copiar el archivo de ejemplo:
   ```bash
   cp .env.ejemplo-desarrollo .env
   ```

2. Modificar `.env` según necesidad:
   - Configurar credenciales de Oracle Database
   - Ajustar puertos si es necesario
   - Configurar variables TK_* según preferencias

### Ejecución con Scripts
Existen scripts automatizados para facilitar el despliegue:

#### Linux/macOS/WSL:
```bash
chmod +x techmind.sh
./techmind.sh up    # Levantar contenedores
./techmind.sh down  # Detener contenedores
./techmind.sh logs  # Ver logs
```

#### Windows:
```powershell
Set-ExecutionPolicy RemoteSigned
.\techmind.ps1 up    # Levantar contenedores
.\techmind.ps1 down  # Detener contenedores
.\techmind.ps1 logs  # Ver logs
```

### Ejecución Manual con Docker Compose
```bash
# Construir y levantar contenedores
docker compose up -d

# Ver logs
docker compose logs -f

# Detener contenedores
docker compose down
```

### Servicios Disponibles
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (admin/password123)

### Modelos de ML
Los modelos se montan como volumen desde `./data-science/models:/app/data-science/models`, permitiendo actualización sin reconstruir contenedores.

## 🌐 Entorno de Producción (Kubernetes)

### Configuración Inicial
1. Copiar el archivo de ejemplo:
   ```bash
   cp .env.ejemplo-produccion .env
   ```

2. Modificar `.env` con credenciales reales de producción

3. **Construir y subir imágenes a Docker Hub**:
   ```bash
   # Reemplaza [tu-usuario] con tu usuario real
   docker build -t [tu-usuario]/techknowledge-backend:v1 ./backend
   docker build -t [tu-usuario]/techknowledge-frontend:v1 ./frontend
   docker push [tu-usuario]/techknowledge-backend:v1
   docker push [tu-usuario]/techknowledge-frontend:v1
   ```

4. **Actualizar archivos K8s** con tus nombres de imágenes:
   - Editar `k8s/2-backend/backend-deployment.yml`
   - Editar `k8s/3-frontend/frontend-deployment.yml`
   - Reemplazar `tu-usuario-docker` con tu usuario real

### Configuración de Kubernetes
1. **ConfigMap y Secrets**:
   ```bash
   kubectl apply -f k8s/1-config/configmap.yml
   kubectl apply -f k8s/1-config/secrets.yml
   ```

2. **Backend**:
   ```bash
   kubectl apply -f k8s/2-backend/backend-deployment.yml
   kubectl apply -f k8s/2-backend/backend-service.yml
   ```

3. **Frontend**:
   ```bash
   kubectl apply -f k8s/3-frontend/frontend-deployment.yml
   kubectl apply -f k8s/3-frontend/frontend-service.yml
   ```

### Estrategia de Modelos en K8s
Los modelos de ML no están incluidos en la imagen Docker. Revisa `k8s/ESTRATEGIA_MODELOS_K8S.md` para las opciones disponibles:
- **Opción A**: PersistentVolumeClaim (recomendado para OCI OKE)
- **Opción B**: ConfigMap (no recomendado para archivos .joblib)
- **Opción C**: Descarga desde OCI Object Storage (ideal para producción)
- **Opción D**: InitContainer con OCI CLI

### Verificación de Despliegue
```bash
# Ver estado de pods
kubectl get pods

# Ver logs del backend
kubectl logs -f deployment/backend-deployment

# Ver logs del frontend
kubectl logs -f deployment/frontend-deployment

# Ver servicios
kubectl get svc
```

## 🔧 Configuración de Base de Datos

### Desarrollo (Docker Compose)
La base de datos Oracle se ejecuta en el contenedor `oracle-db` con las credenciales configuradas en `.env`.

### Producción (Kubernetes)
Configurar las credenciales reales en `k8s/1-config/secrets.yml`:
- `TK_ORACLE_USER`: Codificado en base64
- `TK_ORACLE_PASSWORD`: Codificado en base64
- `TK_ORACLE_DSN`: Codificado en base64
- `TK_ORACLE_WALLET_DIR`: Codificado en base64 (si aplica)

**Para codificar en base64:**
```bash
echo -n "tu_valor" | base64
```

## 📦 Construcción de Imágenes Docker

### Backend
```bash
cd backend
docker build -t techknowledge-backend:latest .
```

### Frontend
```bash
cd frontend
docker build -t techknowledge-frontend:latest .
```

### Optimizaciones Implementadas
- **.dockerignore**: Excluye archivos innecesarios
- **Copias selectivas**: Solo copia código necesario
- **Modelos separados**: Montados como volumen (no en imagen)
- **Variables Python**: `PYTHONDONTWRITEBYTECODE` y `PYTHONUNBUFFERED` en Dockerfile

## 🧪 Pruebas

### Probar API Localmente
```bash
# Health check
curl http://localhost:8000/health

# Clasificar contenido
curl -X POST http://localhost:8000/contenido \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Test", "texto": "Contenido de prueba"}'
```

### Probar Frontend
1. Abrir http://localhost:80
2. Ingresar título y texto
3. Ver resultado de clasificación
4. Ver historial de clasificaciones

## 📝 Variables de Entorno Importantes

### Variables Python (Buenas Prácticas)
- `PYTHONDONTWRITEBYTECODE=1`: Evita archivos .pyc
- `PYTHONUNBUFFERED=1`: Salida sin buffer

### Variables TechKnowledge (TK_*)
- `TK_DEBUG`: Modo desarrollo/producción
- `TK_HOST`/`TK_PORT`: Configuración del servidor
- `TK_ORACLE_*`: Credenciales de base de datos
- `TK_CONFIANZA_MINIMA`: Umbral de confianza del clasificador
- `TK_LOTE_MAXIMO`: Límite de procesamiento por lote
- `TK_TERMINOS_CLAVE_MAXIMOS`: Número de términos clave a extraer

## 🐛 Solución de Problemas

### Contenedores no inician
```bash
# Ver logs de contenedores
docker compose logs

# Verificar .env configurado correctamente
cat .env
```

### Error de conexión a Oracle
- Verificar credenciales en `.env`
- Verificar que el contenedor `oracle-db` esté corriendo
- Revisar `TK_ORACLE_DSN` para Docker Compose

### Modelos no cargan
- Verificar que `./data-science/models/` contenga los archivos .joblib
- Verificar montaje de volumen en Docker Compose
- Revisar configuración en K8s según estrategia elegida

## 📚 Documentación Adicional
- `ANALISIS_DOCKER_K8S.md`: Análisis detallado de configuración Docker/Kubernetes
- `k8s/ESTRATEGIA_MODELOS_K8S.md`: Estrategias para modelos ML en Kubernetes
- `PARAMETRIZACION_COMPLETADA.md`: Detalle de variables parametrizadas
