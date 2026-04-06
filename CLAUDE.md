# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lattix is a distributed agent orchestration tool that uses OneDrive sync as its coordination layer. Machines share a synced OneDrive workspace and use file-based task distribution with hostname-prefixed results. No central scheduler or control plane.

## Build & Test Commands

**CLI (root directory):**
```bash
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
npm test             # Build + run all tests (Node.js test runner)
node --test test/task-watcher.test.js  # Run single test file
```

**Web Dashboard (web/ directory):**
```bash
cd web
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build to web/dist/
npm test             # Run unit tests (Vitest)
```

## Architecture

### CLI Structure (`src/`)

- `cli.ts` — Entry point using Commander.js, registers all commands
- `commands/` — Command handlers: run, submit, status, stop, install, uninstall
- `services/` — Core logic:
  - `task-watcher.ts` — Watches tasks/ directory via chokidar + polling fallback
  - `agent-executor.ts` — Spawns coding agent processes
  - `daemon.ts` — Background process management with PID file
  - `bootstrap.ts` — First-run setup: OneDrive detection, symlink creation
  - `onedrive-detector.ts` — Finds OneDrive paths (personal and business)
  - `result-writer.ts` — Writes hostname-prefixed results to output/
- `types/index.ts` — Shared interfaces (TaskFile, ResultFile, LattixConfig)

### Web Dashboard (`web/src/`)

Vanilla TypeScript SPA (no framework) using MSAL for Microsoft Graph API authentication.

- `auth.ts` — MSAL authentication wrapper
- `graph.ts` — Microsoft Graph API calls for OneDrive file operations
- `router.ts` — Hash-based client-side routing
- `components/` — UI components (home, task-list, task-detail, navbar, login, settings)
- `sanitize.ts` — Shell metacharacter sanitization for task prompts

### OpenSpec Workflow

The project uses spec-driven development via `openspec/`:

- `config.yaml` — Project rules and quality expectations
- `specs/*/spec.md` — Behavioral specifications using SHALL language
- `changes/` — Change artifacts (proposal, design, tasks, delta specs)

OpenSpec skills are available via `/opsx:*` commands (e.g., `/opsx:new`, `/opsx:apply`, `/opsx:verify`).

## Testing Patterns

- CLI tests are JavaScript files in `test/` using Node.js built-in test runner
- Tests import from `../dist/` (build required before running)
- Web tests are TypeScript files co-located with source (*.test.ts) using Vitest
- Test-first development is required for behavior changes per `openspec/config.yaml`

## Key Conventions

- Task files are immutable once written; only tasks arriving after daemon start are processed
- Hostname prefixes prevent result collisions across machines
- `~/.lattix/` contains local config (config.json, processed.json, PID file) and symlinks to OneDrive
- Single instance enforcement via PID file (foreground, daemon, or scheduled task modes)
