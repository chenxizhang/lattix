## Why

The web dashboard's Service Worker uses a fixed `lattix-v1` cache name with a cache-first strategy. When new builds are deployed, users continue seeing stale cached assets indefinitely — including missing features like i18n translations. There is no mechanism to detect or apply updates. Additionally, the donate heart icon lacks visual emphasis.

## What Changes

- **PWA auto-update**: Implement a version-aware Service Worker that detects new deployments and automatically activates the latest assets. Include a user-visible "update available" prompt so page refresh happens with user awareness.
- **Build-stamped cache busting**: Inject a build hash or timestamp into the SW cache name so each deployment creates a new cache, causing the old one to be purged on activation.
- **Donate heart icon color**: Style the heart character (&#9829;) next to the "Donate" navbar link in red so it stands out visually.

## Capabilities

### New Capabilities

- `pwa-update`: Covers Service Worker versioning, cache invalidation on new deployments, update detection, and user notification of available updates.

### Modified Capabilities

- `web-donation-page`: The donate link in the navbar gains a red heart icon style (visual-only change, no spec-level requirement change).

## Impact

- **`web/public/sw.js`** — Rewrite to use build-stamped cache name and proper update lifecycle.
- **`web/src/index.ts`** — Add SW update detection logic (listen for `controllerchange` or `updatefound` events) and optional UI prompt.
- **`web/vite.config.ts`** — May need a plugin or define to inject build hash into SW.
- **`web/styles/main.css`** — Add style for red heart icon on donate link.
- **`web/src/components/navbar.ts`** — Minor: may need a CSS class on the heart character for targeted styling (already has `navbar-link--donate` class on the `<a>` element).
- No CLI changes. No breaking changes.
