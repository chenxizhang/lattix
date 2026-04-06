## MODIFIED Requirements

### Requirement: Recent tasks on home page use parallel fetching
The home page recent tasks section SHALL use the same parallel fetching pattern as the full task list page. When individual task content is already cached in localStorage, the home page SHALL use the cached content instead of fetching from the Graph API.

#### Scenario: Home page loads recent tasks
- **WHEN** the home page fetches the 10 most recent task files
- **THEN** all file contents SHALL be fetched in parallel
- **AND** successfully loaded tasks SHALL be displayed immediately without waiting for failed ones

#### Scenario: Home page renders cached task content
- **WHEN** the home page loads recent tasks and some task IDs are already cached in localStorage
- **THEN** the system SHALL use cached content for those tasks without making Graph API calls
- **AND** the system SHALL only fetch content for tasks not in the cache
