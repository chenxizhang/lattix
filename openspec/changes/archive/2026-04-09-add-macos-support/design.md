## Context

Lattix already has a portable execution core: the watcher, daemon process management, PID tracking, task file handling, and result writing all operate on standard Node.js and filesystem primitives. The current platform lock-in comes from three setup-time concerns:

- `src/services/onedrive-detector.ts` only knows how to detect OneDrive using Windows registry and home-directory conventions.
- `src/services/windows-service.ts` hard-codes Windows Scheduled Task creation and is referenced directly by `run`, `install`, `uninstall`, and `status`.
- `src/services/shortcut.ts` assumes Windows command discovery (`where`) and writes a `.cmd` wrapper only.

Adding macOS support is therefore a cross-cutting CLI/platform integration change, not a rewrite of the worker runtime.

## Goals / Non-Goals

**Goals:**
- Let macOS machines bootstrap against a supported OneDrive sync folder and participate as normal Lattix nodes.
- Preserve Windows behavior while introducing a platform-neutral auto-start layer consumed by the existing CLI commands.
- Support macOS login auto-start via a per-user LaunchAgent without adding runtime dependencies.
- Keep the user-facing command surface unchanged: `run`, `install`, `uninstall`, `status`, and submit hints still work the same way conceptually.
- Extend shortcut registration so first-run `npx -y lattix run` can surface a usable `lattix` command on macOS as well as Windows.
- Plan the implementation test-first, with explicit new failing tests before code changes.

**Non-Goals:**
- Linux support (`systemd --user`, cron, launch alternatives) in this change.
- Interactive provider/account selection redesign beyond what existing specs already require.
- Replacing OneDrive with other sync providers.
- Reworking daemon internals, watcher semantics, or task/result file formats.

## Decisions

### Decision 1: Introduce a platform-neutral auto-start manager

**Choice:** Replace direct command-layer coupling to `ScheduledTaskManager` with an `AutoStartManager` abstraction plus a small platform factory. The command layer will depend on platform-neutral methods such as querying registration state, installing auto-start, removing auto-start, and starting through the registration when appropriate.

**Alternatives considered and rejected:**
- **Keep branching directly inside each command:** This would duplicate platform checks and registration logic across `run`, `install`, `uninstall`, and `status`.
- **Create one large monolithic service handling every platform inline:** This would keep concerns coupled and make testing platform-specific behavior harder.

**Rationale:** The repo already favors small injectable services. A platform-neutral manager keeps command behavior coherent while isolating Windows and macOS registration details.

### Decision 2: Keep Windows Scheduled Tasks as the Windows implementation

**Choice:** Preserve the existing Windows Scheduled Task behavior, including the login trigger and wake trigger, behind the new auto-start abstraction.

**Alternatives considered and rejected:**
- **Remove wake support to equalize Windows and macOS:** This would be a regression for existing Windows users.
- **Replace Scheduled Tasks with another Windows mechanism:** There is no product need to revisit a working implementation.

**Rationale:** Existing Windows semantics are already documented and implemented. The change should add macOS without destabilizing Windows.

### Decision 3: Use a per-user LaunchAgent on macOS

**Choice:** Implement macOS auto-start by writing a LaunchAgent plist under `~/Library/LaunchAgents/xyz.code365.lattix.plist` with a fixed label and `ProgramArguments` that invoke `npx -y lattix run -d`. The manager will load or bootstrap that LaunchAgent for the current user session and remove it on uninstall.

**Alternatives considered and rejected:**
- **Login Items / app bundle integration:** Lattix is a CLI package, not a bundled macOS app.
- **Ad hoc shell profile edits:** Shell startup files do not guarantee a background worker starts at GUI login.
- **Custom wrapper scripts outside LaunchAgents:** They still need LaunchAgents or another scheduler to start on login.

**Rationale:** LaunchAgents are the standard per-user background-job mechanism on macOS and map well to the existing “auto-start on login” concept.

### Decision 4: Detect macOS OneDrive folders by scanning File Provider and legacy paths

**Choice:** Extend `OneDriveDetector` to scan `~/Library/CloudStorage` first, then the user home directory, collecting directories whose names begin with `OneDrive`. Candidate paths will still be deduplicated and validated on disk before use.

**Alternatives considered and rejected:**
- **Depend on undocumented OneDrive metadata files:** This creates brittle parsing and version risk.
- **Prompt users for a path manually on macOS:** This would regress the zero-config bootstrap flow.

**Rationale:** Recent macOS OneDrive installs commonly surface under `~/Library/CloudStorage`, while some users still have legacy or alternate home-directory locations. Scanning both preserves a simple bootstrap experience.

### Decision 5: Generalize shortcut registration by platform

