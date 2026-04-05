import { login } from '../auth';

export function renderLogin(container: HTMLElement): void {
  const section = document.createElement('section');
  section.className = 'login-view';
  section.innerHTML = `
    <div class="login-card">
      <img src="/icons/icon-192.png" alt="Lattix" class="login-logo" width="80" height="80" />
      <h1>Lattix</h1>
      <p>Distributed agent orchestration dashboard</p>
      <button class="btn btn-primary login-btn" id="login-btn">
        Sign in with Microsoft
      </button>
    </div>
  `;
  container.appendChild(section);

  section.querySelector('#login-btn')!.addEventListener('click', () => {
    login().catch((err) => console.error('Login failed:', err));
  });
}
