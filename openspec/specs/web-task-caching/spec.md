## Requirements

### Requirement: Per-task content caching
The web dashboard SHALL cache individual task JSON content in localStorage keyed by the task's unique ID after the first successful read from the Graph API.

#### Scenario: First visit to a task
- **WHEN** the user navigates to a task detail page for a task not in the cache
- **THEN** the system SHALL fetch the task content from the Graph API
- **AND** the system SHALL store the fetched task content in localStorage keyed by task ID

#### Scenario: Subsequent visit to a cached task
- **WHEN** the user navigates to a task detail page for a task already in the cache
- **THEN** the system SHALL render the cached task content immediately
- **AND** the system SHALL NOT make a Graph API call to read the task file content

#### Scenario: Task list rendering with cached content
- **WHEN** the task list page loads and some task IDs are already cached
- **THEN** the system SHALL use cached content for those tasks
- **AND** the system SHALL only fetch content from the Graph API for tasks not in the cache

### Requirement: Per-task results caching
The web dashboard SHALL cache task result files in localStorage keyed by the task's unique ID after the first successful read.

#### Scenario: First view of task results
- **WHEN** the user views the detail page for a task whose results are not cached
- **THEN** the system SHALL fetch result files from the Graph API
- **AND** the system SHALL store the parsed results in localStorage keyed by task ID

#### Scenario: Re-viewing cached task results
- **WHEN** the user views the detail page for a task whose results are already cached
- **THEN** the system SHALL render the cached results immediately
- **AND** the system SHALL fetch fresh results in the background (stale-while-revalidate)
- **AND** if new results are found, the system SHALL merge them into the cache and re-render

### Requirement: Cache uses account-scoped keys
All task and result cache entries SHALL use the existing account-scoped key prefix from `cache.ts` to isolate data between different Microsoft accounts.

#### Scenario: Different accounts see different cached data
- **WHEN** user A logs in and views tasks, then logs out, and user B logs in
- **THEN** user B SHALL NOT see user A's cached task data
- **AND** each user's cache entries SHALL be prefixed with their account ID

### Requirement: Cache resilience on quota exceeded
The web dashboard SHALL gracefully handle localStorage quota exceeded errors when writing cache entries.

#### Scenario: localStorage quota exceeded
- **WHEN** the system attempts to cache a task and localStorage throws a quota exceeded error
- **THEN** the system SHALL silently ignore the error
- **AND** the system SHALL continue to function normally by fetching from the Graph API

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
