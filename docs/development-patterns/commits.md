# Commit Convention

El proyecto **TechKnowledge API** utiliza la especificación **Conventional Commits** para estandarizar el historial de cambios en el repositorio. Esto facilita el rastreo de cambios, la generación de logs y las automatizaciones de build.

---

## Formato principal

Cada commit debe seguir la siguiente estructura:

```bash
<tipo>(<alcance>): <descripcion> (<ID-Trello>)
```

Ejemplo:

```bash
feat(api): agregar endpoint de clasificacion de contenido (BE-01)
```

| Parte | Qué es | Ejemplo |
| :--- | :--- | :--- |
| `tipo` | Naturaleza del cambio | `feat`, `fix`, `docs` |
| `alcance` | Parte del proyecto (opcional) | `api`, `data`, `model`, `infra` |
| `descripcion` | Qué se hizo, en español, modo imperativo | `agregar endpoint de clasificacion` |
| `ID-Trello` | Código de la tarjeta Trello asociada | `(BE-01)`, `(DS-02)`, `(INFRA-01)` |

> [!NOTE]
> El `<alcance>` es altamente recomendado pero opcional. El `ID-Trello` al final también es opcional pero muy recomendado para trazabilidad.

---

## Tipos de commit permitidos

| Tipo | Uso | Ejemplo |
| :--- | :--- | :--- |
| `feat` | Nueva funcionalidad | `feat(api): agregar endpoint de clasificacion (BE-02)` |
| `fix` | Corrección de errores | `fix(service): manejar modelo no cargado (BE-02)` |
| `docs` | Documentación | `docs(project): actualizar readme con ejemplos (DS-01)` |
| `style` | Formato (espacios, linting) sin cambiar lógica | `style(api): aplicar formateo black (BE-01)` |
| `refactor` | Mejora de código sin cambiar comportamiento | `refactor(service): simplificar logica de prediccion (BE-03)` |
| `perf` | Mejoras de rendimiento | `perf(model): optimizar vectorizador tfidf (DS-03)` |
| `test` | Agregar o modificar tests | `test(api): agregar tests del endpoint health (QA-01)` |
| `build` | Cambios en el build o dependencias | `build: agregar fastapi a requirements.txt (BE-01)` |
| `chore` | Mantenimiento general | `chore(infra): configurar docker-compose (INFRA-01)` |
| `ci` | Pipelines de CI/CD | `ci: agregar workflow de validacion de PRs (INFRA-03)` |
| `revert` | Revertir commits anteriores | `revert: deshacer cambio en endpoint (BE-02)` |
| `deps` | Actualizar dependencias | `deps: actualizar scikit-learn a 1.3.0` |

---

## Alcances recomendados

| Alcance | Área | Equipo |
| :--- | :--- | :--- |
| `api` | Rutas, controladores, endpoints REST | Backend |
| `service` | Lógica de negocio, clasificación | Backend / DS |
| `models` | Schemas, DTOs, validaciones de entrada/salida | Backend |
| `core` | Configuración general del backend, conexiones | Backend |
| `data` | Datasets, limpieza, EDA, procesamiento | Data Science |
| `model` | Entrenamiento, serialización, pipeline ML | Data Science |
| `notebook` | Notebooks de Jupyter | Data Science |
| `ui` | Interfaz de usuario | Frontend |
| `infra` | Docker, OCI, deploy, infraestructura | DevOps |
| `docs` | Documentación en general | Todos |
| `test` | Tests automatizados | Testing/QA |
| `project` | Configuración del repo, README, .gitignore | Todos |
| `ci` | GitHub Actions, pipelines | DevOps |

---

## Reglas de formato

1. **Minúsculas**: Todo en minúsculas (tipo, alcance y descripción).
2. **Sin punto final**: La descripción no lleva punto (`.`).
3. **Modo imperativo**: La descripción expresa una acción: `agregar`, `corregir`, `configurar`.
4. **Límite de 72 caracteres**: La primera línea del commit no debe superar 72 caracteres.
5. **Espacio después de `:`**: Siempre dejar un espacio después de los dos puntos.
6. **Sin acentos**: Evitar acentos y caracteres especiales en la descripción para prevenir problemas en terminales (ej: `clasificacion` en vez de `clasificación`).

---

## Idioma

- **Español**: Las descripciones de los commits van en español (neutral).
- **Conventional Commits obligatorio**: El formato `<tipo>(<alcance>): <descripcion>` debe respetarse siempre.
- **ID de Trello**: Se recomienda incluir el ID de la tarjeta Trello al final entre paréntesis para trazabilidad: `(BE-01)`, `(DS-02)`.

---

## Ejemplos válidos

### Backend
```bash
feat(api): agregar endpoint POST de clasificacion (BE-02)
feat(service): implementar clase ClasificadorService (BE-02)
fix(api): corregir error 500 cuando texto esta vacio (BE-02)
feat(core): configurar CORS y pydantic-settings (BE-01)
```

### Data Science
```bash
feat(data): crear dataset con 500 registros por categoria (DS-01)
feat(data): aplicar limpieza de texto y normalizacion (DS-02)
feat(model): entrenar tfidf con regresion logistica (DS-03)
feat(model): serializar modelo y vectorizador con joblib (DS-04)
```

### Frontend
```bash
feat(ui): crear pagina principal con formulario de entrada (FE-01)
feat(ui): mostrar resultado de clasificacion en tarjeta (FE-01)
```

### DevOps / Infra
```bash
chore(infra): configurar docker-compose para backend (INFRA-01)
feat(infra): configurar object storage para modelos en oci (INFRA-02)
ci: agregar workflow de validacion de PRs (INFRA-03)
```

### Testing / QA
```bash
test(api): agregar tests del endpoint POST clasificacion (QA-01)
test(api): agregar tests de validacion de campos (QA-01)
```

---

## Ejemplos inválidos (Evitar)

- `feat: agregue endpoint` (Verbo en pasado, no imperativo)
- `fix(api): arreglando bug` (Gerundio en vez de imperativo)
- `update code` (Sin tipo ni alcance, genérico)
- `Feat(API): Agregar endpoint.` (Mayúsculas, punto final)
- `feat(api): agregué un endpoint nuevo` (Acento en `agregué`, verbo en pasado)
- `feat(api): agregar endpoint (BE-01) y corregir bug` (Dos cosas en un commit)
