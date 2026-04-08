## 1. Test Scaffolding

- [x] 1.1 Extend `test/onedrive-detector.test.js` with failing macOS detection cases for `~/Library/CloudStorage` and legacy home-directory OneDrive paths
- [x] 1.2 Add failing tests for a platform-neutral auto-start manager/factory and a macOS LaunchAgent implementation
- [x] 1.3 Extend `test/install-command.test.js`, `test/uninstall-command.test.js`, `test/run-command.test.js`, and `test/status-command.test.js` with failing cross-platform auto-start cases
- [x] 1.4 Extend `test/shortcut.test.js` with failing POSIX wrapper creation and POSIX global-command detection cases

## 2. Auto-Start Services

- [x] 2.1 Create a platform-neutral auto-start manager contract/factory, including unsupported-platform handling
- [x] 2.2 Refactor the existing Windows scheduled-task service to satisfy the auto-start manager contract without changing Windows behavior
- [x] 2.3 Implement the macOS LaunchAgent auto-start service, including install, remove, and query behavior

## 3. Bootstrap and Command Integration

- [x] 3.1 Extend `src/services/onedrive-detector.ts` and related selection helpers for macOS OneDrive path discovery
- [x] 3.2 Update `src/commands/install.ts`, `src/commands/uninstall.ts`, `src/commands/run.ts`, and `src/commands/status.ts` to use the auto-start manager and platform-neutral auto-start messaging
- [x] 3.3 Update `src/cli.ts` and CLI locale catalogs for cross-platform install/uninstall descriptions and unsupported-platform messaging
- [x] 3.4 Extend `src/services/shortcut.ts` with POSIX wrapper creation, executable permissions, and platform-native global command lookup

## 4. Documentation

- [x] 4.1 Update `README.md` and `README.zh-CN.md` for macOS setup, OneDrive detection expectations, and auto-start behavior

## 5. Verification

- [x] 5.1 Run `npm run build`
- [x] 5.2 Run `npm test`
