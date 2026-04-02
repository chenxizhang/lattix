## ADDED Requirements

### Requirement: Spawn coding agent CLI process
The system SHALL spawn an independent child process for each claimed task, executing the configured coding agent CLI command with the task's prompt. The agent process MUST run in the specified working directory.

#### Scenario: Executing a task with default agent
- **WHEN** a task is claimed and no specific agent is specified in the task file
- **THEN** the system SHALL use the default agent command from `config.json` to execute the task, passing the prompt as input

#### Scenario: Executing a task with a specified agent
- **WHEN** a task is claimed and the task file specifies an `agent` field (e.g., "copilot-cli", "claude-code")
- **THEN** the system SHALL resolve the agent command from a known agent registry and execute it with the task's prompt

#### Scenario: Agent command not found
- **WHEN** the system attempts to spawn an agent process but the command is not found on the system PATH
- **THEN** the system SHALL mark the task as "failed" with an error message indicating the agent is not available, and release the lock

### Requirement: Capture agent output
The system SHALL capture both stdout and stderr from the agent process. Output MUST be stored in memory during execution and written to the output directory upon completion.

#### Scenario: Agent produces stdout output
- **WHEN** the agent process writes to stdout during execution
- **THEN** the system SHALL capture all stdout output up to the configured size limit (default: 1MB)

#### Scenario: Agent output exceeds size limit
- **WHEN** the agent's combined output exceeds the configured size limit
- **THEN** the system SHALL truncate the output, append a notice indicating truncation, and continue execution

### Requirement: Handle agent process lifecycle
The system SHALL monitor the agent process and handle completion, failures, and timeouts.

#### Scenario: Agent completes successfully
- **WHEN** the agent process exits with code 0
- **THEN** the system SHALL mark the task as "completed", write the output to the results directory, and remove the lock file

#### Scenario: Agent fails with non-zero exit code
- **WHEN** the agent process exits with a non-zero exit code
- **THEN** the system SHALL mark the task as "failed", write the error output to the results directory, and remove the lock file

#### Scenario: Agent exceeds timeout
- **WHEN** the agent process runs longer than the configured timeout (default: 30 minutes)
- **THEN** the system SHALL kill the process, mark the task as "timeout", write any captured output to results, and remove the lock file

### Requirement: Concurrent task execution limit
The system SHALL enforce a configurable maximum number of concurrent agent processes (default: 1) to prevent resource exhaustion.

#### Scenario: Maximum concurrent tasks reached
- **WHEN** a new task is detected but the maximum number of agent processes are already running
- **THEN** the system SHALL queue the task and process it when a running agent completes

#### Scenario: Concurrent limit configured to allow parallel execution
- **WHEN** the concurrent task limit is set to a value greater than 1
- **THEN** the system SHALL spawn up to that many agent processes simultaneously
