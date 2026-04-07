## Why

The web dashboard's home page and task list page make blocking Graph API calls on every visit — even when cached data exists in localStorage. Users see skeleton loading states for several seconds while `checkWorkspaceExists()`, `listTaskFiles()`, and `discoverNodes()` complete over the network. The task-detail page already implements stale-while-revalidate for results, but the two most-visited pages do not. This creates a noticeably sluggish experience, especially on repeat visits where the data hasn't changed.

## What Changes

- **Cache `checkWorkspaceExists` result** with a short TTL so the workspace check doesn't block data fetching on every home page visit.
- **Apply stale-while-revalidate to home page**: render cached nodes and tasks immediately with `loading=false`, then silently refresh in the background and re-render only if data changed.
- **Apply stale-while-revalidate to task list page**: render cached task list immediately, then refresh in the background.
- **Cache `listTaskFiles` directory listing** so repeat visits don't wait for the folder listing API call before showing tasks.
- **Cache `discoverNodes` result** so repeat visits show nodes instantly.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `web-task-loading`: Home page and task list page SHALL render cached data immediately without a loading state, then refresh in the background (stale-while-revalidate).
- `web-task-caching`: Add caching for workspace existence check, task folder listing, and node discovery — not just individual task content and results.

## Impact

- **`web/src/components/home.ts`** — Refactor async loading to render cached data as final (not loading), run `checkWorkspaceExists` + fetch in background, re-render only on change.
- **`web/src/components/task-list.ts`** — Refactor to render cached list as final, fetch fresh data in background.
- **`web/src/task-cache.ts`** — Add `getCachedWorkspaceExists()`, cached listing helpers.
- **`web/src/cache.ts`** — Add TTL-aware `getCacheWithTTL` / `setCacheWithTTL` for short-lived cache entries.
- Existing tests for home and task-list components may need updating.
- No CLI changes. No breaking changes.
