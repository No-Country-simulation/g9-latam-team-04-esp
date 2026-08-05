#!/usr/bin/env bash
# Script Bash para sistemas tipo Unix (Linux y macOS) para facilitar la administración del proyecto
# Exit on error
set -e

# Detectar el comando de Docker Compose (v2 'docker compose' o v1 'docker-compose')
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: Docker Compose no está instalado."
    exit 1
fi

# Exportar IDs de usuario y grupo actual para evitar conflictos de permisos de root en Linux
export CURRENT_UID=$(id -u)
export CURRENT_GID=$(id -g)

# Función de ayuda
show_help() {
    echo "🚀 Script de gestión de TechKnowledge (Docker)"
    echo ""
    echo "Uso: ./techmind.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  up        Levanta todos los servicios en segundo plano."
    echo "  down      Detiene y remueve los contenedores."
    echo "  rebuild   Reconstruye las imágenes e inicia los servicios."
    echo "  logs      Muestra los logs de todos los servicios en tiempo real."
    echo "  clean     Elimina contenedores y volúmenes (¡borra datos de BD!)."
    echo ""
}

# Subcomando predeterminado si no se pasa ninguno
PARAM=${1:-up}

case "$PARAM" in
    up)
        echo "🟢 Levantando el entorno (UID: $CURRENT_UID, GID: $CURRENT_GID)..."
        $DOCKER_COMPOSE up -d
        ;;
    down)
        echo "🔴 Deteniendo servicios..."
        $DOCKER_COMPOSE down
        ;;
    rebuild)
        echo "🔄 Reconstruyendo imágenes y levantando..."
        $DOCKER_COMPOSE up -d --build
        ;;
    logs)
        $DOCKER_COMPOSE logs -f
        ;;
    clean)
        echo "⚠️ Eliminando contenedores, redes y volúmenes de datos..."
        $DOCKER_COMPOSE down -v
        ;;
    *)
        show_help
        ;;
esac
