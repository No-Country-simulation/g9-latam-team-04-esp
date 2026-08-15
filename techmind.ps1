# Script PowerShell para Windows 10/11 para facilitar la administración del proyecto
<#
.SYNOPSIS
    Script de gestión de TechKnowledge en Windows (PowerShell)
.EXAMPLE
    .\techmind.ps1 init
    .\techmind.ps1 up
    .\techmind.ps1 logs backend
    .\techmind.ps1 clean
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

# Definir valores por defecto para UID/GID para compatibilidad con el compose.yml
$env:CURRENT_UID = "1000"
$env:CURRENT_GID = "1000"

param (
    [string]$Command = "help",
    [string]$Service = ""
)

function Show-Help {
    Write-Host "🚀 Script de gestión de TechKnowledge (Docker)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\techmind.ps1 [comando] [opciones]"
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host "  init      Inicializa el entorno (crea .env desde ejemplo)" -ForegroundColor Green
    Write-Host "  build     Construye las imágenes Docker" -ForegroundColor Green
    Write-Host "  up        Levanta todos los servicios en segundo plano" -ForegroundColor Green
    Write-Host "  down      Detiene y remueve los contenedores" -ForegroundColor Green
    Write-Host "  restart   Reinicia los servicios" -ForegroundColor Green
    Write-Host "  rebuild   Reconstruye las imágenes e inicia los servicios" -ForegroundColor Green
    Write-Host "  logs      Muestra los logs de todos los servicios" -ForegroundColor Green
    Write-Host "  logs [svc] Muestra logs de un servicio específico" -ForegroundColor Green
    Write-Host "  status    Muestra el estado de los contenedores" -ForegroundColor Green
    Write-Host "  clean     Elimina contenedores, redes y volúmenes (¡borra datos!)" -ForegroundColor Yellow
    Write-Host "  prune     Elimina imágenes no utilizadas y limpiar Docker" -ForegroundColor Yellow
    Write-Host "  dev       Configura entorno de desarrollo" -ForegroundColor Green
    Write-Host "  prod      Configura entorno de producción" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ejemplos:"
    Write-Host "  .\techmind.ps1 init"
    Write-Host "  .\techmind.ps1 up"
    Write-Host "  .\techmind.ps1 logs backend"
    Write-Host "  .\techmind.ps1 clean"
}

function Check-Env {
    if (-not (Test-Path .env)) {
        Write-Host "⚠️  Archivo .env no encontrado. Ejecuta '.\techmind.ps1 init' primero." -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Init-Env {
    param([string]$EnvType = "desarrollo")
    
    if (Test-Path .env) {
        $response = Read-Host "⚠️  Archivo .env ya existe. ¿Deseas sobrescribirlo? (s/N)"
        if ($response -ne "s" -and $response -ne "S") {
            Write-Host "Cancelado."
            return $false
        }
    }
    
    if ($EnvType -eq "produccion") {
        if (Test-Path .env.ejemplo-produccion) {
            Copy-Item .env.ejemplo-produccion .env -Force
            Write-Host "✅ .env creado desde .env.ejemplo-produccion" -ForegroundColor Green
        } else {
            Write-Host "❌ Error: .env.ejemplo-produccion no encontrado" -ForegroundColor Red
            return $false
        }
    } else {
        if (Test-Path .env.ejemplo-desarrollo) {
            Copy-Item .env.ejemplo-desarrollo .env -Force
            Write-Host "✅ .env creado desde .env.ejemplo-desarrollo" -ForegroundColor Green
        } else {
            Write-Host "❌ Error: .env.ejemplo-desarrollo no encontrado" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host "⚠️  Recuerda configurar las credenciales en .env antes de continuar" -ForegroundColor Yellow
    return $true
}

function Show-Status {
    Write-Host "📊 Estado de los contenedores:" -ForegroundColor Cyan
    & $DOCKER_COMPOSE ps
}

function Invoke-Prune {
    $response = Read-Host "⚠️  Esto eliminará imágenes no utilizadas. ¿Continuar? (s/N)"
    if ($response -eq "s" -or $response -eq "S") {
        docker system prune -f
        Write-Host "✅ Limpieza completada" -ForegroundColor Green
    } else {
        Write-Host "Cancelado."
    }
}

switch ($Command.ToLower()) {
    "init" {
        Init-Env "desarrollo"
    }
    "dev" {
        Init-Env "desarrollo"
    }
    "prod" {
        Init-Env "produccion"
    }
    "build" {
        Write-Host "🟢 Construyendo imágenes..." -ForegroundColor Cyan
        if (-not (Check-Env)) { exit 1 }
        & $DOCKER_COMPOSE build
    }
    "up" {
        Write-Host "🟢 Levantando el entorno..." -ForegroundColor Green
        if (-not (Check-Env)) { exit 1 }
        & $DOCKER_COMPOSE up -d
        Write-Host "✅ Entorno levantado" -ForegroundColor Green
        Write-Host "📝 Servicios disponibles:" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:80"
        Write-Host "  Backend:  http://localhost:8000"
        Write-Host "  API Docs: http://localhost:8000/docs"
    }
    "down" {
        Write-Host "🔴 Deteniendo servicios..." -ForegroundColor Red
        & $DOCKER_COMPOSE down
        Write-Host "✅ Servicios detenidos" -ForegroundColor Green
    }
    "restart" {
        Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Yellow
        & $DOCKER_COMPOSE restart
        Write-Host "✅ Servicios reiniciados" -ForegroundColor Green
    }
    "rebuild" {
        Write-Host "🔄 Reconstruyendo imágenes y levantando..." -ForegroundColor Yellow
        if (-not (Check-Env)) { exit 1 }
        & $DOCKER_COMPOSE up -d --build
        Write-Host "✅ Imágenes reconstruidas y servicios levantados" -ForegroundColor Green
    }
    "logs" {
        if ($Service) {
            Write-Host "📋 Logs del servicio: $Service" -ForegroundColor Cyan
            & $DOCKER_COMPOSE logs -f $Service
        } else {
            Write-Host "📋 Logs de todos los servicios" -ForegroundColor Cyan
            & $DOCKER_COMPOSE logs -f
        }
    }
    "status" {
        Show-Status
    }
    "clean" {
        Write-Host "⚠️  Esto eliminará contenedores, redes y VOLÚMEN (¡borra datos de BD!)" -ForegroundColor Red
        $response = Read-Host "¿Continuar? (s/N)"
        if ($response -eq "s" -or $response -eq "S") {
            & $DOCKER_COMPOSE down -v
            Write-Host "✅ Limpieza completada" -ForegroundColor Green
        } else {
            Write-Host "Cancelado."
        }
    }
    "prune" {
        Invoke-Prune
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "⚠️ ERROR: Comando inexistente" -ForegroundColor Red
        Show-Help
    }
}
