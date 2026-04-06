## 1. Login Card Tagline

- [x] 1.1 Update `web/src/components/login.ts` to change the `<p>` text from "Distributed agent orchestration dashboard" to "Distributed agent orchestration"

## 2. Per-Task Content Caching

- [x] 2.1 Add test in `web/src/components/` for per-task content caching: verify that `getCache('task_{id}')` returns null on first load, and returns cached data after `setCache` is called
- [x] 2.2 Add a `getTaskContent(taskId, downloadUrl?, itemId?)` helper function (in `cache.ts` or a new `task-cache.ts` module) that checks localStorage for cached task content before calling the Graph API, and caches the result on first fetch
- [x] 2.3 Update `web/src/components/home.ts` to use `getTaskContent()` when reading recent task file contents, skipping Graph API calls for already-cached tasks
- [x] 2.4 Update `web/src/components/task-list.ts` to use `getTaskContent()` when reading task file contents for each page of results
- [x] 2.5 Update `web/src/components/task-detail.ts` to use `getTaskContent()` when reading the task file content, rendering from cache if available

## 3. Per-Task Results Caching

- [x] 3.1 Add test for per-task results caching: verify results are cached by task ID and served on re-navigation, and that background refresh merges new results
- [x] 3.2 Add a `getTaskResults(taskId)` helper that checks localStorage for cached results, serves them immediately, and fetches fresh results in the background (stale-while-revalidate), merging any new results into the cache
- [x] 3.3 Update `web/src/components/task-detail.ts` to use `getTaskResults()` for loading and displaying results

## 4. Security & Compliance Messaging — README

- [x] 4.1 Add a "Security & Compliance" section to `README.md` after the Architecture section, explaining: no tunnels, no exposed ports, no data movement, coordination through OneDrive sync only

## 5. Security & Compliance Messaging — Web About

- [x] 5.1 Update the About section in `web/src/components/settings.ts` to include security and compliance messaging: no tunnels, no exposed ports, no data movement, all coordination via OneDrive

## 6. Verification

- [x] 6.1 Run `npm run build` in the web directory and confirm no compilation errors
- [x] 6.2 Run `npm test` in the web directory and confirm all tests pass
- [x] 6.3 Manually verify login card displays "Distributed agent orchestration" (no "dashboard")
- [x] 6.4 Review README security section for accuracy and completeness
