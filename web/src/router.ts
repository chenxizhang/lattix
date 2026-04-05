import type { ViewRenderer, Route } from './types';
import { isAuthenticated } from './auth';

let routes: Route[] = [];
let loginRenderer: ViewRenderer | null = null;

export function registerRoutes(routeDefs: Route[], loginView: ViewRenderer): void {
  routes = routeDefs;
  loginRenderer = loginView;
}

export function navigate(hash: string): void {
  window.location.hash = hash;
}

export function getCurrentPath(): string {
  return window.location.hash.slice(1) || '/';
}

export function startRouter(): void {
  const render = () => {
    const container = document.getElementById('app');
    if (!container) return;

    if (!isAuthenticated()) {
      container.innerHTML = '';
      if (loginRenderer) loginRenderer(container);
      return;
    }

    const path = getCurrentPath();
    let matched = false;

    for (const route of routes) {
      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        const groups = match.groups;
        if (groups) {
          for (const [key, val] of Object.entries(groups)) {
            params[key] = val;
          }
        }
        container.innerHTML = '';
        const renderer = route.handler(params);
        renderer(container);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Fallback to home
      navigate('#/');
    }
  };

  window.addEventListener('hashchange', render);
  render();
}
