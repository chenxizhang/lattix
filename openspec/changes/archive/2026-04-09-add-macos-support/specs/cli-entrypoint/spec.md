## MODIFIED Requirements

### Requirement: Install command
The system SHALL provide an `install` command that configures Lattix auto-start on login using the platform-appropriate implementation on supported platforms.

#### Scenario: Install command registered
- **WHEN** the user runs `lattix --help`
- **THEN** the help output SHALL list the `install` command with a description

### Requirement: Uninstall command
The system SHALL provide an `uninstall` command that removes the current platform's Lattix auto-start registration and stops the running instance.

#### Scenario: Uninstall command registered
- **WHEN** the user runs `lattix --help`
- **THEN** the help output SHALL list the `uninstall` command with a description
