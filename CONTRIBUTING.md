## Contributing to RadioFlow

Thank you for your interest in contributing to RadioFlow! We welcome contributions from the community.

### Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

### How to Contribute

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/your-feature`
3. **Make changes** following the code style
4. **Run checks**:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
5. **Commit** using [conventional commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `refactor:` code restructuring
   - `docs:` documentation
   - `style:` code style
   - `perf:` performance
   - `test:` testing
   - `chore:` maintenance
6. **Push** and open a Pull Request

### Pull Request Process

1. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely
2. Ensure all CI checks pass (lint, typecheck, build)
3. Include screenshots for UI changes
4. Update documentation if needed
5. A maintainer will review your PR

### Development Setup

```bash
git clone https://github.com/sanot-tech/RadioFlow.git
cd RadioFlow
npm install
cp .env.example .env
npm run dev
```

### Code Style

- **TypeScript**: strict mode, `interface` over `type` for objects
- **Components**: functional, hooks, PascalCase filenames
- **Imports**: React → third-party → internal → styles
- **CSS**: Tailwind utility classes, `cn()` helper for composition

### Questions?

Open a [Discussion](https://github.com/sanot-tech/RadioFlow/discussions) or reach out to [@sanot-tech](https://github.com/sanot-tech).
