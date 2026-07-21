# Development Patterns — TechKnowledge API

Este documento define los estándares de Git, GitHub y procesos de entrega adoptados en el proyecto **TechKnowledge API**. El objetivo es mantener el repositorio limpio, organizado, productivo y con un historial de cambios trazable.

---

## Quick Reference

| Element | Standard | Notes / Examples |
| :--- | :--- | :--- |
| **Issue/PR language** | Spanish (neutral) | Preferred for team communication and documentation. |
| **Commit language** | English | Consistent with Conventional Commits spec. |
| **Branch** | `<type>/<issue-id>/<description>` | `feature/12/add-content-endpoint` |
| **Commit** | `<type>(<scope>): <description>` | `feat(api): add content classification endpoint` |
| **PR Title & Squash** | `<type>(<scope>): <description> (#<issue-id>)` | Use the main **Issue** number (not the PR number). No duplicates. |
| **PR Body** | Direct issue linking | `Closes #12` |
| **Merge Strategy** | **Squash Merge** | Consolidates all PR commits into a single clean commit. |
| **Extended Description** | Technical summary + `Closes #issue` | Replace the auto-generated list with a summary of what was delivered. |

---

## Detailed Documentation

1. 🔄 **[Git Workflow](development-patterns/git-workflow.md)**
   - Main branches structure (`main` and `develop`).
   - How to create working branches and useful shortcuts.
   - Emergency hotfix flow.
   - Cleaning up stale branches and references.

2. 📋 **[Using Issues](development-patterns/issues.md)**
   - Mandatory issue linking.
   - Rules for opening issues (acceptance criteria, labels, areas).
   - Practical integrated flow example.

3. 🌿 **[Branch Naming](development-patterns/branches.md)**
   - Mandatory naming structure.
   - Allowed types (`feature`, `fix`, `docs`, `test`, `refactor`, `chore`, `hotfix`).
   - Validations, restrictions (accents, uppercase, hyphens) and examples.

4. 💾 **[Commit Convention](development-patterns/commits.md)**
   - **Conventional Commits** specification.
   - Complete list of commit types (`feat`, `fix`, `refactor`, etc.).
   - Recommended scopes for the architecture.
   - Formatting rules and examples of correct and incorrect messages.

5. 🔀 **[Pull Requests & Squash Merge](development-patterns/pull-requests.md)**
   - Rules for opening PRs against `develop`.
   - Recommended description template.
   - Squash Merge concept and workflow.
   - End-to-end flow diagram.

---

## Automated Validation

> [!NOTE]
> While automated validation via CI pipelines (GitHub Actions) is active, every developer is expected to follow these standards and every reviewer must audit compliance during PR approval.
