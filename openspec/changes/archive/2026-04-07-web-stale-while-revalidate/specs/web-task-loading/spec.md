# web-task-loading

## MODIFIED Requirements

### Requirement: Recent tasks on home page use parallel fetching
The home page recent tasks section SHALL use the same parallel fetching pattern as the full task list page. When individual task content is already cached in localStorage, the home page SHALL use the cached content instead of fetching from the Graph API. When cached listing data exists, the home page SHALL render it immediately without a loading state and refresh data in the background.

#### Scenario: Home page loads recent tasks
- **WHEN** the home page fetches the 10 most recent task files
- **THEN** all file contents SHALL be fetched in parallel
- **AND** successfully loaded tasks SHALL be displayed immediately without waiting for failed ones

#### Scenario: Home page renders cached task content
- **WHEN** the home page loads recent tasks and some task IDs are already cached in localStorage
- **THEN** the system SHALL use cached content for those tasks without making Graph API calls
- **AND** the system SHALL only fetch content for tasks not in the cache

#### Scenario: Home page renders cached data without loading state
- **WHEN** the home page renders and cached task listing and node data exist in localStorage
- **THEN** the system SHALL render the cached data immediately with loading=false (no skeleton)
- **AND** the system SHALL fetch fresh data in the background
- **AND** the system SHALL re-render only if the fresh data differs from the cached data

#### Scenario: Home page first visit with empty cache
- **WHEN** the home page renders and no cached data exists in localStorage
- **THEN** the system SHALL show skeleton loading states
- **AND** the system SHALL fetch data synchronously before rendering

### Requirement: Accurate node task count display
The node cards SHALL display the number of result files found for each hostname, reflecting actual task executions observed in the output directory.

#### Scenario: Node with result files across task directories
- **WHEN** a node hostname appears in result files across 5 task output directories
- **THEN** the node card SHALL display "5 results"

#### Scenario: Node discovery session cache cleared on navigation
- **WHEN** the user navigates to the home page
- **THEN** the node discovery SHALL NOT use stale `sessionStorage` data from a previous page load

## ADDED Requirements

### Requirement: Task list page stale-while-revalidate
The task list page SHALL render cached task list data immediately without a loading state on repeat visits, and refresh data in the background.

#### Scenario: Task list renders cached data instantly
- **WHEN** the task list page renders and cached task list data exists in localStorage
- **THEN** the system SHALL render the cached list immediately without skeleton loading
- **AND** the system SHALL fetch a fresh task listing in the background
- **AND** the system SHALL re-render only if the fresh data differs from the cached data

#### Scenario: Task list first visit with empty cache
- **WHEN** the task list page renders and no cached data exists in localStorage
- **THEN** the system SHALL show skeleton loading states
- **AND** the system SHALL fetch data synchronously before rendering
