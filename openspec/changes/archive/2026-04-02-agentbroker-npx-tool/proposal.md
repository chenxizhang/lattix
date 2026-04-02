## Why

Developers at organizations often have multiple corporate machines (desktops, laptops, dev boxes) with nearly identical setups — same tools, same directory structures, same OneDrive for Business sync. Today, coding agents run on a single machine. There is no lightweight mechanism to fan out a large task across all available machines and collect results in one place. AgentBroker solves this by using OneDrive for Business as a shared task queue and result store, enabling multi-machine agent collaboration with zero infrastructure beyond what the developer already has.

## What Changes

- Introduce a new npx-runnable CLI tool (`agentbroker`) that watches for task files in a shared OneDrive-synced directory.
- On startup, detect and validate the OneDrive for Business sync folder; abort if not found.
- Create a `~/.agentbroker` directory with symlinks into the OneDrive for Business folder, providing a stable local path for all file I/O.
- Watch `~/.agentbroker/tasks/` for new task files. Each task has a unique ID and a structured JSON/YAML descriptor.
- When a new task arrives, spawn an independent coding agent CLI process (e.g., GitHub Copilot CLI, Claude Code) to execute the task.
- Write results to `~/.agentbroker/output/<task-id>/` with filenames prefixed by the machine hostname for disambiguation.
- OneDrive for Business sync propagates tasks and results across all enrolled machines automatically.

## Capabilities

### New Capabilities
- `onedrive-detection`: Detect and validate OneDrive for Business sync folder on the local machine. Fail gracefully if not present.
- `symlink-setup`: Create `~/.agentbroker` directory with symlinks to the appropriate OneDrive for Business subdirectories (`tasks/`, `output/`).
- `task-watcher`: File-system watcher that monitors the tasks directory for new task files and triggers agent execution.
- `agent-executor`: Spawn and manage independent coding agent CLI processes to fulfill tasks, capturing stdout/stderr and exit codes.
- `result-writer`: Write task results (agent output, logs, status) to the output directory with machine-name-prefixed filenames.
- `cli-entrypoint`: npx-compatible CLI entrypoint with commands for starting the watcher, submitting tasks, and checking status.

### Modified Capabilities

(none — this is a greenfield project)

## Impact

- **New package**: A new npm package `agentbroker` published for use via `npx agentbroker`.
- **Dependencies**: `chokidar` (file watching), `child_process` (agent spawning), `os` (hostname), `fs` (symlinks, file I/O).
- **OS support**: Windows-first (OneDrive for Business is most common on Windows). Symlink creation on Windows may require developer mode or elevated permissions.
- **External dependencies**: Requires OneDrive for Business to be installed and syncing. Requires at least one supported coding agent CLI to be installed on the machine.
