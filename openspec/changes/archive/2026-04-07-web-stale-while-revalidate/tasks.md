## 1. TTL Cache Infrastructure

- [x] 1.1 Add `getCacheWithTTL<T>(key, ttlMs)` and `setCacheWithTTL<T>(key, data, ttlMs)` to `web/src/cache.ts` — stores `{ data, expiresAt }` wrapper, returns null if expired
- [x] 1.2 Add unit tests for TTL cache helpers in `web/src/cache.test.ts`

## 2. Workspace Existence Caching

- [x] 2.1 Add `getCachedWorkspaceExists()` to `web/src/task-cache.ts` that checks TTL cache (5 min) before calling `checkWorkspaceExists()` from graph.ts
- [x] 2.2 Update `web/src/components/home.ts` to use `getCachedWorkspaceExists()` instead of calling `checkWorkspaceExists()` directly

## 3. Home Page Stale-While-Revalidate

- [x] 3.1 Refactor `web/src/components/home.ts`: when cached nodes and tasks exist, render them with `loading=false` immediately (no skeleton)
- [x] 3.2 Run background refresh (`checkWorkspaceExists` + `listTaskFiles` + `discoverNodes` + task content reads) without blocking the UI
- [x] 3.3 After background refresh completes, compare fresh data with cached data using JSON.stringify; re-render and update cache only if data changed
- [x] 3.4 Preserve the current synchronous loading behavior (with skeletons) for first visits when no cached data exists

## 4. Task List Page Stale-While-Revalidate

- [x] 4.1 Refactor `web/src/components/task-list.ts`: when cached task list exists, render it immediately without skeleton loading
- [x] 4.2 Run `loadPage()` in the background; compare results with cached data and re-render only if changed

## 5. Tests and Verification

- [x] 5.1 Run `npm run build` in `web/` and verify it succeeds
- [x] 5.2 Run `npm test` in `web/` and verify all tests pass

## 6. Documentation

- [x] 6.1 Check if README or user-facing docs need updating for the caching behavior change
