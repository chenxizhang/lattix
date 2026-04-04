## Why

Lattix currently supports two run modes: foreground (interactive terminal) and daemon (detached background process). Both require the user to manually start Lattix after each system reboot. For machines that serve as long-running agent workers, a third mode is needed: configuring Lattix to **auto-start on login** via a scheduled task—without any manual intervention after setup.

## What Changes

- Add `lattix install` command that creates a Windows scheduled task to auto-start `npx lattix run -d` on user login, and starts the daemon immediately.
- Add `lattix uninstall` command that stops the running instance and removes the scheduled task.
- Enhance `lattix run` to detect when a scheduled task is installed and show status accordingly.
- Enhance `lattix status` to display auto-start status when a scheduled task is installed.
- Add version comparison (current vs latest on npmjs.org) to `status` and `--help` output.

## Capabilities

### New Capabilities
- `scheduled-task`: Covers scheduled task creation/removal via `schtasks`, task state query, and auto-start on login.

### Modified Capabilities
- `cli-entrypoint`: Add `install` and `uninstall` commands to the CLI. Add version comparison to help output.
- `daemon-mode`: Extend `run` and `status` commands to be scheduled-task-aware. Add version info to status output.

## Impact

- **No new runtime dependencies** — uses Windows built-in `schtasks` command.
- **No administrator privileges required** — scheduled tasks run under the current user.
- **Affected code**: `src/cli.ts` (new commands), `src/commands/run.ts` (task-aware), `src/commands/status.ts` (task-aware + version), `src/commands/stop.ts` (unchanged, PID-based).
- **New files**: `src/services/windows-service.ts` (ScheduledTaskManager), `src/services/version-checker.ts`, `src/commands/install.ts`, `src/commands/uninstall.ts`.
- **Testing**: Unit tests with mocked `schtasks` and npm registry. No actual task creation in CI.
