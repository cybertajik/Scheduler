# Development & Git Workflow

## Branching Strategy

```text
main (Production Releases / Tags)
  ▲
  │ Pull Request
develop (Integration & Active Development)
  ▲
  ├── feature/schedule-editor
  ├── feature/celery-jobs
  └── fix/auth-token-refresh
```

## Workflows
1. **Feature Branch**: Create `feature/<short-name>` off `develop`.
2. **Commiting**: Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
3. **Pull Request**: Submit PR targeting `develop`. Ensure all 44 Pytest tests and TypeScript builds succeed.
4. **Release Tagging**: Merge `develop` into `main` and tag semantic version (`v1.x.x`).
