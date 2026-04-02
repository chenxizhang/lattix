## ADDED Requirements

### Requirement: Create agentbroker home directory
The system SHALL create a `~/.agentbroker` directory in the user's home directory if it does not already exist. This directory serves as the stable entry point for all agentbroker file operations.

#### Scenario: First-time setup
- **WHEN** the system starts for the first time and `~/.agentbroker` does not exist
- **THEN** the system SHALL create `~/.agentbroker` directory and proceed with symlink creation

#### Scenario: Directory already exists
- **WHEN** the system starts and `~/.agentbroker` already exists with valid symlinks
- **THEN** the system SHALL validate the existing symlinks point to the correct OneDrive locations and proceed without re-creation

### Requirement: Create symlinks to OneDrive subdirectories
The system SHALL create symbolic links inside `~/.agentbroker` that point to corresponding directories within the OneDrive for Business sync folder. The symlink targets SHALL be:
- `~/.agentbroker/tasks` → `<OneDrivePath>/AgentBroker/tasks`
- `~/.agentbroker/output` → `<OneDrivePath>/AgentBroker/output`

#### Scenario: Successful symlink creation
- **WHEN** the system has detected the OneDrive for Business folder and has appropriate permissions
- **THEN** the system SHALL create the `AgentBroker/tasks` and `AgentBroker/output` directories in OneDrive if they don't exist, and create symlinks from `~/.agentbroker/tasks` and `~/.agentbroker/output` pointing to those OneDrive directories

#### Scenario: Symlinks already exist and are valid
- **WHEN** symlinks already exist and point to the correct OneDrive directories
- **THEN** the system SHALL log that symlinks are valid and proceed without modification

#### Scenario: Symlinks exist but point to wrong location
- **WHEN** symlinks exist but point to a different OneDrive path (e.g., user switched accounts)
- **THEN** the system SHALL remove the stale symlinks and create new ones pointing to the correct location

### Requirement: Handle symlink permission failure
The system SHALL handle the case where symlink creation fails due to insufficient permissions on Windows.

#### Scenario: Symlink creation fails due to permissions
- **WHEN** symlink creation fails because Developer Mode is not enabled and the user lacks symlink privileges
- **THEN** the system SHALL attempt to create directory junctions as a fallback, and if that also fails, display a clear error message with instructions to enable Developer Mode in Windows Settings

### Requirement: Create local configuration file
The system SHALL create a `~/.agentbroker/config.json` file to store local machine configuration including the detected OneDrive path and machine-specific settings.

#### Scenario: Config file creation on first run
- **WHEN** the system sets up for the first time
- **THEN** the system SHALL create `config.json` with the detected OneDrive path, machine hostname, and default settings (e.g., default agent command, polling interval)
