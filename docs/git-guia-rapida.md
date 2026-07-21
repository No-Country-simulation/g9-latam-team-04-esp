# 🚀 Guía Rápida de Git para el Equipo — TechKnowledge API

Si nunca usaste Git o lo usaste poco, esta guía es para vos. Explica desde cero cómo trabajar en equipo sin pisarnos.

---

## 📖 Índice

1. [Conceptos básicos (qué es una rama)](#-conceptos-básicos)
2. [Las ramas del proyecto](#-las-ramas-del-proyecto)
3. [Flujo de trabajo paso a paso](#-flujo-de-trabajo-paso-a-paso)
4. [Cómo crear tu rama](#-cómo-crear-tu-rama)
5. [Cómo hacer commits](#-cómo-hacer-commits)
6. [Cómo subir tu rama](#-cómo-subir-tu-rama)
7. [Cómo crear un Pull Request (PR)](#-cómo-crear-un-pull-request-pr)
8. [Ejemplos por equipo](#-ejemplos-por-equipo)
9. [Errores comunes y cómo evitarlos](#-errores-comunes)

---

## 🧠 Conceptos básicos

**Git** es un sistema que guarda el historial de cambios de tu proyecto. Como un "Ctrl+Z" gigante de todo lo que hace el equipo.

**Rama (branch)** es una copia del proyecto donde podés trabajar sin afectar a los demás. Cuando terminás, "unís" tu rama a la principal y todos ven tus cambios.

Imaginá que el proyecto es un documento compartido en Google Drive:
- `main` es la versión final que todos ven
- `develop` es el borrador donde se integra todo
- Tu rama es **tu copia local** donde escribís sin miedo a romper nada

---

## 🌳 Las ramas del proyecto

Solo tenemos **2 ramas especiales** que cuidan todo el equipo:

```
main ──────► la versión estable y funcional (solo para entregas/demo)
               
develop ───► la rama de integración (ahí se unen todos los equipos)
```

**Cada cuánto se mergea a `develop`?** Cuando completás una tarjeta de Trello y tu código funciona.

**Cada cuánto se mergea a `main`?** Cuando el equipo decide que hay una versión lista para mostrar (demo, entrega, etc.). Normalmente lo hace el líder de proyecto.

> ⚠️ **REGLAS DE ORO:**
> - Nadie hace push directo a `main` ni a `develop`
> - Todo cambio se hace en una **rama temporal** y se integra mediante **Pull Request**
> - Necesitás al menos 1 aprobación de otro compañero para mergear

---

## 🔄 Flujo de trabajo paso a paso

El ciclo completo de una tarea se ve así:

```
Trello: DS-01 ──► Crear rama ──► Commits ──► Push ──► PR a develop ──► Merge
```

```
develop ─────────────────────────────────────────────────────────────────
    │
    └── feature/DS-01/crear-dataset ──► commits ──► push ──► PR ──► merge a develop
                                                                        │
develop ◄────────────────────────────────────────────────────────────────
    │
    └── (cuando el equipo decide) ──► PR de develop a main
                                                                        │
main ◄───────────────────────────────────────────────────────────────────
```

---

## 🌿 Cómo crear tu rama

### PRIMERO: asegurate de tener la última versión de `develop`

```bash
# 1. Parate en develop
git checkout develop

# 2. Traete los cambios más recientes
git pull origin develop
```

### SEGUNDO: creá tu rama a partir de `develop`

```bash
git checkout -b feature/BE-01/configurar-fastapi
```

El nombre de la rama sigue esta fórmula:

```
<tipo>/<ID-de-tarjeta>/<descripcion-corta>
```

| Parte | Significado | Ejemplos |
|---|---|---|
| `tipo` | Qué tipo de cambio es | `feature`, `fix`, `docs`, `test`, `refactor`, `chore`, `hotfix` |
| `ID-de-tarjeta` | El código de tu tarjeta en Trello | `DS-01`, `BE-02`, `FE-01`, `INFRA-01`, `QA-01` |
| `descripcion-corta` | Resumen en español, separado por guiones | `crear-dataset`, `configurar-fastapi` |

**La rama SIEMPRE se crea desde `develop`**, nunca desde `main` ni desde la rama de otro compañero.

> ⚠️ Solo usar minúsculas y guiones. Nada de mayúsculas, espacios, acentos ni ñ.

---

## 💾 Cómo hacer commits

Un commit es como "guardar" tu progreso con un mensaje descriptivo.

### Formato del commit

```
<tipo>(<alcance>): <descripcion> (<ID-Trello>)
```

| Parte | Significado | Ejemplos |
|---|---|---|
| `tipo` | Tipo de cambio | `feat`, `fix`, `docs`, `test`, `refactor`, `chore` |
| `alcance` | Parte del proyecto que cambiás | `api`, `service`, `data`, `model`, `infra`, `docs` |
| `descripcion` | Qué hiciste, en español, sin punto final | `agregar endpoint de clasificacion` |
| `ID-Trello` | La tarjeta asociada, al final | `(BE-01)` |

### Tipos de commit y cuándo usarlos

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(api): agregar endpoint de clasificacion (BE-01)` |
| `fix` | Corregir un error | `fix(service): manejar modelo no cargado (BE-02)` |
| `docs` | Cambios en documentación | `docs(readme): actualizar ejemplos de uso (DS-01)` |
| `test` | Agregar o modificar tests | `test(api): agregar tests del endpoint health (QA-01)` |
| `refactor` | Mejorar código sin cambiar comportamiento | `refactor(service): simplificar logica de prediccion (BE-03)` |
| `chore` | Tareas administrativas | `chore(infra): configurar docker-compose (INFRA-01)` |

### Alcances disponibles

| Alcance | Qué abarca | Lo usa |
|---|---|---|
| `api` | Rutas, endpoints, controladores | Backend |
| `service` | Lógica de negocio | Backend |
| `models` | Schemas, DTOs, validaciones | Backend |
| `core` | Configuración general del backend | Backend |
| `data` | Datasets, limpieza, EDA | Data Science |
| `model` | Entrenamiento y serialización ML | Data Science |
| `notebook` | Notebooks de Jupyter | Data Science |
| `ui` | Interfaz de usuario (si aplica) | Frontend |
| `infra` | Docker, OCI, deploy, CI/CD | DevOps |
| `test` | Tests automatizados | Testing/QA |
| `docs` | Documentación en general | Todos |
| `project` | Configuración del repo, README | Todos |

### Ejemplo completo del día a día

```bash
# 1. Te parás en develop y actualizás
git checkout develop
git pull origin develop

# 2. Creás tu rama
git checkout -b feature/DS-01/crear-dataset

# 3. Trabajás... y cuando querés guardar cambios
git add .
git commit -m "feat(data): crear dataset con 500 registros por categoria (DS-01)"

# 4. Seguís trabajando... otro guardado
git add .
git commit -m "feat(data): agregar limpieza de texto y normalizacion (DS-01)"

# 5. Subís todo a GitHub
git push origin feature/DS-01/crear-dataset
```

---

## 📤 Cómo subir tu rama (push)

Cuando ya hiciste uno o más commits y querés que el resto vea tu avance:

```bash
git push origin feature/BE-01/configurar-fastapi
```

Si es la primera vez que subís esa rama, Git te va a pedir:

```bash
git push --set-upstream origin feature/BE-01/configurar-fastapi
```

Pero no te preocupes, el mismo Git te muestra el comando exacto si te equivocás.

### ¿Cada cuánto hacer push?

**Todo el tiempo.** Cada vez que tengas un avance significativo. No esperes a terminar todo. Esto:
- ✅ Hace backup de tu trabajo en GitHub
- ✅ Permite que otros vean tu progreso
- ✅ Evita perder cambios si se rompe tu computadora

---

## 🔀 Cómo crear un Pull Request (PR)

Un Pull Request es una **solicitud para unir tu rama a `develop`**. Es el paso obligatorio antes de que tu código pase al proyecto principal.

### Paso 1: Subí tu rama a GitHub

```bash
git push origin feature/DS-01/crear-dataset
```

### Paso 2: Crear el PR en GitHub

1. Andá a: `https://github.com/No-Country-simulation/g9-latam-team-04-esp`
2. Te va a aparecer un banner: **"feature/DS-01/crear-dataset had recent pushes"** → click en **"Compare & pull request"**
3. Completá el formulario:

```
Título:   feat(data): crear dataset con 500 registros por categoria (DS-01)
```

```
Cuerpo:

## Qué se hizo
- Se creó dataset con contenido técnico real (500+ registros por categoría)
- Se aplicó limpieza de texto (lowercase, sin acentos, sin puntuación)
- Se guardó en data-science/data/raw/dataset.csv

## Cómo probar
1. Abrir data-science/notebooks/01_eda.ipynb
2. Ejecutar todas las celdas
3. Verificar que el dataset se carga sin errores

## Tarjeta relacionada
Closes #DS-01
```

### Reglas del PR

- **Destino:** `develop` (nunca `main`)
- **Título:** Sigue el formato de commits: `tipo(alcance): descripcion (ID-Trello)`
- **Revisor:** Alguien de tu equipo o de otro equipo
- **Aprobación:** Necesitás al menos 1 "Approved" para mergear
- **Merge:** El que aprueba hace el **Squash Merge** (todos tus commits se convierten en UNO solo, limpio)

---

## 🎯 Ejemplos por equipo

### 📊 Data Science

| Tarjeta | Rama | Commits |
|---|---|---|
| DS-01 | `feature/DS-01/crear-dataset` | `feat(data): crear dataset con 500 registros por categoria (DS-01)` |
| DS-02 | `feature/DS-02/eda-y-limpieza` | `feat(data): analizar distribucion de categorias (DS-02)` |
| | | `feat(data): aplicar limpieza de texto y normalizacion (DS-02)` |
| DS-03 | `feature/DS-03/entrenar-modelo` | `feat(model): entrenar tfidf con regresion logistica (DS-03)` |
| DS-04 | `feature/DS-04/exportar-modelo` | `feat(model): serializar modelo y vectorizador con joblib (DS-04)` |

### ⚙️ Backend

| Tarjeta | Rama | Commits |
|---|---|---|
| BE-01 | `feature/BE-01/configurar-fastapi` | `feat(core): configurar proyecto FastAPI con estructura base (BE-01)` |
| BE-02 | `feature/BE-02/servicio-clasificacion` | `feat(service): implementar clase ClasificadorService (BE-02)` |
| | | `feat(api): agregar endpoint POST de clasificacion (BE-02)` |
| BE-03 | `feature/BE-03/endpoint-health` | `feat(api): agregar endpoint GET /v1/health (BE-03)` |

### 🎨 Frontend (si aplica)

| Tarjeta | Rama | Commits |
|---|---|---|
| FE-01 | `feature/FE-01/pagina-principal` | `feat(ui): crear pagina principal con formulario de entrada (FE-01)` |

### ☁️ DevOps / Infraestructura

| Tarjeta | Rama | Commits |
|---|---|---|
| INFRA-01 | `feature/INFRA-01/docker-compose` | `chore(infra): configurar docker-compose para backend y api (INFRA-01)` |
| INFRA-02 | `feature/INFRA-02/oci-object-storage` | `feat(infra): configurar object storage para modelos (INFRA-02)` |
| INFRA-03 | `feature/INFRA-03/ci-github-actions` | `ci(infra): agregar workflow de validacion de PRs (INFRA-03)` |

### 🧪 Testing / QA

| Tarjeta | Rama | Commits |
|---|---|---|
| QA-01 | `feature/QA-01/test-endpoint-clasificacion` | `test(api): agregar tests del endpoint POST /v1/contenido (QA-01)` |

---

## ❌ Errores comunes y cómo evitarlos

### "Hice cambios directo en `develop` sin querer"

Si todavía no commitearon:

```bash
git stash                        # guarda los cambios temporalmente
git checkout -b feature/mi-rama  # crea la rama que deberías haber usado
git stash pop                    # recupera los cambios
```

Si ya commitearon:

```bash
# Crear una rama desde donde estás (los commits se van con ella)
git checkout -b feature/mi-rama
# Volver develop a como estaba antes
git branch -f develop origin/develop
```

### "Mi rama está atrasada respecto a `develop`"

```bash
git checkout develop
git pull origin develop
git checkout feature/mi-rama
git merge develop
# Si hay conflictos, resolvelos y después:
git add .
git commit -m "feat: resolver conflictos con develop"
```

### "Me equivoqué en el mensaje del último commit"

```bash
git commit --amend -m "feat(api): mensaje corregido (BE-01)"
```

> ⚠️ Solo si todavía no hiciste push. Si ya subiste el commit, no uses `--amend`.

### "Subí un archivo que no debía (`.env`, `__pycache__`)"

Agregalo al `.gitignore` y después:

```bash
git rm --cached archivo-no-deseado.py
git commit -m "chore: remover archivo no deseado del repo"
```

### "Quiero ver en qué rama estoy"

```bash
git branch
# La rama actual tiene un * al lado
```

### "Quiero ver mi historial de commits"

```bash
git log --oneline -5
# Muestra los últimos 5 commits
```

---

## 📋 Checklist antes de hacer PR

- [ ] Probé que mi código funciona localmente
- [ ] No dejé `print()` ni `console.log()` de debug
- [ ] No hay archivos temporales (`__pycache__/`, `.env`, etc.)
- [ ] Los commits tienen el formato correcto con ID de Trello
- [ ] El nombre de la rama sigue el estándar
- [ ] Saqué `passwords`, `tokens` o `API keys` del código

---

## 💡 Resumen en 5 pasos

```
1. git checkout develop && git pull
2. git checkout -b feature/BE-01/mi-tarea
3. trabajo, git add . , git commit -m "feat(api): lo que hice (BE-01)"
4. git push origin feature/BE-01/mi-tarea
5. Crear PR en GitHub → develop
```

Si te trabás en cualquier paso, preguntá en el canal del equipo. Todos estamos aprendiendo.
