# Using Issues

En el proyecto **TechKnowledge API**, la organización y la trazabilidad del trabajo comienzan con la creación y el mantenimiento de **GitHub Issues**. Todo cambio en el código debe estar asociado a una Issue abierta y documentada.

---

## Mandatory Linking

- **No code changes should be made without a corresponding Issue.**
- Before starting any development or creating a branch, check the repository's Issues panel to see if there is already a card related to the task.
- If the Issue already exists, assign yourself (`Assignee`) and move it to the in-progress development column.
- If the task does not yet have an Issue, create one following the guidelines below.

---

## Creating a New Issue

Al abrir una nueva Issue, asegúrate de completar la siguiente información esencial:

1. **Descriptive Title**: Debe ser corto y describir claramente la entrega (ej: *Add content classification endpoint*).
2. **Full Description**: Describe detalladamente qué debe hacerse y qué problema se está resolviendo.
3. **Acceptance Criteria**: Una lista de requisitos o comportamientos esperados que deben cumplirse para que la Issue se considere completada.
4. **Impacted Area (Labels)**: Clasifica la Issue usando las etiquetas apropiadas del proyecto:
   - `backend`
   - `frontend`
   - `data-science` (notebooks, datasets, etc.)
   - `infra` / `docker` / `oci`
   - `documentation`
5. **Language**: Las Issues deben escribirse preferentemente en español (neutral).

---

## Association Example

El número generado por la Issue tras su creación será el identificador principal utilizado en el nombre de la rama de desarrollo correspondiente.

### Example

1. **Issue created on GitHub**:
   - Title: `#12 Add content classification endpoint`
   - Generated number: **12**

2. **Corresponding branch**:
   - Name: `feature/12/add-content-endpoint`

Al vincular la rama al número de la Issue, garantizamos la integración automatizada y una trazabilidad sencilla en el historial de GitHub.
