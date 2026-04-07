# web-task-caching

## ADDED Requirements

### Requirement: Workspace existence caching with TTL
The web dashboard SHALL cache the `checkWorkspaceExists` result in localStorage with a time-to-live (TTL) of 5 minutes.

#### Scenario: Cached workspace check within TTL
- **WHEN** the home page loads and the workspace existence result was cached less than 5 minutes ago
- **THEN** the system SHALL use the cached result without making a Graph API call

#### Scenario: Cached workspace check expired
- **WHEN** the home page loads and the workspace existence result was cached more than 5 minutes ago
- **THEN** the system SHALL fetch a fresh result from the Graph API

#### Scenario: No cached workspace check
- **WHEN** the home page loads and no workspace existence result is cached
- **THEN** the system SHALL fetch the result from the Graph API and cache it

### Requirement: Task listing caching
The web dashboard SHALL cache the task folder listing (the array of DriveItem metadata from `listTaskFiles`) in localStorage so repeat visits can render the list without waiting for the Graph API.

#### Scenario: Cached listing available on home page
- **WHEN** the home page loads and a cached task listing exists
- **THEN** the system SHALL use the cached listing to render recent tasks immediately

#### Scenario: Cached listing available on task list page
- **WHEN** the task list page loads and a cached task listing exists
- **THEN** the system SHALL use the cached listing to render the task list immediately

### Requirement: Node discovery caching
The web dashboard SHALL cache the `discoverNodes` result in localStorage so repeat visits can render node cards without waiting for the N+1 API cascade.

#### Scenario: Cached nodes available
- **WHEN** the home page loads and cached node discovery data exists
- **THEN** the system SHALL render the cached nodes immediately without making Graph API calls
- **AND** the system SHALL refresh node data in the background
