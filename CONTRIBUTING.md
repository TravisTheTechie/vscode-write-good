# Contributing

Thanks for helping improve Write Good Linter! This guide is a quick start. For full contributor guidelines, see Repository Guidelines.

- Read: [Repository Guidelines](./AGENTS.md)
- Publishing steps: [README – Publishing](./README.md#publishing)

## Quick Setup
1. Fork and clone your fork.
2. Install Node.js (LTS or 22.x) and run:
   ```bash
   npm ci
   npm run compile # or: npm run watch
   ```
3. Open the folder in VS Code and press F5 to launch the Extension Development Host. Open a Markdown file to see diagnostics.

## Before You Open a PR
- Ensure code is in `src/` only; do not edit `out/`.
- Run formatting/linting and build:
  ```bash
  npm run lint
  npm run compile
  ```
- Run tests and ensure all specs pass:
  ```bash
  npm test        # headless
  # or for visual debugging
  npm run test:gui
  ```
- Manually verify behavior in the Dev Host (F5), including settings like `write-good.only-lint-on-save` and `write-good.debounce-time-in-ms`.

## Pull Requests
- Use concise, imperative commit messages (e.g., "fix: debounce scheduling").
- PR description should include: purpose, approach, user-facing changes (settings/diagnostics), and screenshots/GIFs if behavior changes.
- Link related issues (e.g., "Fixes #123").
- CI must pass (install, compile, lint).

## Issues
- When filing a bug, include VS Code version, OS, sample text that reproduces the warning, relevant settings, and logs from the Extension Host if applicable.
