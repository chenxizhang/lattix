## Context

The web dashboard (`web/`) is a vanilla TypeScript SPA deployed to GitHub Pages at `lattix.code365.xyz`. It registers a Service Worker (`web/public/sw.js`) that uses a cache-first strategy with a static cache name `lattix-v1`. This means once a user visits the site, all subsequent loads serve cached assets — new deployments are never picked up unless the user manually clears site data.

The build system is Vite, which produces hashed asset filenames (e.g., `index-B3z0q0Lb.js`). However, the SW caches responses by request URL and always serves the cache hit, so even though Vite generates new filenames, the SW intercepts the HTML response (which references the new filenames) and serves the old cached HTML that still points to old assets.

The donate link in the navbar uses `&#9829;` (heart character) but has no specific color styling — it inherits the default link color, making it visually unremarkable.

## Goals / Non-Goals

**Goals:**
- Ensure new deployments are picked up by returning users within a single page load cycle (SW update check → activate → refresh).
- Provide a non-disruptive "update available" notification so users know a refresh will give them the latest version.
- Make the cache name build-specific so old caches are automatically purged.
- Style the donate heart icon red for visual prominence.

**Non-Goals:**
- Workbox or any third-party SW library (keep the SW minimal and hand-written).
- Background sync, push notifications, or offline-first capabilities beyond basic asset caching.
- Full PWA install-prompt UX.
- Language switcher UI (separate concern).

## Decisions

### 1. Build-stamped cache name via Vite `define`

**Decision**: Use Vite's `define` option to inject a `__BUILD_HASH__` constant (derived from `Date.now()` or git short hash) into `sw.js` at build time. The SW uses `CACHE_NAME = 'lattix-<hash>'` instead of the static `lattix-v1`.

**Rationale**: This is the simplest approach with zero dependencies. Vite's `define` replaces constants at build time. Each deployment produces a SW with a different cache name, triggering the browser's byte-diff check on `sw.js`, which fires `updatefound`.

**Alternative considered**: Using `workbox-build` or `vite-plugin-pwa` — rejected because the SW is simple enough to not warrant a framework, and it would add dependencies counter to project conventions.

### 2. SW lifecycle: skip-waiting + clients.claim with update notification

**Decision**: The new SW will:
1. On `install`: open the new cache, pre-cache shell files, then call `self.skipWaiting()`.
2. On `activate`: delete all caches except the current one, then call `self.clients.claim()`.
3. The fetch handler uses network-first for navigation requests (HTML) and cache-first for static assets (JS/CSS/images).

On the client side (`index.ts`):
1. After registering the SW, listen for `registration.onupdatefound`.
2. When the installing worker reaches `activated` state, show a toast: "Update available — click to refresh".
3. On click, call `window.location.reload()`.

**Rationale**: `skipWaiting()` ensures the new SW activates immediately without waiting for all tabs to close. Network-first for navigation ensures the browser always gets the latest `index.html`, which references the latest hashed asset URLs. Cache-first for assets is fine because Vite's hashed filenames ensure cache hits are always correct for a given HTML version.

**Alternative considered**: Automatic silent reload — rejected because an unexpected page refresh during form input (task submission) would be disruptive. A toast notification gives the user control.

### 3. Red heart icon via CSS

**Decision**: Add a CSS rule targeting `.navbar-link--donate` (class already exists on the `<a>` element) to color the heart character red. No HTML changes needed.

```css
.navbar-link--donate::first-letter {
  color: #e74c3c;
}
```

Or simpler: wrap the heart in a `<span>` and style it — but since the `&#9829;` is the first character, `::first-letter` pseudo-element works without any HTML change. If browser support is a concern, we can use a dedicated `.heart` span.

**Rationale**: Minimal change. The `navbar-link--donate` class already exists and scopes the style precisely.

## Test Strategy

- **SW cache versioning**: Add a web unit test that verifies the built `sw.js` contains a cache name different from `lattix-v1` (regex check on build output).
- **Update notification**: Add a test in `index.ts` or a new `sw-update.test.ts` that mocks `navigator.serviceWorker.register()` returning a registration with `onupdatefound`, and verifies a toast/notification element appears.
- **Red heart**: Visual — can be verified by a navbar component test checking that the donate link's heart has the appropriate class or inline style.

## Risks / Trade-offs

- **[Risk] SW `skipWaiting` replaces the active SW mid-session** → Mitigation: navigation requests use network-first, so the HTML served will match the new SW's cached assets. Asset URLs are content-hashed, so there's no mismatch. The toast prompts refresh rather than forcing it.
- **[Risk] `define` replacement in `sw.js`** → `sw.js` lives in `public/` which Vite copies verbatim without transformation. We need to either move it to `src/` and import it as a module worker, or use a small Vite plugin/build script to perform the replacement. A simple `vite.config.ts` plugin that rewrites `public/sw.js` post-build is the lightest approach.
- **[Risk] `::first-letter` pseudo-element** → In some CSS implementations, `::first-letter` only applies to block-level elements. Since the navbar link is inline, this may not work. Safer approach: wrap the heart in a `<span class="heart-icon">` with explicit styling. Low risk, easy fallback.
