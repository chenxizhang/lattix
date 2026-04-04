## 1. Scheduled Task Manager

- [x] 1.1 Write tests for `ScheduledTaskManager` in `test/windows-service.test.js`: schtasks query (installed, not-installed), install calls schtasks /create, uninstall calls schtasks /delete
- [x] 1.2 Create `src/services/windows-service.ts` implementing `ScheduledTaskManager` with `install()`, `uninstall()`, `queryTaskState()`, `getTaskName()`, and `ScheduledTaskDependencies` interface for testability

## 2. Install Command

- [x] 2.1 Write tests for install command in `test/install-command.test.js`: successful install (creates task + starts daemon), reports when task already exists, exits with 1 on failure
- [x] 2.2 Create `src/commands/install.ts` implementing the install command: check task state, create scheduled task via `ScheduledTaskManager`, start daemon immediately

## 3. Uninstall Command

- [x] 3.1 Write tests for uninstall command in `test/uninstall-command.test.js`: successful uninstall (stops + removes task), reports when not installed, exits with 1 on failure
- [x] 3.2 Create `src/commands/uninstall.ts` implementing the uninstall command: kill running process, remove scheduled task via `ScheduledTaskManager`

## 4. CLI Registration

- [x] 4.1 Update `src/cli.ts` to register `install` and `uninstall` commands

## 5. Extend Existing Commands for Scheduled Task Awareness

- [x] 5.1 Add test in `test/run-command.test.js`: run shows info when scheduled task is installed and daemon is running
- [x] 5.2 Update `src/commands/run.ts` to check scheduled task state and show info when task is installed
- [x] 5.3 Add test in `test/status-command.test.js`: status shows auto-start mode when scheduled task is installed
- [x] 5.4 Update `src/commands/status.ts` `showProcessInfo()` to check scheduled task state and display auto-start mode

## 6. Version Check

- [x] 6.1 Write tests for version checker in `test/version-check.test.js`: fetches latest version from registry, handles network failure gracefully, compares versions correctly
- [x] 6.2 Create `src/services/version-checker.ts` implementing `checkVersion()`: reads current version from `package.json`, queries npm registry, returns `{ current, latest, updateAvailable }`, gracefully handles offline/timeout
- [x] 6.3 Update `src/commands/status.ts` to call version checker and display version info at the top of status output
- [x] 6.4 Update `src/cli.ts` help output to display version info (e.g., via Commander `addHelpText`)

## 7. Documentation

- [x] 7.1 Update `README.md` with `lattix install` and `lattix uninstall` usage, scheduled task section, and version check behavior

## 8. Verification

- [x] 8.1 Run `npm run build` and verify no compilation errors
- [x] 8.2 Run `npm test` and verify all tests pass (existing + new)
