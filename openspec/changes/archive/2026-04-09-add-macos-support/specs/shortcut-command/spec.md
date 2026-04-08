## MODIFIED Requirements

### Requirement: Shortcut command registration on install or run via npx
The system SHALL check whether a convenient `lattix` command is available only when the `install` or `run` command is invoked via npx (detected by checking whether the script path contains an npx cache directory such as `_npx`). If no global `lattix` command exists and no wrapper has been created, the system SHALL create a platform-appropriate wrapper file in the npm global bin directory: `lattix.cmd` delegating to `npx -y lattix %*` on Windows, or an executable `lattix` shell wrapper delegating to `npx -y lattix "$@"` on POSIX platforms such as macOS. Because this directory is already in the user's PATH in supported setups, the shortcut is available immediately without a terminal restart. For other commands (e.g., `submit`, `status`, `stop`) or when not running via npx, shortcut registration SHALL be skipped.

#### Scenario: First run via npx on Windows with no global lattix installed
- **WHEN** the user runs `npx -y lattix run` (or `npx -y lattix install`) on Windows for the first time and `lattix` is not globally installed and no wrapper exists
- **THEN** the system SHALL create `lattix.cmd` in the npm global bin directory with content `@npx -y lattix %*`, and the command SHALL be immediately available in the current terminal

#### Scenario: First run via npx on macOS with no global lattix installed
- **WHEN** the user runs `npx -y lattix run` (or `npx -y lattix install`) on macOS for the first time and `lattix` is not globally installed and no wrapper exists
- **THEN** the system SHALL create an executable `lattix` shell wrapper in the npm global bin directory that delegates to `npx -y lattix "$@"`, and the command SHALL be immediately available in the current terminal

#### Scenario: Command invoked via npx but is not install or run
- **WHEN** the user runs `npx -y lattix submit --prompt "..."` or any command other than `install` or `run`
- **THEN** the system SHALL skip shortcut registration entirely

#### Scenario: Command invoked without npx (e.g., global install or wrapper)
- **WHEN** the user runs `lattix run` via a global install or an existing wrapper (script path does not contain `_npx`)
- **THEN** the system SHALL skip shortcut registration entirely

#### Scenario: Global lattix already installed
- **WHEN** the user runs `npx -y lattix run` and `lattix` is already globally installed (via `npm install -g`)
- **THEN** the system SHALL skip wrapper creation entirely

#### Scenario: Wrapper already exists
- **WHEN** the user runs `npx -y lattix run` and a platform-appropriate wrapper already exists in the npm global bin directory
- **THEN** the system SHALL skip wrapper creation

### Requirement: Global install detection excludes npx cache
The system SHALL detect whether `lattix` is globally installed by using the platform-native command lookup (`where` on Windows, `which -a` on POSIX) and filtering out any results that point to npx cache directories (paths containing `_npx` or `npm-cache`). Only results pointing to global npm bin directories or user-installed locations SHALL count as a valid global install.

#### Scenario: Only npx cache version exists
- **WHEN** platform-native command lookup returns paths that all contain `_npx` or `npm-cache`
- **THEN** the system SHALL treat this as "not globally installed" and proceed with wrapper creation

#### Scenario: Global npm install exists alongside npx cache
- **WHEN** platform-native command lookup returns both npx cache paths and a global npm bin path
- **THEN** the system SHALL treat this as "globally installed" and skip wrapper creation
