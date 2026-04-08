# AGENTS.md

## Do NOT

- **Do NOT hardcode user-facing strings.** All user-visible text must use `t('key.name')`. Emoji prefixes stay outside `t()`.
- **Do NOT add a locale key to only one locale file.** Both `en-US.json` and `zh-CN.json` must have identical key sets (CLI pair: `src/locales/`, web pair: `web/src/locales/`). Tests enforce parity and will fail on mismatch.
- **Do NOT run CLI tests without building first.** CLI tests (`test/*.test.js`) import from `../dist/`. Run `npm run build` or `npm test` (which builds automatically) — never `node --test` alone.
- **Do NOT confuse the two workspaces.** Root is CommonJS (Node.js CLI). `web/` is ESM (Vite SPA). They have separate `package.json`, separate `node_modules`, separate test runners (Node.js built-in vs Vitest), and separate i18n catalogs. Do not mix imports or run commands in the wrong directory.
- **Do NOT skip tests for behavior changes.** Write or update tests before implementation. This is enforced by project convention (`openspec/config.yaml`).
- **Do NOT forget `copy-locales` after editing locale JSON.** `tsc` does not copy `.json` files. The build script (`npm run build`) handles this, but if you only run `tsc` manually the locale files in `dist/` will be stale.

## Non-obvious commands

```bash
# Run a single CLI test (build first)
npm run build && node --test test/task-watcher.test.js

# Run a single web test
cd web && npx vitest run src/sanitize.test.ts
```
