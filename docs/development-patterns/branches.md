# Branch Naming Convention

Este documento detalla el estándar de nomenclatura obligatorio para la creación de ramas en el repositorio **TechKnowledge API**.

---

## Formato obligatorio

Toda rama temporal debe seguir estrictamente la siguiente estructura:

```bash
<tipo>/<ID-tarjeta>/<descripcion-corta>
```

### Significado

| Parte | Qué es | Ejemplo |
| :--- | :--- | :--- |
| `tipo` | Naturaleza del cambio | `feature`, `fix`, `docs`, `test` |
| `ID-tarjeta` | Código de la tarjeta en Trello | `BE-01`, `DS-02`, `INFRA-01` |
| `descripcion-corta` | Resumen de lo que se implementa, separado por guiones | `configurar-fastapi`, `crear-dataset` |

---

## Tipos permitidos

| Tipo | Cuándo usarlo |
| :--- | :--- |
| `feature` | Nueva funcionalidad. |
| `fix` | Corrección de errores. |
| `docs` | Documentación. |
| `test` | Tests automatizados. |
| `refactor` | Refactorización sin cambiar comportamiento. |
| `chore` | Tareas administrativas, Docker, dependencias, config. |
| `hotfix` | Corrección urgente de producción (desde `main`). |

---

## Reglas de formato

- **Solo minúsculas**: Nada de mayúsculas.
- **Separadores**: Usar guiones (`-`) entre palabras. No usar espacios, underscores (`_`) ni barras extras.
- **Sin acentos ni ñ**: Evitar caracteres especiales (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `ç`).
- **El ID de Trello debe coincidir** con la tarjeta asociada.

---

## Ejemplos prácticos

### Por equipo

#### Data Science
```bash
feature/DS-01/crear-dataset
feature/DS-02/eda-y-limpieza
feature/DS-03/entrenar-modelo
feature/DS-04/exportar-modelo
```

#### Backend
```bash
feature/BE-01/configurar-fastapi
feature/BE-02/servicio-clasificacion
feature/BE-03/endpoint-health
fix/BE-02/corregir-prediccion-nula
refactor/BE-02/optimizar-carga-modelo
```

#### Frontend
```bash
feature/FE-01/pagina-principal
feature/FE-02/mostrar-resultados
```

#### DevOps / Infra
```bash
feature/INFRA-01/docker-compose
feature/INFRA-02/oci-object-storage
chore/INFRA-04/actualizar-dependencias
```

#### Testing / QA
```bash
feature/QA-01/test-endpoint-clasificacion
test/QA-02/test-validacion-campos
```

### Otros ejemplos válidos
```bash
feature/BE-01/configurar-fastapi
fix/BE-02/corregir-validacion-texto
docs/DS-01/actualizar-readme
test/QA-01/agregar-tests-api
refactor/BE-03/mejorar-rendimiento
chore/INFRA-01/configurar-docker
hotfix/BE-02/arreglar-error-500-produccion
```

### Ejemplos inválidos (Evitar)

- `feat/BE-01/configurar` → usa `feat` en vez del tipo completo `feature`
- `feature/BE-01/ConfigurarFastapi` → mayúsculas
- `feature/configurar-fastapi` → falta el ID de Trello
- `feature/BE-01/configurar fastapi` → espacio en vez de guión
- `feature/BE-01/configurar-fastapi-análisis` → acento en `análisis`

---

## Recordatorio

Siempre crear la rama desde `develop`, nunca desde `main` ni desde la rama de otro compañero:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/BE-01/configurar-fastapi
```
