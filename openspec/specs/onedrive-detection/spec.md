## Purpose
Define how the system detects and validates supported OneDrive sync folders required for shared task exchange.

## Requirements

### Requirement: Detect supported OneDrive sync folders
The system SHALL automatically detect usable OneDrive sync folders on the local machine by scanning platform-appropriate common locations and registry entries. Detection MUST include both OneDrive for Business folders and personal OneDrive folders on supported platforms, including Windows paths such as `C:\Users\<user>\OneDrive - <OrgName>` / `C:\Users\<user>\OneDrive` and macOS paths such as `~/Library/CloudStorage/OneDrive*` and legacy home-directory `~/OneDrive*`.

#### Scenario: Exactly one supported OneDrive account is available
- **WHEN** the system detects exactly one usable OneDrive sync folder for the `onedrive` provider
- **THEN** the system SHALL select that folder without prompting the user

#### Scenario: Personal and business OneDrive are both available
- **WHEN** the system detects more than one usable OneDrive sync folder for the `onedrive` provider
- **THEN** the system SHALL present the detected accounts and prompt the user to choose one before initialization continues

#### Scenario: No supported OneDrive account is available
- **WHEN** the system starts the `onedrive` provider flow and no usable personal or business OneDrive sync folder can be detected
- **THEN** the system SHALL display a clear error explaining that no supported OneDrive account is available and exit with a non-zero exit code

### Requirement: Validate OneDrive sync is active
The system SHALL verify that the selected OneDrive sync folder is usable, not merely present on disk.

#### Scenario: Selected OneDrive folder exists and is usable
- **WHEN** the user selects a detected OneDrive account and the folder exists on disk
- **THEN** the system SHALL continue initialization with that sync directory

#### Scenario: Selected OneDrive folder is missing on disk
- **WHEN** the selected OneDrive folder no longer exists on disk
- **THEN** the system SHALL stop initialization with a clear error instructing the user to verify OneDrive is syncing correctly

### Requirement: Detection on Windows
The system SHALL support OneDrive account detection on Windows by checking the Windows Registry (`HKCU\Software\Microsoft\OneDrive\Accounts`) and well-known paths under the user's home directory for both personal and business accounts.

#### Scenario: Standard Windows installation with registry entries
- **WHEN** the system runs on Windows with standard OneDrive registry entries available
- **THEN** the system SHALL read candidate personal and business account folders from the registry and validate the detected paths on disk

#### Scenario: Registry lookup is unavailable
- **WHEN** registry lookup fails or returns no usable OneDrive folders
- **THEN** the system SHALL fall back to well-known directory scanning before reporting that no supported account was found

### Requirement: Detection on macOS
The system SHALL support OneDrive account detection on macOS by scanning the user's `~/Library/CloudStorage` directory first and falling back to well-known home-directory locations, collecting candidate directories whose names begin with `OneDrive` and validating the detected paths on disk.

#### Scenario: Standard macOS File Provider installation
- **WHEN** the system runs on macOS and `~/Library/CloudStorage` contains one or more usable OneDrive directories
- **THEN** the system SHALL treat those directories as candidate personal or business OneDrive accounts and validate them before use

#### Scenario: Legacy macOS OneDrive path
- **WHEN** the system runs on macOS, no usable OneDrive directory is found under `~/Library/CloudStorage`, and a usable OneDrive directory exists directly under the user's home directory
- **THEN** the system SHALL treat the home-directory path as a candidate and continue bootstrap if validation succeeds
