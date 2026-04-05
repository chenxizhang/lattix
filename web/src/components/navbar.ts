import { getAccount, logout, switchAccount } from '../auth';
import { navigate } from '../router';

export function renderNavbar(container: HTMLElement): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'navbar';

  const account = getAccount();
  const displayName = account?.name || account?.username || '';

  nav.innerHTML = `
    <div class="navbar-brand">
      <a href="#/" class="navbar-logo">
        <img src="/icons/icon-192.png" alt="" width="28" height="28" />
        <span>Lattix</span>
      </a>
      <button class="navbar-toggle" id="nav-toggle" aria-label="Menu">☰</button>
    </div>
    <div class="navbar-menu" id="nav-menu">
      <a href="#/" class="navbar-link">Home</a>
      <a href="#/tasks" class="navbar-link">Tasks</a>
      <a href="#/settings" class="navbar-link">Settings</a>
      <div class="navbar-user">
        <span class="navbar-username">${displayName}</span>
        <button class="btn btn-sm" id="switch-account-btn">Switch</button>
        <button class="btn btn-sm" id="logout-btn">Logout</button>
      </div>
    </div>
  `;

  container.prepend(nav);

  nav.querySelector('#nav-toggle')!.addEventListener('click', () => {
    nav.querySelector('#nav-menu')!.classList.toggle('navbar-menu--open');
  });

  nav.querySelector('#logout-btn')!.addEventListener('click', () => {
    logout().catch(console.error);
  });

  nav.querySelector('#switch-account-btn')!.addEventListener('click', () => {
    switchAccount().catch(console.error);
  });

  // Highlight active link
  const path = window.location.hash.slice(1) || '/';
  nav.querySelectorAll('.navbar-link').forEach((link) => {
    const href = link.getAttribute('href')?.slice(1) || '/';
    if (path === href || (href !== '/' && path.startsWith(href))) {
      link.classList.add('navbar-link--active');
    }
  });

  return nav;
}
