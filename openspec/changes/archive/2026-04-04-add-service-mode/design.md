## Context

Lattix currently supports two run modes: **foreground** (interactive, dies with terminal) and **daemon** (detached process, survives terminal close). Both are managed via PID files at `~/.lattix/lattix.pid` with single-instance enforcement.

For long-running agent workers, a third mode is needed: **auto-start on login**—so Lattix starts automatically when the user logs in, without manual intervention.

The primary usage model for Lattix is via `npx lattix <command>`, which always runs the latest published version.

## Goals / Non-Goals

**Goals:**
- Auto-start Lattix on user login via `lattix install` (creates a scheduled task)
- Remove auto-start via `lattix uninstall` (removes scheduled task + stops process)
- No administrator privileges required
- `status` command shows auto-start status
- Version comparison (current vs npm latest) in `status` and `--help`

**Non-Goals:**
- Linux/macOS support (launchctl, systemd) — Windows only for now, but architecture is ready to extend
- Windows Service approach — abandoned due to node-windows bugs, admin requirements, and SCM complexity
- Configurable task name — fixed as "Lattix"

## Decisions

### Decision 1: Use Windows scheduled tasks (`schtasks`) instead of Windows Service

**Choice**: Use `schtasks /create` with `ONLOGON` trigger to auto-start `npx lattix run -d` on user login.

**Alternatives considered and rejected**:
- **Windows Service via node-windows**: Required admin privileges, had buggy scriptOptions parsing (comma vs space split), SCM self-detection caused infinite exit loops, complex `.exe` stub generation. Abandoned after extensive debugging.
- **Windows Service via WinSW/nssm**: Required distributing additional binaries.

**Rationale**: `schtasks` is a built-in Windows tool, requires no admin for current-user tasks, no external dependencies, and the command `npx lattix run -d` ensures the latest version is always used.

### Decision 2: Auto-start command is `npx lattix run -d`

**Choice**: The scheduled task runs `npx lattix run -d`, which spawns a detached daemon process. This ensures the latest npm version is used on every login.

**Rationale**: Users primarily use `npx`. Using `npx lattix run -d` ensures version freshness without requiring `npm install -g` or manual upgrades.

### Decision 3: `ScheduledTaskManager` service class with DI

**Choice**: Create `src/services/windows-service.ts` with a `ScheduledTaskManager` class encapsulating all `schtasks` interactions. Follows the existing DI pattern with a `ScheduledTaskDependencies` interface for testability.

**Key methods**:
- `install()` — Create scheduled task with ONLOGON trigger
- `uninstall()` — Delete scheduled task
- `queryTaskState()` — Returns `'installed' | 'not-installed'`
- `getTaskName()` — Returns "Lattix"

### Decision 4: `run` command is informational when task is installed

**Choice**: When a scheduled task is installed, `lattix run` shows the current status (running or not) and suggests appropriate actions. It does NOT try to start/stop the service or require admin. If the task is installed but daemon is not running, `run` proceeds normally (starts daemon).

**Rationale**: Keeps run simple and predictable. No admin needed. No SCM interaction.

### Decision 5: `stop` command remains PID-based

**Choice**: `lattix stop` always uses the PID file to kill the process. No special handling for scheduled-task mode — it's just a daemon process. The scheduled task will re-start it on next login.

**Rationale**: Massive simplification vs the Windows Service approach. No admin needed.

### Decision 6: Version check via npm registry

**Choice**: Always query `https://registry.npmjs.org/lattix/latest` to fetch the latest published version. Compare with the current CLI version from `package.json`. Display both in `status` and `help` output, with an upgrade prompt if the current version is behind. If the registry is unreachable (offline, timeout), gracefully show only the current version without failing.

**Rationale**: Lightweight single HTTP GET to a public API. Helps users know when updates are available.

## Risks / Trade-offs

**[Risk] `schtasks` is Windows-only** → Mitigation: Architecture is clean (ScheduledTaskManager interface). macOS (launchctl) and Linux (systemd --user) can be added later with platform-specific implementations.

**[Risk] `npx` cache may be slow on first login** → Mitigation: `npx` caches packages locally. After first use, subsequent invocations are fast.

**[Trade-off] No crash recovery** → Unlike Windows Services, scheduled tasks don't auto-restart on crash. The daemon runs as a normal process. If it crashes, it restarts on next login. This is acceptable for the use case.

## Test Strategy

**Test-first approach**: Write failing tests before implementation for each new module.

### Tests

**`test/windows-service.test.js`** (5 tests):
- `queryTaskState()` returns "installed" when schtasks succeeds
- `queryTaskState()` returns "not-installed" when schtasks fails
- `install()` calls `schtasks /create` with ONLOGON trigger
- `uninstall()` calls `schtasks /delete`
- `getTaskName()` returns "Lattix"

**`test/install-command.test.js`** (3 tests):
- Successful install creates scheduled task and starts daemon
- Install reports when task already exists
- Install exits with 1 on failure

**`test/uninstall-command.test.js`** (3 tests):
- Successful uninstall stops process and removes task
- Uninstall reports when no task installed
- Uninstall exits with 1 on failure

**`test/version-check.test.js`** (3 tests):
- Fetches latest version from npm registry and compares
- Handles network failure gracefully
- Correctly identifies when update is available

**Updated tests**: `test/run-command.test.js` (+1 scheduled task test), `test/status-command.test.js` (+1 auto-start test)

All tests use dependency injection to mock `schtasks` — no actual task creation in tests.