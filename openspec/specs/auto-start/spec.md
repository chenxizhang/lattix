## Purpose
Define cross-platform auto-start registration for supported desktop platforms, including installation, removal, and state query behavior used by the Lattix CLI.

## Requirements

### Requirement: Cross-platform auto-start installation
The system SHALL provide platform-specific auto-start registration for supported desktop platforms through the `lattix install` command. The registered auto-start action SHALL run `npx -y lattix run -d` for the current user at login. Windows SHALL use a Scheduled Task named `Lattix`; macOS SHALL use a per-user LaunchAgent plist under `~/Library/LaunchAgents`.

#### Scenario: Install auto-start on Windows
- **WHEN** the user runs `lattix install` on Windows and no auto-start registration exists
- **THEN** the system SHALL create the `Lattix` Scheduled Task with the existing login and wake triggers, start the daemon immediately, and print a confirmation

#### Scenario: Install auto-start on macOS
- **WHEN** the user runs `lattix install` on macOS and no auto-start registration exists
- **THEN** the system SHALL write a per-user LaunchAgent plist under `~/Library/LaunchAgents`, load or bootstrap it for the current user session, start the daemon immediately, and print a confirmation

#### Scenario: Install auto-start on unsupported platform
- **WHEN** the user runs `lattix install` on a platform other than Windows or macOS
- **THEN** the system SHALL print a clear unsupported-platform error and exit with a non-zero code without creating any auto-start registration

### Requirement: Cross-platform auto-start removal
The system SHALL remove the current platform's auto-start registration through the `lattix uninstall` command and stop the running Lattix instance if one exists.

#### Scenario: Uninstall auto-start on Windows
- **WHEN** the user runs `lattix uninstall` on Windows and the `Lattix` Scheduled Task exists
- **THEN** the system SHALL stop the running Lattix instance if needed, remove the Scheduled Task, and print a confirmation

#### Scenario: Uninstall auto-start on macOS
- **WHEN** the user runs `lattix uninstall` on macOS and the LaunchAgent registration exists
- **THEN** the system SHALL stop the running Lattix instance if needed, unload or bootout the LaunchAgent, remove the plist file, and print a confirmation

#### Scenario: Uninstall auto-start on unsupported platform
- **WHEN** the user runs `lattix uninstall` on a platform other than Windows or macOS
- **THEN** the system SHALL print a clear unsupported-platform error and exit with a non-zero code without modifying daemon state

### Requirement: Cross-platform auto-start state query
The system SHALL provide the ability to query whether the current platform's Lattix auto-start registration is present so that `run` and `status` can report auto-start state consistently.

#### Scenario: Query installed auto-start on Windows
- **WHEN** the system queries auto-start state on Windows and the `Lattix` Scheduled Task exists
- **THEN** the query SHALL return an installed state

#### Scenario: Query installed auto-start on macOS
- **WHEN** the system queries auto-start state on macOS and the LaunchAgent plist exists for the configured Lattix label
- **THEN** the query SHALL return an installed state

#### Scenario: Query missing auto-start registration
- **WHEN** the system queries auto-start state on a supported platform and no Lattix registration exists
- **THEN** the query SHALL return a not-installed state
