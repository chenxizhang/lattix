## ADDED Requirements

### Requirement: npx-compatible CLI entrypoint
The system SHALL provide a CLI entrypoint that can be invoked via `npx agentbroker <command>`. The package.json MUST define a `bin` field mapping `agentbroker` to the compiled CLI script.

#### Scenario: Running via npx
- **WHEN** a user runs `npx agentbroker watch`
- **THEN** the system SHALL start the task watcher after performing OneDrive detection and symlink setup

### Requirement: Watch command
The system SHALL provide a `watch` command that starts the task watcher in the foreground. This is the primary operating mode of agentbroker.

#### Scenario: Starting watch mode
- **WHEN** the user runs `agentbroker watch`
- **THEN** the system SHALL perform OneDrive detection, validate/create symlinks, scan for pending tasks, and begin watching for new tasks. The process SHALL log its status to stdout.

#### Scenario: Watch mode with custom polling interval
- **WHEN** the user runs `agentbroker watch --poll-interval 30`
- **THEN** the system SHALL use a 30-second polling interval instead of the default 10 seconds

#### Scenario: Watch mode with custom concurrency
- **WHEN** the user runs `agentbroker watch --concurrency 3`
- **THEN** the system SHALL allow up to 3 agent processes to run simultaneously

### Requirement: Init command
The system SHALL provide an `init` command that performs the initial setup (OneDrive detection, symlink creation, config file generation) without starting the watcher.

#### Scenario: Running init
- **WHEN** the user runs `agentbroker init`
- **THEN** the system SHALL detect OneDrive, create symlinks, generate config.json, and report the setup status without starting the watcher

### Requirement: Submit command
The system SHALL provide a `submit` command that creates a new task file in the tasks directory.

#### Scenario: Submitting a task with a prompt
- **WHEN** the user runs `agentbroker submit --prompt "Add error handling to the API" --working-dir "C:\work\myproject"`
- **THEN** the system SHALL create a task JSON file in `~/.agentbroker/tasks/` with a generated unique ID, the provided prompt, the working directory, status "pending", and the current machine hostname as `createdBy`

#### Scenario: Submitting a task with a title
- **WHEN** the user runs `agentbroker submit --prompt "..." --title "Error handling"`
- **THEN** the system SHALL include the title in the task file

### Requirement: Status command
The system SHALL provide a `status` command that displays the current state of all known tasks.

#### Scenario: Listing all tasks
- **WHEN** the user runs `agentbroker status`
- **THEN** the system SHALL read all task files from `~/.agentbroker/tasks/`, display each task's ID, title, status, and which machine claimed it (if any), formatted as a table or list

#### Scenario: Checking a specific task
- **WHEN** the user runs `agentbroker status <task-id>`
- **THEN** the system SHALL display detailed information about the task including its status, claiming machine, and any result files in the output directory

### Requirement: Version and help
The system SHALL provide `--version` and `--help` flags following standard CLI conventions.

#### Scenario: Showing version
- **WHEN** the user runs `agentbroker --version`
- **THEN** the system SHALL print the package version from package.json

#### Scenario: Showing help
- **WHEN** the user runs `agentbroker --help`
- **THEN** the system SHALL display usage information listing all available commands and their options
