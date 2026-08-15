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

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función de ayuda
show_help() {
    echo -e "${BLUE}🚀 Script de gestión de TechKnowledge (Docker)${NC}"
    echo ""
    echo "Uso: ./techmind.sh [comando] [opciones]"
    echo ""
    echo "Comandos disponibles:"
    echo -e "  ${GREEN}init${NC}      Inicializa el entorno (crea .env desde ejemplo)"
    echo -e "  ${GREEN}build${NC}     Construye las imágenes Docker"
    echo -e "  ${GREEN}up${NC}        Levanta todos los servicios en segundo plano"
    echo -e "  ${GREEN}down${NC}      Detiene y remueve los contenedores"
    echo -e "  ${GREEN}restart${NC}   Reinicia los servicios"
    echo -e "  ${GREEN}rebuild${NC}   Reconstruye las imágenes e inicia los servicios"
    echo -e "  ${GREEN}logs${NC}      Muestra los logs de todos los servicios"
    echo -e "  ${GREEN}logs [svc]${NC} Muestra logs de un servicio específico"
    echo -e "  ${GREEN}status${NC}    Muestra el estado de los contenedores"
    echo -e "  ${GREEN}clean${NC}     Elimina contenedores, redes y volúmenes (¡borra datos!)"
    echo -e "  ${GREEN}prune${NC}     Elimina imágenes no utilizadas y limpiar Docker"
    echo -e "  ${GREEN}dev${NC}       Configura entorno de desarrollo"
    echo -e "  ${GREEN}prod${NC}      Configura entorno de producción"
    echo ""
    echo "Ejemplos:"
    echo "  ./techmind.sh init"
    echo "  ./techmind.sh up"
    echo "  ./techmind.sh logs backend"
    echo "  ./techmind.sh clean"
}

# Función para verificar .env
check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  Archivo .env no encontrado. Ejecuta './techmind.sh init' primero.${NC}"
        return 1
    fi
    return 0
}

# Función para inicializar entorno
init_env() {
    local ENV_TYPE=${1:-desarrollo}
    
    if [ -f .env ]; then
        echo -e "${YELLOW}⚠️  Archivo .env ya existe. ¿Deseas sobrescribirlo? (s/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Ss]$ ]]; then
            echo "Cancelado."
            return 1
        fi
    fi
    
    if [ "$ENV_TYPE" = "produccion" ]; then
        if [ -f .env.ejemplo-produccion ]; then
            cp .env.ejemplo-produccion .env
            echo -e "${GREEN}✅ .env creado desde .env.ejemplo-produccion${NC}"
        else
            echo -e "${RED}❌ Error: .env.ejemplo-produccion no encontrado${NC}"
            return 1
        fi
    else
        if [ -f .env.ejemplo-desarrollo ]; then
            cp .env.ejemplo-desarrollo .env
            echo -e "${GREEN}✅ .env creado desde .env.ejemplo-desarrollo${NC}"
        else
            echo -e "${RED}❌ Error: .env.ejemplo-desarrollo no encontrado${NC}"
            return 1
        fi
    fi
    
    echo -e "${YELLOW}⚠️  Recuerda configurar las credenciales en .env antes de continuar${NC}"
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado de los contenedores:${NC}"
    $DOCKER_COMPOSE ps
}

# Función para limpiar Docker
docker_prune() {
    echo -e "${YELLOW}⚠️  Esto eliminará imágenes no utilizadas. ¿Continuar? (s/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        docker system prune -f
        echo -e "${GREEN}✅ Limpieza completada${NC}"
    else
        echo "Cancelado."
    fi
}

# Subcomando predeterminado si no se pasa ninguno
PARAM=${1:-help}

case "$PARAM" in
    init)
        init_env desarrollo
        ;;
    dev)
        init_env desarrollo
        ;;
    prod)
        init_env produccion
        ;;
    build)
        echo -e "${GREEN}🟢 Construyendo imágenes...${NC}"
        check_env || exit 1
        $DOCKER_COMPOSE build
        ;;
    up)
        echo -e "${GREEN}🟢 Levantando el entorno...${NC}"
        check_env || exit 1
        $DOCKER_COMPOSE up -d
        echo -e "${GREEN}✅ Entorno levantado${NC}"
        echo -e "${BLUE}📝 Servicios disponibles:${NC}"
        echo "  Frontend: http://localhost:80"
        echo "  Backend:  http://localhost:8000"
        echo "  API Docs: http://localhost:8000/docs"
        ;;
    down)
        echo -e "${RED}🔴 Deteniendo servicios...${NC}"
        $DOCKER_COMPOSE down
        echo -e "${GREEN}✅ Servicios detenidos${NC}"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"
        $DOCKER_COMPOSE restart
        echo -e "${GREEN}✅ Servicios reiniciados${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}🔄 Reconstruyendo imágenes y levantando...${NC}"
        check_env || exit 1
        $DOCKER_COMPOSE up -d --build
        echo -e "${GREEN}✅ Imágenes reconstruidas y servicios levantados${NC}"
        ;;
    logs)
        if [ -n "$2" ]; then
            echo -e "${BLUE}📋 Logs del servicio: $2${NC}"
            $DOCKER_COMPOSE logs -f "$2"
        else
            echo -e "${BLUE}📋 Logs de todos los servicios${NC}"
            $DOCKER_COMPOSE logs -f
        fi
        ;;
    status)
        show_status
        ;;
    clean)
        echo -e "${RED}⚠️  Esto eliminará contenedores, redes y VOLÚMEN (¡borra datos de BD!)${NC}"
        echo -e "${YELLOW}¿Continuar? (s/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            $DOCKER_COMPOSE down -v
            echo -e "${GREEN}✅ Limpieza completada${NC}"
        else
            echo "Cancelado."
        fi
        ;;
    prune)
        docker_prune
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}⚠️ ERROR: Comando inexistente ${NC}"
        show_help
        ;;
esac
