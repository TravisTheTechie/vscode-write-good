# Changelog

All notable changes to this project will be documented in this file.

## 0.1.7 — 2025-08-24
- Added end-to-end behavioral tests using `@vscode/test-electron` + Mocha/Chai under `test/`.
- New npm scripts: `test`, `test:gui`, and `test:ci`; CI runs headless tests.
- CI now verifies VSIX contents (`vsce ls`) and builds the package (`vsce package`).
- Documentation: added `AGENTS.md` and `CONTRIBUTING.md`; updated `README.md` with Testing section.
- Packaging: updated `.vscodeignore` to exclude `test/**`, `out/test/**`, `.vscode-test/**`, and dependency `test/spec` files.
- Repo hygiene: added `.vscode-test` to `.gitignore`; removed unused `value-check.js`.
- Dependency updates: bumped ESLint/TypeScript toolchain, `@types/vscode`, Mocha/Chai, etc.

