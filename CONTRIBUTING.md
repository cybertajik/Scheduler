# Contributing to Staff Scheduler

Thank you for your interest in contributing to the Staff Scheduler project! Please review this document before submitting code or documentation updates.

---

## Development Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Scheduler.git
   cd Scheduler
   ```

2. **Branching Model**:
   * All new features and bug fixes should target the `develop` branch.
   * `main` is reserved for tagged production releases (`v1.x.x`).

3. **Branch Naming Conventions**:
   * `feature/short-description` — New feature additions
   * `fix/short-description` — Bug fixes
   * `docs/short-description` — Documentation improvements
   * `refactor/short-description` — Code refactoring without behavior change

---

## Commit Message Style

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat(scope): add feature description`
* `fix(scope): fix bug description`
* `docs(scope): update documentation`
* `test(scope): add or update unit tests`
* `refactor(scope): refactor internal logic`

---

## Testing & Quality Assurance

Before submitting a Pull Request, ensure that all automated tests pass:

```bash
# Run pytest suite inside backend container
docker-compose exec backend pytest

# Run frontend TypeScript compilation check
cd frontend && npm run build
```

---

## Pull Request Checklist

1. Target `develop` branch.
2. Maintain unit test coverage for new functionality.
3. Ensure no lint or TypeScript errors occur.
4. Fill out the [Pull Request Template](.github/pull_request_template.md).
