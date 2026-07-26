# Release Process & Versioning

## Semantic Versioning (SemVer)

Versions follow `MAJOR.MINOR.PATCH` format:
* **MAJOR**: Architectural overhauls or breaking API contract changes.
* **MINOR**: New feature additions (e.g. Step 10 Schedule Editor, Step 11 Celery Jobs).
* **PATCH**: Bug fixes and documentation updates.

## Release Steps
1. Update `CHANGELOG.md` under `## [X.Y.Z] - YYYY-MM-DD`.
2. Merge `develop` into `main`.
3. Create annotated Git tag:
   ```bash
   git tag -a v1.5.0 -m "Release v1.5.0: Complete System Integration"
   git push origin v1.5.0
   ```
