## Purpose
Define the daemon-mode capability: background process detachment, PID-file lifecycle, log-file output redirection, and duplicate-instance prevention.

## Requirements

### Requirement: Daemon process detachment
The system SHALL support a `--daemon` flag on the `run` command that spawns a detached background process and exits the parent immediately.

#### Scenario: Starting in daemon mode
- **WHEN** the user runs `lattix run --daemon`
- **THEN** the system SHALL spawn a detached child process that continues running after the parent exits, and the parent SHALL print the child PID and exit with code 0

#### Scenario: Daemon child inherits options
- **WHEN** the user runs `lattix run --daemon --poll-interval 30 --concurrency 2`
- **THEN** the detached child process SHALL run with poll-interval 30 and concurrency 2

### Requirement: PID file management
The system SHALL write a PID file at `~/.lattix/lattix.pid` containing the daemon process ID when starting in daemon mode, and SHALL remove the PID file on graceful shutdown.

#### Scenario: PID file created on daemon start
- **WHEN** the daemon child process starts successfully
- **THEN** the system SHALL write the process PID to `~/.lattix/lattix.pid`

#### Scenario: PID file removed on shutdown
- **WHEN** the daemon receives SIGINT or SIGTERM
- **THEN** the system SHALL delete `~/.lattix/lattix.pid` before exiting

### Requirement: Duplicate instance prevention
The system SHALL prevent multiple daemon instances from running simultaneously by checking the PID file on startup.

#### Scenario: Daemon already running
- **WHEN** the user runs `lattix run --daemon` and a valid PID file exists with a live process
- **THEN** the system SHALL print an error message including the existing PID and exit with a non-zero code without spawning a new process

#### Scenario: Stale PID file
- **WHEN** the user runs `lattix run --daemon` and a PID file exists but the process is no longer running
- **THEN** the system SHALL overwrite the stale PID file and start the daemon normally

### Requirement: Log file output
The system SHALL redirect all stdout and stderr output to a log file when running in daemon mode. Each log entry SHALL be prefixed with an ISO-8601 timestamp and a level tag.

#### Scenario: Default log file location
- **WHEN** the user runs `lattix run --daemon` without specifying `--log-file`
- **THEN** all output SHALL be written to `~/.lattix/lattix.log`

#### Scenario: Custom log file location
- **WHEN** the user runs `lattix run --daemon --log-file /var/log/lattix.log`
- **THEN** all output SHALL be written to `/var/log/lattix.log`

#### Scenario: Log file entries are timestamped
- **WHEN** the daemon writes a log entry
- **THEN** the entry SHALL be prefixed with an ISO-8601 timestamp and a level indicator (e.g., `[INFO]`, `[ERROR]`)
