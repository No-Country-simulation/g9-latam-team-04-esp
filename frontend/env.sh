#!/bin/sh

TARGET_FILE="/usr/share/nginx/html/env-config.js"

# Si existe la variable TK_BE_URL en el contenedor, reemplaza la URL
# Esto funciona tanto con la URL por defecto (localhost:8000) como con cualquier otra URL previa
if [ -n "$TK_BE_URL" ]; then
    echo "🔧 Configurando API_URL a: $TK_BE_URL"
    # Reemplazar cualquier URL entre comillas después de API_URL:
    sed -i "s|API_URL: \"[^\"]*\"|API_URL: \"$TK_BE_URL\"|g" "$TARGET_FILE"
    echo "✅ env-config.js actualizado exitosamente"
else
    echo "⚠️ TK_BE_URL no está definida, usando valor por defecto"
fi
