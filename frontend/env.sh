#!/bin/sh

TARGET_FILE="/usr/share/nginx/html/env-config.js"

# Crear env-config.js dinámicamente con la URL del backend
# Si TK_BE_URL no está definida, usa localhost:8000 como fallback
cat <<EOF > "$TARGET_FILE"
window.API_CONFIG = {
    API_URL: "${TK_BE_URL:-http://localhost:8000}"
};
EOF

echo "🔧 env-config.js creado exitosamente con API_URL: ${TK_BE_URL:-http://localhost:8000}"
