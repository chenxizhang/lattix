## 1. Service Worker Rewrite

- [x] 1.1 Rewrite `web/public/sw.js` to use a `__BUILD_HASH__` placeholder in the cache name instead of the static `lattix-v1`
- [x] 1.2 Change navigation requests (mode === 'navigate') to use network-first strategy with cache fallback
- [x] 1.3 Keep cache-first strategy for static assets (JS, CSS, images), caching on fetch
- [x] 1.4 Ensure `activate` event deletes all caches except the current build's cache name

## 2. Vite Build Integration

- [x] 2.1 Add a Vite plugin in `web/vite.config.ts` that replaces `__BUILD_HASH__` in `public/sw.js` with a build timestamp during production build
- [x] 2.2 Verify that `npm run build` in `web/` produces a `dist/sw.js` with the timestamp substituted (not the raw placeholder)

## 3. Client-Side Update Notification

- [x] 3.1 Add update detection logic in `web/src/index.ts`: listen for `registration.onupdatefound`, track the installing worker's state, and detect when `controllerchange` fires
- [x] 3.2 Show a toast notification ("Update available — click to refresh") when a new SW version activates, using the existing `showToast` utility
- [x] 3.3 On toast click, call `window.location.reload()` to apply the update
- [x] 3.4 Add i18n keys for the update notification message to both `web/src/locales/en-US.json` and `web/src/locales/zh-CN.json`

## 4. Donate Heart Icon Styling

- [x] 4.1 Wrap the heart character `&#9829;` in `web/src/components/navbar.ts` with a `<span class="heart-icon">` for targeted styling
- [x] 4.2 Add CSS rule in `web/styles/main.css` for `.heart-icon { color: #e74c3c; }` to render the heart in red

## 5. Tests

- [x] 5.1 Add a navbar component test verifying the donate link contains a `.heart-icon` span with red color styling
- [x] 5.2 Add a test verifying the i18n catalogs still have identical key sets (existing test covers this, just ensure new keys are in both locales)
- [x] 5.3 Run `npm run build` in `web/` and verify it succeeds
- [x] 5.4 Run `npm test` in `web/` and verify all tests pass

## 6. Documentation

- [x] 6.1 Check if README or any user-facing docs mention SW caching or PWA behavior and update if needed
