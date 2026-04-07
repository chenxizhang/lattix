## Context

The web dashboard fetches data from Microsoft Graph API (OneDrive) for three key data sets on the home page: workspace existence, task file listing, and node discovery. Currently, all three are fetched fresh on every page visit, blocking rendering behind network latency. The task-detail page already uses stale-while-revalidate for results (`task-cache.ts:45-61`), but the home and task-list pages do not.

Current data flow on home page:
1. Render cached nodes/tasks with `loading=true` (shows skeleton if no cache)
2. `await checkWorkspaceExists()` — **blocking, uncached**
3. `await Promise.all([listTaskFiles(), discoverNodes()])` — **blocking, uncached**
4. Read individual task contents (cached per-task) — fast on repeat visits
5. Re-render with `loading=false`

The user sees skeletons/loading for the entire duration of steps 2-4, even when step 1 already rendered valid cached data.

## Goals / Non-Goals

**Goals:**
- Home page and task list page render cached data immediately as the final view (no loading state) on repeat visits
- Background refresh happens silently; UI only re-renders if data actually changed
- `checkWorkspaceExists` result is cached with a 5-minute TTL to avoid blocking the critical path
- `discoverNodes` and `listTaskFiles` results are cached and served stale-while-revalidate
- First-ever visit (empty cache) still shows loading skeletons and fetches synchronously

**Non-Goals:**
- Changing the Graph API call patterns or batching strategy
- Offline-first capability (we rely on the network for fresh data)
- Real-time updates or WebSocket push

## Decisions

### 1. TTL-aware cache for workspace existence

**Decision**: Add `getCacheWithTTL` / `setCacheWithTTL` helpers to `cache.ts` that store a `{ data, expiresAt }` wrapper. `checkWorkspaceExists` result is cached with a 5-minute TTL. If the cache entry exists and is not expired, skip the API call entirely.

**Rationale**: Workspace existence almost never changes (once created, it stays). A 5-minute TTL avoids stale-forever while eliminating the blocking call on most visits. This is simpler than stale-while-revalidate for a boolean check.

**Alternative considered**: Caching forever with no TTL — rejected because a user could delete their workspace and would be stuck with stale data indefinitely.

### 2. Stale-while-revalidate for home page data

**Decision**: On the home page, if cached data exists:
1. Render cached nodes and tasks immediately with `loading=false` (final view)
2. Run `checkWorkspaceExists` (cached with TTL), `listTaskFiles()`, and `discoverNodes()` in the background
3. Compare fresh data with cached data; re-render only if different
4. Update cache with fresh data

If no cached data exists (first visit): fall back to the current synchronous flow with skeleton loading.

**Rationale**: This matches the pattern already established by `getTaskResults()` in `task-cache.ts`. The user sees content instantly on repeat visits. Background refresh ensures data stays reasonably fresh without blocking the UI.

### 3. Stale-while-revalidate for task list page

**Decision**: Same pattern as home page — render cached `task_list` immediately, fetch fresh listing in background, re-render on change.

**Rationale**: Consistent pattern across the two main pages.

### 4. Simple change-detection via JSON comparison

**Decision**: Use `JSON.stringify(cached) !== JSON.stringify(fresh)` to determine if a re-render is needed after background refresh.

**Rationale**: The data structures are small (10-50 items). JSON serialization comparison is simple and avoids complex deep-equal logic. Performance is not a concern at this scale.

## Test Strategy

- Add unit tests for `getCacheWithTTL` / `setCacheWithTTL` in `cache.test.ts`
- Update existing home page and task-list tests to verify: when cached data exists, the component renders without a loading state before any network call completes
- Verify the background refresh pattern by mocking `listTaskFiles` and checking re-render behavior

## Risks / Trade-offs

- **[Risk] Stale data shown briefly** → Acceptable. Background refresh runs immediately, and the re-render is typically < 1 second behind. The alternative (blocking loading) is a worse UX.
- **[Risk] Double render on data change** → The re-render when fresh data arrives may cause a brief visual update. Mitigation: only re-render if data actually changed (JSON comparison). Most repeat visits have identical data, so no second render.
- **[Risk] `checkWorkspaceExists` TTL could serve stale false** → If a user creates a workspace and refreshes within 5 minutes of a previous "not exists" check, they'd still see the onboarding screen. Mitigation: 5 minutes is short enough. The user can hard-refresh to bypass the cache.
