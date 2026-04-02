## 1. Project Scaffolding

- [x] 1.1 Initialize npm package with `npm init`, set name to `agentbroker`, add `bin` field pointing to `dist/cli.js`, configure TypeScript compilation
- [x] 1.2 Install dependencies: `typescript`, `chokidar`, `commander` (CLI parsing), and configure `tsconfig.json` with target ES2020, module NodeNext
- [x] 1.3 Create project directory structure: `src/`, `src/commands/`, `src/services/`, `src/types/`
- [x] 1.4 Define TypeScript types for TaskFile, ResultFile, and Config interfaces in `src/types/index.ts`

## 2. OneDrive Detection

- [x] 2.1 Implement `OneDriveDetector` service in `src/services/onedrive-detector.ts` that scans Windows Registry (`HKCU\Software\Microsoft\OneDrive\Accounts`) and well-known paths to find OneDrive for Business sync folders
- [x] 2.2 Add logic to distinguish between personal OneDrive and OneDrive for Business accounts, preferring business accounts
- [x] 2.3 Add validation that the detected folder exists on disk and display a clear error with exit code 1 if OneDrive for Business is not found

## 3. Symlink Setup

- [x] 3.1 Implement `SetupService` in `src/services/setup.ts` that creates `~/.agentbroker` directory and the `AgentBroker/tasks` and `AgentBroker/output` directories inside the OneDrive folder
- [x] 3.2 Create symlinks from `~/.agentbroker/tasks` and `~/.agentbroker/output` to the OneDrive subdirectories; fall back to directory junctions if symlink creation fails on Windows
- [x] 3.3 Add symlink validation on subsequent runs: verify existing symlinks point to the correct OneDrive location, re-create if stale
- [x] 3.4 Generate `~/.agentbroker/config.json` with detected OneDrive path, machine hostname, default agent command, polling interval, and concurrency settings

## 4. Task Watcher

- [x] 4.1 Implement `TaskWatcher` service in `src/services/task-watcher.ts` using chokidar to watch `~/.agentbroker/tasks` for new `.json` files
- [x] 4.2 Add task file schema validation: require `id`, `prompt` fields; parse and reject invalid files with logged warnings
- [x] 4.3 Implement local deduplication: maintain `~/.agentbroker/processed.json` to track already-executed task IDs; skip tasks already in the list
- [x] 4.4 Add startup scan: process all tasks not yet in `processed.json` before entering continuous watch mode
- [x] 4.5 Implement polling fallback: scan tasks directory every 10 seconds (configurable) to catch any missed file system events

## 5. Agent Executor

- [x] 5.1 Implement `AgentExecutor` service in `src/services/agent-executor.ts` that spawns child processes using `child_process.spawn` for the configured agent CLI command
- [x] 5.2 Add stdout and stderr capture with configurable size limit (default 1MB), truncating with notice if exceeded
- [x] 5.3 Implement process lifecycle management: handle exit code 0 (success), non-zero (failure), and configurable timeout (default 30 minutes) with process kill
- [x] 5.4 Add concurrency control: enforce maximum concurrent agent processes (default 1) with a task queue for overflow

## 6. Result Writer

- [x] 6.1 Implement `ResultWriter` service in `src/services/result-writer.ts` that creates `~/.agentbroker/output/<task-id>/` directories
- [x] 6.2 Write machine-namespaced result files: `<HOSTNAME>-result.json` (execution metadata), `<HOSTNAME>-stdout.log`, `<HOSTNAME>-stderr.log`

## 7. CLI Commands

- [x] 7.1 Implement CLI entrypoint in `src/cli.ts` using `commander` with `watch`, `init`, `submit`, and `status` subcommands, plus `--version` and `--help`
- [x] 7.2 Implement `watch` command: run OneDrive detection → symlink setup → startup scan → continuous watch, with `--poll-interval` and `--concurrency` options
- [x] 7.3 Implement `init` command: run OneDrive detection → symlink setup → config generation, report status and exit
- [x] 7.4 Implement `submit` command: accept `--prompt`, `--title`, `--working-dir`, `--agent` options; generate unique task ID, create task JSON file in tasks directory
- [x] 7.5 Implement `status` command: list all tasks with ID, title, status, claiming machine; support `agentbroker status <task-id>` for detailed view including output files

## 8. Build and Packaging

- [x] 8.1 Add npm build script to compile TypeScript to `dist/`, add shebang line to `dist/cli.js`
- [x] 8.2 Configure `package.json` with `bin`, `files`, `engines`, and `publishConfig` fields for npx compatibility
- [x] 8.3 Add a README.md with installation instructions, usage examples for all commands, and architecture overview
