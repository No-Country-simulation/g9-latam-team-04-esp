@'
# Backend - API de Clasificación y Búsqueda Semántica

Servicio Backend RESTful construido con **FastAPI**, **Python 3.13**, **Oracle Database** y modelos de Procesamiento de Lenguaje Natural (NLP) para la clasificación automática y búsqueda semántica de contenidos técnicos.

---

## 📋 Requisitos del Sistema

* **Python:** `3.13` (o superior)
* **Gestor de paquetes:** `pip`
* **Librerías C del sistema:** `libaio1` (requerido en Linux/Docker para Oracle Client)
* **Base de Datos:** Instancia de Oracle Database

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz de `backend/` con las siguientes variables:

| Variable | Descripción | Ejemplo / Valor por Defecto |
| :--- | :--- | :--- |
| `TK_HOST` | Host de ejecución | `0.0.0.0` |
| `TK_PORT` | Puerto del servidor | `8000` |
| `TK_ORACLE_USER` | Usuario de Oracle DB | `desafio4` |
| `TK_ORACLE_PASSWORD` | Contraseña de Oracle DB | `Celular1234567890` |
| `TK_ORACLE_DSN` | DSN / Conexión Oracle | `teamaluradesafio4_high` |
| `TK_ORACLE_WALLET_DIR` | Directorio de Oracle Wallet (opcional) | `` |
| `TK_ORACLE_WALLET_PASSWORD` | Contraseña del Wallet | `desafiogrupo4` |
| `TK_BE_URL` | URL base del backend | `http://localhost:8000` |

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar el repositorio e ingresar a la carpeta
```bash
git clone [https://github.com/No-Country-simulation/g9-latam-team-04-esp.git](https://github.com/tu-repositorio/g9-latam-team-04-esp.git)
cd g9-latam-team-04-esp
git fetch origin
git checkout BE-03/busqueda-semantica
cd backend