**Choice:** Keep the current behavior of only attempting shortcut registration during `run` or `install` invoked via `npx`, but emit a platform-appropriate wrapper:
- Windows: `lattix.cmd`
- macOS / POSIX: executable `lattix` shell script

Global command detection will also use platform-appropriate lookup (`where` on Windows, `which -a` on POSIX) while still filtering out npx cache paths.

**Alternatives considered and rejected:**
- **Skip shortcut support on macOS:** This leaves the first-run UX inconsistent across supported platforms.
- **Modify PATH automatically on macOS:** The current approach relies on npm’s global bin already being on PATH; adding shell-profile mutation would be a larger UX and reliability project.

**Rationale:** A simple executable shell wrapper matches the current Windows convenience without adding profile-management complexity.

### Decision 6: Keep command semantics stable and i18n-driven

**Choice:** `install`, `uninstall`, `run`, and `status` will continue to describe “auto-start on login” in user-facing text, but wording will no longer be Windows-specific. Platform-specific implementation details stay inside the services layer.

**Alternatives considered and rejected:**
- **Expose platform-specific subcommands:** This would complicate the CLI for a problem the service layer can hide.

**Rationale:** The current CLI is intentionally small. Users should not need to learn different commands for Windows versus macOS.

## Risks / Trade-offs

- **[Risk] macOS OneDrive directory names vary across account types and client versions** → Mitigation: scan both `~/Library/CloudStorage` and `~/`, match directories beginning with `OneDrive`, and rely on existing path validation plus deterministic fallback ordering.
- **[Risk] `launchctl` behavior differs across macOS versions and user session contexts** → Mitigation: keep the implementation limited to per-user LaunchAgents, test command construction thoroughly, and treat load/unload failures as surfaced command errors.
- **[Risk] Wrapper creation in npm global bin may fail on some Node/npm setups** → Mitigation: preserve the current non-blocking shortcut behavior and fall back to `npx -y lattix ...` hints when wrapper creation fails.
- **[Trade-off] macOS will likely support login auto-start but not Windows-style wake-event restart** → Mitigation: keep the cross-platform contract centered on login auto-start and leave wake-specific behavior documented only for Windows.
- **[Trade-off] Introducing an abstraction adds one more service layer** → Mitigation: keep the interface narrow and move only platform registration concerns behind it.

## Migration Plan

1. Add the new auto-start service layer while retaining the existing Windows implementation behavior.
2. Switch command modules to consume the platform-neutral manager instead of importing `windows-service` directly.
3. Add the macOS LaunchAgent implementation and macOS OneDrive detection.
4. Update i18n strings, README text, and shortcut behavior to reflect cross-platform auto-start.
5. Preserve the existing Windows scheduled task name (`Lattix`) so current Windows users do not need to reinstall after upgrading.
6. Rollback path: `lattix uninstall` removes the current platform’s registration; code rollback does not require task/output migration because no synced data format changes are introduced.

## Test Strategy

Implementation must start by adding failing tests for the new behaviors before service or command code changes.

**New tests to add first:**
- `test/auto-start-manager.test.js` or equivalent platform-factory coverage:
  - Windows selects the scheduled-task implementation
  - macOS selects the LaunchAgent implementation
  - unsupported platforms report unsupported auto-start
- `test/macos-auto-start.test.js`:
  - install writes the LaunchAgent plist with the expected label and `ProgramArguments`
  - query returns installed / not-installed based on plist presence and manager checks
  - uninstall removes the plist and unloads the LaunchAgent
- `test/onedrive-detector.test.js` additions:
  - detects a personal macOS OneDrive directory from `~/Library/CloudStorage`
  - detects multiple macOS OneDrive accounts when multiple matching directories exist
  - falls back to legacy home-directory OneDrive paths on macOS
- `test/install-command.test.js`, `test/uninstall-command.test.js`, `test/run-command.test.js`, and `test/status-command.test.js` additions:
  - commands use platform-neutral auto-start semantics on macOS
  - unsupported platform behavior is surfaced clearly where required
- `test/shortcut.test.js` additions:
  - creates a POSIX wrapper on macOS
  - detects globally installed `lattix` via POSIX command lookup without counting npx cache paths

**Verification:**
- Run `npm run build`
- Run `npm test`
- If needed during implementation, run targeted tests after each module is updated, always building first per repo convention

## Open Questions

- Should the macOS LaunchAgent label be `xyz.code365.lattix` or another reverse-DNS identifier tied to the package name? The implementation should choose one fixed label and use it consistently in tests and docs.
- Do we want `run` on macOS with auto-start installed but not running to start via LaunchAgent (`launchctl kickstart/bootstrap`) or simply start the daemon directly? The spec allows either as long as command behavior remains consistent; implementation should prefer the simpler path unless LaunchAgent-driven startup materially improves reliability.
