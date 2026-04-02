# AgentBroker

Multi-machine coding agent orchestrator using OneDrive for Business sync.

## Overview

AgentBroker enables you to fan out coding tasks across all your corporate machines simultaneously. Submit a task on any machine, and every machine running AgentBroker will pick it up and execute it using a coding agent CLI.

**How it works:**
1. All your machines sync via **OneDrive for Business**
2. AgentBroker watches a shared `tasks/` folder for new task files
3. When a task appears, every machine independently executes it using a coding agent
4. Results are written to a shared `output/` folder with machine-name prefixes to avoid collisions

No servers, no databases, no infrastructure — just OneDrive sync.

## Prerequisites

- **Windows** with PowerShell
- **Node.js** >= 18
- **OneDrive for Business** installed and syncing
- A coding agent CLI (e.g., GitHub Copilot CLI, Claude Code)

## Installation

```bash
npx agentbroker init
```

Or install globally:

```bash
npm install -g agentbroker
agentbroker init
```

## Usage

### Initialize

Detect OneDrive, create symlinks, and generate config:

```bash
agentbroker init
```

This creates `~/.agentbroker/` with symlinks to your OneDrive for Business folder.

### Watch for Tasks

Start listening for tasks on this machine:

```bash
agentbroker watch
```

Options:
- `--poll-interval <seconds>` — Polling interval (default: 10)
- `--concurrency <number>` — Max concurrent agents (default: 1)

### Submit a Task

Create a task that all machines will execute:

```bash
agentbroker submit --prompt "Add error handling to all API endpoints" --title "Error handling" --working-dir "C:\work\myproject"
```

Options:
- `--prompt <text>` — The instruction for the coding agent (required)
- `--title <text>` — Short title for the task
- `--working-dir <path>` — Working directory for the agent (default: current dir)
- `--agent <command>` — Override the default agent command

### Check Status

List all tasks and their results:

```bash
agentbroker status
```

View details for a specific task:

```bash
agentbroker status task-20260402120000-abc123
```

## Architecture

```
~/.agentbroker/
├── config.json          # Local machine config (not synced)
├── processed.json       # IDs of tasks already executed (not synced)
├── tasks/ → OneDrive    # Symlink to OneDrive for Business
│   ├── task-001.json    #   Task files (synced across machines)
│   └── task-002.json
└── output/ → OneDrive   # Symlink to OneDrive for Business
    ├── task-001/        #   Results grouped by task
    │   ├── DESKTOP-A-result.json
    │   ├── DESKTOP-A-stdout.log
    │   ├── LAPTOP-B-result.json
    │   └── LAPTOP-B-stdout.log
    └── task-002/
        └── ...
```

## Task File Format

```json
{
  "id": "task-20260402120000-abc123",
  "title": "Add error handling",
  "prompt": "Add try-catch blocks to all API route handlers...",
  "workingDirectory": "C:\\work\\myproject",
  "createdAt": "2026-04-02T12:00:00Z",
  "createdBy": "DESKTOP-A"
}
```

Task files are **immutable** — once written, they are never modified. Each broker uses a local `processed.json` to track which tasks it has already executed.

## License

ISC
