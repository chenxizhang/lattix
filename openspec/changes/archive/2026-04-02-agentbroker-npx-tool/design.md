## Context

Developers in enterprise environments frequently have multiple corporate machines (desktop, laptop, cloud dev boxes) provisioned with identical tooling, identical directory structures, and OneDrive for Business syncing the same account. Coding agents (GitHub Copilot CLI, Claude Code, etc.) run locally on a single machine. There is currently no lightweight way to distribute coding tasks across all available machines and collect results centrally.

OneDrive for Business provides automatic bidirectional file sync across all enrolled machines without requiring any additional infrastructure. By using the synced folder as a shared task queue and result store, we can build a zero-infrastructure multi-machine agent orchestrator.

The target environment is Windows with PowerShell, where OneDrive for Business is most prevalent. The tool is an npm package runnable via `npx agentbroker`.

## Goals / Non-Goals

**Goals:**
- Provide a single CLI command to start watching for tasks on a machine
- Automatically detect OneDrive for Business sync folder location
- Use symlinks to abstract the OneDrive path behind a stable `~/.agentbroker` directory
- Watch for new task files and spawn coding agent processes to execute them
- Write results with machine-identifiable filenames so outputs from multiple machines don't collide
- Fan-out model: every machine executes every task independently
- Work as a standard npx package with no build step required

**Non-Goals:**
- Real-time coordination between machines (we rely on OneDrive sync latency, typically seconds)
- Web UI or dashboard (CLI-only for v1)
- Supporting non-Windows OS in v1 (macOS/Linux can be added later)
- Task prioritization or scheduling (simple FIFO queue)
- Agent-specific integrations (treat agents as generic CLI processes)
- Authentication or access control (relies on OneDrive account permissions)

## Decisions

### 1. OneDrive for Business as the transport layer

**Decision**: Use OneDrive for Business sync folder as the sole communication mechanism between machines.

**Rationale**: Zero infrastructure cost. All corporate machines already have it. Sync is automatic, conflict-free for non-overlapping filenames, and reliable. No need for a server, database, or message queue.

**Alternatives considered**:
- Custom WebSocket server: Requires hosting, maintenance, and firewall configuration. Overkill for the use case.
- Git-based sync: Merge conflicts, requires manual push/pull, not real-time enough.
- Cloud storage APIs (Azure Blob, S3): Requires API keys, SDK, and explicit sync logic.

### 2. Symlink-based path abstraction

**Decision**: Create `~/.agentbroker/` with symlinks pointing into the OneDrive folder, rather than operating directly in OneDrive.

**Rationale**: The OneDrive for Business path varies by user and organization (e.g., `C:\Users\<user>\OneDrive - <OrgName>`). Symlinks provide a stable, predictable path for all operations. This also makes it easy to swap the backing store in the future.

**Alternatives considered**:
- Config file with the OneDrive path: Still requires path resolution everywhere; symlinks are simpler.
- Environment variable: Easy to forget; symlinks are self-documenting.

### 3. Task file format: JSON

**Decision**: Use JSON files for task descriptors. Each task is a single `.json` file in the `tasks/` directory named `<task-id>.json`.

**Rationale**: JSON is universally parseable, human-readable, and requires no additional dependencies. YAML was considered but adds a parsing dependency and is more error-prone with indentation.

**Task file structure**:
```json
{
  "id": "task-20260402-001",
  "title": "Implement user authentication",
  "description": "Add JWT-based auth to the Express API...",
  "agent": "copilot-cli",
  "workingDirectory": "C:\\work\\myproject",
  "command": "gh copilot suggest",
  "prompt": "Add JWT authentication middleware...",
  "createdAt": "2026-04-02T08:00:00Z",
  "createdBy": "MACHINE-A"
}
```

Task files are **immutable once created** — they act as a signal. No broker should ever modify a task file after it is written. This avoids triggering redundant watcher events and OneDrive sync conflicts.

### 4. Fan-out execution model (no locking)

**Decision**: Every machine that detects a new task file SHALL execute it independently. There is no lock file or claiming mechanism.

**Rationale**: The core use case is fan-out — dispatch one task to all available machines so they all work on it simultaneously. Each machine writes results with its hostname prefix, so outputs never collide. To avoid re-executing a task after a restart, each broker maintains a **local** (non-synced) record of already-processed task IDs in `~/.agentbroker/processed.json`.

**Alternatives considered**:
- Lock-file-based claiming: Would turn this into a work queue (one machine per task), which contradicts the fan-out design intent.
- Status field in task file: Would require mutating the task file, triggering watcher events on all machines and causing sync churn.

### 5. Result output structure

**Decision**: Results are written to `~/.agentbroker/output/<task-id>/` with filenames formatted as `<hostname>-<artifact-name>.<ext>`.

**Rationale**: Machine-name prefix ensures no filename collisions when multiple machines write results for the same task. All results for a task are grouped in one directory for easy aggregation.

### 6. Technology stack

**Decision**: TypeScript with Node.js, compiled to JavaScript for npx compatibility. Use `chokidar` for file watching, native `child_process` for agent spawning.

**Rationale**: TypeScript provides type safety for the task file schemas and CLI argument parsing. `chokidar` is the de-facto standard for cross-platform file watching. The package will include a `bin` entry for npx execution.

## Risks / Trade-offs

- **[OneDrive sync latency]** → Tasks may take 5-30 seconds to propagate between machines. Mitigation: This is acceptable for coding tasks that typically run for minutes. Document the expected latency.

- **[Symlink permissions on Windows]**→ Creating symlinks may require Developer Mode enabled or elevated privileges. Mitigation: Detect on startup, provide clear error message with instructions to enable Developer Mode. Fall back to directory junctions if symlinks fail.

- **[OneDrive selective sync]** → Users may have configured selective sync that excludes the agentbroker directory. Mitigation: Verify the directory is actually syncing by checking OneDrive status or writing a test file.

- **[Agent CLI availability]** → The specified coding agent may not be installed on a machine. Mitigation: Validate agent availability before executing a task. Skip tasks requiring unavailable agents and log a warning.

- **[Large output files]** → Agent output could be large, causing slow sync. Mitigation: Cap output capture at a configurable limit (default 1MB). Truncate with a notice if exceeded.
