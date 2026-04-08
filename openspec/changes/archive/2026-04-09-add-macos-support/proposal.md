## Why

Lattix currently assumes a Windows host for two critical setup paths: OneDrive detection and login auto-start. That blocks macOS machines from participating as first-class Lattix nodes even though the core watcher, daemon, and file-based coordination model are already portable.

## What Changes

- Add macOS OneDrive detection so first-run bootstrap can locate supported personal and business OneDrive sync folders on macOS.
- Add macOS auto-start on login via a per-user LaunchAgent that runs `npx -y lattix run -d`.
- Introduce a cross-platform auto-start abstraction used by `install`, `uninstall`, `run`, and `status`, with Windows Scheduled Tasks and macOS LaunchAgents as platform-specific implementations.
- Update CLI help and runtime messaging so `install` / `uninstall` describe platform-appropriate auto-start behavior rather than Windows-only scheduled tasks.
- Extend shortcut registration to support macOS-friendly wrapper creation in the npm global bin directory, while preserving the existing Windows `.cmd` behavior.

## Capabilities

### New Capabilities
- `auto-start`: Covers cross-platform auto-start registration, removal, state query, and platform-specific implementations for Windows and macOS.

### Modified Capabilities
- `cli-entrypoint`: `install` and `uninstall` become cross-platform auto-start commands instead of Windows-only scheduled-task commands.
- `daemon-mode`: `run` and `status` report auto-start state through a platform-neutral abstraction.
- `onedrive-detection`: Detection expands beyond Windows to support supported OneDrive layouts on macOS.
- `scheduled-task`: The Windows scheduled-task capability becomes the Windows-specific auto-start implementation rather than the universal definition of `install` / `uninstall`.
- `shortcut-command`: Shortcut registration expands from Windows `.cmd` wrappers to cross-platform wrapper behavior.

## Impact

- **Affected code**: `src/commands/run.ts`, `src/commands/install.ts`, `src/commands/uninstall.ts`, `src/commands/status.ts`, `src/services/onedrive-detector.ts`, `src/services/shortcut.ts`, and a new auto-start service layer replacing direct Windows coupling.
- **New platform code**: a macOS LaunchAgent implementation and a platform-neutral auto-start manager interface/factory.
- **Specs**: one new capability (`auto-start`) plus deltas for `cli-entrypoint`, `daemon-mode`, `onedrive-detection`, `scheduled-task`, and `shortcut-command`.
- **Testing**: add unit tests for macOS OneDrive detection, LaunchAgent install/remove/query behavior, cross-platform command behavior, and POSIX shortcut creation without requiring real system registration in CI.
