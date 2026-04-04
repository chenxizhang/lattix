## Purpose
Define the scheduled task capability: auto-start on login via Windows scheduled tasks (`schtasks`), task state query, and install/uninstall commands.

## Requirements

### Requirement: Scheduled task installation
The system SHALL provide a `lattix install` command that creates a Windows scheduled task named "Lattix" with an ONLOGON trigger that runs `npx lattix run -d`. The task runs under the current user's account and requires no administrator privileges. After creating the task, the command SHALL start the daemon immediately.

#### Scenario: Installing the scheduled task
- **WHEN** the user runs `lattix install` and no scheduled task exists
- **THEN** the system SHALL create a scheduled task via `schtasks /create` with ONLOGON trigger, start the daemon immediately via `npx lattix run -d`, and print a confirmation

#### Scenario: Install when task already exists
- **WHEN** the user runs `lattix install` and the "Lattix" scheduled task already exists
- **THEN** the system SHALL print an informational message showing the task name and current process status

#### Scenario: Install failure
- **WHEN** the user runs `lattix install` and `schtasks /create` fails
- **THEN** the system SHALL print an error message and exit with a non-zero code

### Requirement: Scheduled task removal
The system SHALL provide a `lattix uninstall` command that stops the running Lattix instance (if any) and removes the scheduled task.

#### Scenario: Uninstalling the scheduled task
- **WHEN** the user runs `lattix uninstall` and the "Lattix" scheduled task exists
- **THEN** the system SHALL kill the running process (if any), remove the scheduled task via `schtasks /delete`, and print a confirmation

#### Scenario: Uninstall when no task exists
- **WHEN** the user runs `lattix uninstall` and no "Lattix" scheduled task exists
- **THEN** the system SHALL print an informational message indicating no task is installed

### Requirement: Scheduled task state query
The system SHALL provide the ability to query whether a "Lattix" scheduled task is registered.

#### Scenario: Query installed task
- **WHEN** the system queries schtasks and the "Lattix" task exists
- **THEN** the query SHALL return an "installed" state

#### Scenario: Query non-existent task
- **WHEN** the system queries schtasks and no "Lattix" task exists
- **THEN** the query SHALL return a "not-installed" state
