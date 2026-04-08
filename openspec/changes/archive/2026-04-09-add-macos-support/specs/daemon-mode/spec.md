## MODIFIED Requirements

### Requirement: Single instance enforcement
The system SHALL enforce that only one `lattix run` process is active at a time, regardless of whether it was started in foreground or daemon mode. The PID file at `~/.lattix/lattix.pid` SHALL be used to track the running instance. When auto-start is installed on the current platform, the `run` command SHALL display auto-start status information.

#### Scenario: Foreground run blocked by existing instance
- **WHEN** the user runs `lattix run` and another Lattix instance (foreground or daemon) is already running
- **THEN** the system SHALL print an error message including the existing PID and exit with a non-zero code

#### Scenario: Daemon run blocked by existing foreground instance
- **WHEN** the user runs `lattix run --daemon` and a foreground `lattix run` is already running
- **THEN** the system SHALL print an error message including the existing PID and exit with a non-zero code

#### Scenario: Run with auto-start installed and running
- **WHEN** the user runs `lattix run` and an auto-start registration is installed on the current platform and the daemon is running
- **THEN** the system SHALL display that Lattix is running with auto-start on login and exit with code 0

#### Scenario: Run with auto-start installed but not running
- **WHEN** the user runs `lattix run` and an auto-start registration is installed on the current platform but the daemon is not running
- **THEN** the system SHALL display that auto-start is configured and proceed to start the daemon without creating a duplicate registration

#### Scenario: Stale PID file
- **WHEN** the user runs `lattix run` (foreground or daemon) and a PID file exists but the process is no longer running
- **THEN** the system SHALL overwrite the stale PID file and start normally

### Requirement: Stop command
The system SHALL provide a `lattix stop` command that terminates the running Lattix instance by reading the PID file and sending SIGTERM to the process. The stop command is PID-based only and does not modify auto-start registrations.

#### Scenario: Stopping a running instance
- **WHEN** the user runs `lattix stop` and a Lattix instance is running
- **THEN** the system SHALL send SIGTERM to the running process, print a confirmation with the PID, and clean up the PID file

#### Scenario: No instance running
- **WHEN** the user runs `lattix stop` and no Lattix instance is running (no PID file or stale PID file)
- **THEN** the system SHALL print an informational message indicating Lattix is not running and clean up any stale PID file

### Requirement: Status shows process info
The `lattix status` command SHALL display the running Lattix process information before listing tasks. This includes the PID, the run mode (foreground, daemon, or auto-start on login), and the log file location when applicable. The status output SHALL also display the current version and the latest version available on npmjs.org.

#### Scenario: Status with running daemon
- **WHEN** the user runs `lattix status` and a Lattix daemon is running (no auto-start registration)
- **THEN** the system SHALL display the process PID, indicate daemon (background) mode, and show the log file path

#### Scenario: Status with auto-start and running
- **WHEN** the user runs `lattix status` and an auto-start registration is installed on the current platform and the daemon is running
- **THEN** the system SHALL display the process PID and indicate "daemon (auto-start on login)" mode

#### Scenario: Status with auto-start but not running
- **WHEN** the user runs `lattix status` and an auto-start registration is installed on the current platform but the daemon is not running
- **THEN** the system SHALL display that auto-start is configured but Lattix is not currently running

#### Scenario: Status with no running instance
- **WHEN** the user runs `lattix status` and no Lattix instance is running
- **THEN** the system SHALL display that Lattix is not running

#### Scenario: Status shows version info
- **WHEN** the user runs `lattix status`
- **THEN** the output SHALL display the current version and the latest version from npmjs.org. If the latest version is newer, it SHALL indicate an update is available
