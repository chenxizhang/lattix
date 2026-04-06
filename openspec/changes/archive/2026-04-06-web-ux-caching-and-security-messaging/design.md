## Context

The Lattix web dashboard is a vanilla TypeScript SPA that authenticates via MSAL and reads/writes OneDrive files through the Microsoft Graph API. It already has an account-scoped `cache.ts` module (`getCache`/`setCache`) used by the home page and task list to provide stale-while-revalidate rendering. However, the task detail page has no caching at all, and the existing task-list cache only stores the first page of results without caching individual task content by ID.

Tasks in Lattix are immutable once written — a task file is created once and never modified. Results are also effectively immutable: once a machine writes its result, it does not change. This immutability makes tasks ideal candidates for permanent caching after first read.

The login card currently shows "Distributed agent orchestration dashboard". The README and web About section lack any mention of Lattix's security posture (no tunnels, no exposed ports, no data movement).

## Goals / Non-Goals

**Goals:**
- Reduce Graph API calls by caching immutable task content and results in localStorage
- Provide instant rendering of previously-viewed tasks without network round-trips
- Update the login card tagline to "Distributed agent orchestration"
- Add security/compliance messaging to README and web About section

**Non-Goals:**
- Implementing cache invalidation with TTL — immutable data does not expire
- Adding cache size management or eviction policies (localStorage quota is ~5-10MB, sufficient for task JSON)
- Changing the Graph API layer or authentication flow
- Modifying the task submission flow

## Decisions

### D1: Per-task content caching by task ID

Cache individual task JSON content keyed by task ID (e.g., `cache_task_{id}`). When navigating to task detail or rendering a task in a list, check cache first. If cached, skip the Graph API `readFileContent`/`readFileByUrl` call entirely.

**Rationale**: Task files are immutable — once created, their content never changes. A single task JSON is typically < 1KB, so caching hundreds of tasks is well within localStorage limits.

**Alternative considered**: Cache only the task list page as a whole (current approach for task-list). Rejected because it doesn't help task-detail navigation and doesn't cache across list pages.

### D2: Per-task results caching by task ID

Cache results for each task keyed by `cache_results_{taskId}`. After fetching result files for a task, store the parsed result objects. On subsequent visits, serve from cache without re-fetching.

**Rationale**: Results are written once per machine and do not change afterward. Caching them avoids re-listing the output directory and re-reading each result file on every task detail view.

**Alternative considered**: Only cache after detecting a "completed" status. Rejected because all results are immutable regardless of status, and partial results are still valid cache entries (new results from other machines can be merged on refresh).

### D3: Stale-while-revalidate for recent tasks on home page

The home page already uses stale-while-revalidate for the task list. Enhance it to also use per-task content caching (D1), so individual task content is served from cache and only the file listing is refreshed to detect new tasks.

**Rationale**: The listing call is lightweight (metadata only), but reading 10 task file contents is 10 additional API calls. With per-task caching, most of those calls are eliminated after the first visit.

### D4: Login card text is a one-line change

Change the `<p>` text in `login.ts` from "Distributed agent orchestration dashboard" to "Distributed agent orchestration".

**Rationale**: No architectural decision needed. Aligns the login card with the brand tagline used elsewhere (navbar, README).

### D5: Security messaging as static content

Add security/compliance content as static text in `README.md` (new section) and `settings.ts` (expanded About section). No dynamic behavior or new components.

**Rationale**: This is a messaging change, not a feature. Static text keeps it simple and maintainable.

## Test Strategy

**Test-first approach for caching behavior:**
1. **Before implementation**, add unit tests (Vitest) that verify:
   - `getCache('task_{id}')` returns `null` on first load, triggering a Graph API fetch
   - After a task is fetched and cached via `setCache`, subsequent reads return cached data
   - Task detail component renders cached content without calling `readFileContent`
   - Task results are cached per task ID and served on re-navigation
   - New tasks not in cache still trigger API calls
2. **Existing tests** for home and task-list caching patterns should be reviewed and extended to cover per-task content caching.
3. **Login card text** can be verified by a simple test asserting the `<p>` content.
4. **Security messaging** is static content — manual review is sufficient, but a snapshot test on the About section HTML is recommended.

## Risks / Trade-offs

- **[localStorage quota]** → Mitigation: Individual task JSONs are < 1KB. Even 1000 cached tasks would use < 1MB. If quota is exceeded, the existing `setCache` silently catches the error and the app falls back to API fetches.
- **[Stale results for tasks still being processed]** → Mitigation: For task detail, we can re-fetch results in the background even when cache exists (stale-while-revalidate), merging any new results from machines that completed after the last visit. Only fully completed tasks (all expected machines reported) would skip background refresh.
- **[Cache grows indefinitely]** → Mitigation: Acceptable for now. Tasks are small and users typically work with a finite number of tasks. Cache eviction can be added later if needed (non-goal for this change).
