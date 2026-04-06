## Why

The web dashboard has three areas that need improvement: (1) the login card displays "Distributed agent orchestration dashboard" but the word "dashboard" dilutes the brand message — the tagline should be the cleaner "Distributed agent orchestration"; (2) task data (recent tasks, task list, and task detail) is re-fetched from the Graph API on every navigation even though most tasks are immutable once written — this wastes API calls and makes the app feel slow; (3) the README and the web About section fail to communicate Lattix's core security and compliance value — that it requires no tunnels, no exposed ports, and moves no data, relying entirely on OneDrive sync.

## What Changes

- **Login card text**: Remove the word "dashboard" from the login card tagline so it reads "Distributed agent orchestration".
- **Task data caching**: Cache task list items, individual task content, and per-task results in localStorage after the first Graph API read, using the existing account-scoped `cache.ts` module. Serve cached data immediately on navigation and skip re-fetching for tasks whose content is known to be immutable.
- **Security & compliance messaging in README**: Add a dedicated section to `README.md` highlighting the zero-tunnel, zero-port-exposure, zero-data-movement architecture and its compliance benefits.
- **Security & compliance messaging in web About**: Expand the About section in the Settings page to communicate the same security value proposition to web users.

## Capabilities

### New Capabilities

- `web-task-caching`: localStorage-based caching for task list entries, task detail content, and task results, with stale-while-revalidate for mutable data (recent tasks) and permanent cache for immutable data (completed task content and results).
- `security-messaging`: Security and compliance value proposition text in README and web About section, emphasizing no tunnels, no exposed ports, and no data movement.

### Modified Capabilities

- `web-task-loading`: Task detail page will use cached task content and results instead of always fetching fresh from Graph API.

## Impact

- **Web components affected**: `login.ts` (tagline text), `home.ts` (recent tasks caching), `task-list.ts` (list caching), `task-detail.ts` (detail + results caching), `settings.ts` (About section expansion).
- **Shared module affected**: `cache.ts` (may need new helpers for per-task keying).
- **Documentation affected**: `README.md` (new security section).
- **No API changes, no dependency additions, no breaking changes.**
- **Testing impact**: Add web unit tests for the new caching behavior in task-detail; existing tests for task-list and home caching patterns should be extended.
