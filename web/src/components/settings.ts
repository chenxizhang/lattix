import { renderNavbar } from './navbar';

export function renderSettings(container: HTMLElement): void {
  renderNavbar(container);

  const cfg = window.LATTIX_CONFIG;

  const main = document.createElement('main');
  main.className = 'main-content';
  main.innerHTML = `
    <h2>Settings</h2>
    <section class="settings-section">
      <h3>Entra ID Configuration</h3>
      <table class="settings-table">
        <tr>
          <td><strong>Client ID</strong></td>
          <td><code>${cfg?.clientId || 'Not configured'}</code></td>
        </tr>
        <tr>
          <td><strong>Authority</strong></td>
          <td><code>${cfg?.authority || 'https://login.microsoftonline.com/common'}</code></td>
        </tr>
        <tr>
          <td><strong>Redirect URI</strong></td>
          <td><code>${cfg?.redirectUri || window.location.origin}</code></td>
        </tr>
      </table>
    </section>
    <section class="settings-section">
      <h3>About</h3>
      <p>Lattix Web Dashboard connects to your OneDrive via Microsoft Graph API to display tasks and nodes managed by the Lattix CLI.</p>
      <p>
        <a href="https://github.com/chenxizhang/lattix" target="_blank" rel="noopener">GitHub Repository</a> ·
        <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener">Azure App Registrations</a>
      </p>
    </section>
  `;
  container.appendChild(main);
}
