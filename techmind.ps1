# Script PowerShell para Windows 10/11 para facilitar la administración del proyecto
<#
.SYNOPSIS
    Script de ejecución para TechKnowledge en Windows (PowerShell)
.EXAMPLE
    .\run.ps1 up
    .\run.ps1 down
    .\run.ps1 logs
#>

# Detectar el comando de Docker Compose (v2 'docker compose' o v1 'docker-compose')
if (Get-Command docker compose -ErrorAction SilentlyContinue) {
    $DOCKER_COMPOSE = "docker compose"
} elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $DOCKER_COMPOSE = "docker-compose"
} else {
    Write-Host "❌ Error: Docker Compose no está instalado." -ForegroundColor Red
    exit 1
}

param (
    [string]$Command = "up"
)

# Definir valores por defecto para UID/GID para compatibilidad con el compose.yml
$env:CURRENT_UID = "1000"
$env:CURRENT_GID = "1000"

function Show-Help {
    Write-Host "🚀 Script de gestión de TechKnowledge (Docker)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\techmind.ps1 [comando]"
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host "  build     Construye las imágenes."
    Write-Host "  up        Levanta todos los servicios en segundo plano."
    Write-Host "  down      Detiene y remueve los contenedores."
    Write-Host "  rebuild   Reconstruye las imágenes e inicia los servicios."
    Write-Host "  logs      Muestra los logs de todos los servicios en tiempo real."
    Write-Host "  clean     Elimina contenedores y volúmenes (¡borra datos de BD!)."
}

switch ($Command.ToLower()) {
    "build" {
        Write-Host "🟢 Construyendo imágenes..." -ForegroundColor Cyan
        Copy-Item .\.env.desarrollo .\.env -Force
        & $DOCKER_COMPOSE build
    }
    "up" {
        Write-Host "🟢 Levantando el entorno con Docker Compose..." -ForegroundColor Green
        & $DOCKER_COMPOSE up -d
    }
    "down" {
        Write-Host "🔴 Deteniendo servicios..." -ForegroundColor Red
        & $DOCKER_COMPOSE down
    }
    "rebuild" {
        Write-Host "🔄 Reconstruyendo imágenes y levantando..." -ForegroundColor Yellow
        & $DOCKER_COMPOSE up -d --build
    }
    "logs" {
        & $DOCKER_COMPOSE logs -f
    }
    "clean" {
        Write-Host "⚠️ Eliminando contenedores, redes y volúmenes de datos..." -ForegroundColor Red
        & $DOCKER_COMPOSE down -v
    }
    default {
        Show-Help
    }
}
