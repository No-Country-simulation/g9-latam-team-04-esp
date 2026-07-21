# Git Workflow

Este documento describe el flujo de trabajo Git adoptado en el proyecto **TechKnowledge API**, detallando las ramas utilizadas, la creación de ramas de funcionalidad, el flujo de hotfixes y las rutinas recomendadas para mantener el repositorio limpio.

---

## Branch Structure

El proyecto utiliza el siguiente flujo principal de ramas:

- `main`: Rama estable, contiene solo código probado y listo para producción (entrega o deploy).
- `develop`: Rama principal de desarrollo, donde las nuevas funcionalidades se integran para pruebas de integración.
- **Temporary Branches**: Creadas para tareas específicas (nuevas features, correcciones, refactorizaciones, documentación, pruebas, etc.).

Todo desarrollo regular debe iniciar desde la rama `develop`. La única excepción son correcciones críticas de producción (hotfixes), que parten directamente de `main`.

---

## Creating a Development Branch

Para iniciar el desarrollo de una tarea (siempre asociada a una Issue):

1. **Update your local develop**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create the temporary branch**:
   ```bash
   git checkout -b feature/12/add-content-endpoint
   ```

3. **Push your changes**:
   ```bash
   git add .
   git commit -m "feat(api): add content classification endpoint"
   git push origin feature/12/add-content-endpoint
   ```

> [!TIP]
> **Keep your branch in sync:** During development, if other branches are merged into `develop`, update your local branch by running `git merge develop` or `git rebase develop`. This reduces the likelihood of conflicts in the Pull Request.

---

## Hotfix Flow

Hotfixes are critical urgent fixes applied directly to the production environment (`main`).

1. **Create the branch from main**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/15/fix-critical-production-error
   ```

2. **After applying the fix**:
   ```bash
   git add .
   git commit -m "fix(api): fix critical error in content analysis"
   git push origin hotfix/15/fix-critical-production-error
   ```

3. **Integration**:
   - Open the Pull Request directly against `main`.
   - **Important:** After approval and merge of the PR into `main`, bring this fix back to `develop`. You can open a PR from `main` to `develop` or merge locally and push.

---

## Team Recommendations

### Before starting any task
Always sync the local `develop` branch:
```bash
git checkout develop
git pull origin develop
```

### Before opening a Pull Request
Check the status of your changes and recent local commits to ensure the commit message is correct:
```bash
git status
git log --oneline -5
```

### Cleaning up old local branches
After your Pull Request is approved and merged, update your local repository and clean up branches that were already integrated:
```bash
git checkout develop
git pull origin develop

# List local branches already merged into develop
git branch --merged develop

# Delete the merged local branch
git branch -d branch-name
```

### Cleaning up non-existent remote references
Remove references to branches that have already been deleted on GitHub:
```bash
git fetch --prune
```
