import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface OneDriveAccount {
  name: string;
  path: string;
  isBusiness: boolean;
}

export class OneDriveDetector {
  /**
   * Detect all OneDrive sync folders on this machine.
   * Returns the OneDrive for Business folder path, or throws if not found.
   */
  detect(): string {
    const accounts = this.findAccounts();

    if (accounts.length === 0) {
      throw new Error(
        'OneDrive for Business is not installed or no sync folder was found.\n' +
        'Please install OneDrive and sign in with your business account.\n' +
        'Download: https://www.microsoft.com/en-us/microsoft-365/onedrive/download'
      );
    }

    const businessAccounts = accounts.filter(a => a.isBusiness);

    if (businessAccounts.length === 0) {
      throw new Error(
        'No OneDrive for Business account found.\n' +
        `Found ${accounts.length} personal OneDrive account(s), but a business account is required.\n` +
        'Please sign in with your organization account in OneDrive.'
      );
    }

    if (businessAccounts.length > 1) {
      console.warn(
        `Multiple OneDrive for Business accounts detected. Using the first one:\n` +
        businessAccounts.map((a, i) => `  ${i + 1}. ${a.name} → ${a.path}`).join('\n')
      );
    }

    const selected = businessAccounts[0];

    if (!fs.existsSync(selected.path)) {
      throw new Error(
        `OneDrive for Business folder detected at "${selected.path}" but it does not exist on disk.\n` +
        'Please verify OneDrive is syncing correctly.'
      );
    }

    console.log(`✓ OneDrive for Business detected: ${selected.path}`);
    return selected.path;
  }

  private findAccounts(): OneDriveAccount[] {
    const accounts: OneDriveAccount[] = [];

    // Method 1: Scan Windows Registry
    if (process.platform === 'win32') {
      accounts.push(...this.findFromRegistry());
    }

    // Method 2: Scan well-known paths
    if (accounts.length === 0) {
      accounts.push(...this.findFromWellKnownPaths());
    }

    return accounts;
  }

  private findFromRegistry(): OneDriveAccount[] {
    const accounts: OneDriveAccount[] = [];

    try {
      // Query registry for OneDrive accounts
      const regOutput = execSync(
        'reg query "HKCU\\Software\\Microsoft\\OneDrive\\Accounts" /s',
        { encoding: 'utf-8', timeout: 5000 }
      );

      // Parse each account block
      const blocks = regOutput.split(/\r?\n\r?\n/);
      let currentKey = '';

      for (const line of regOutput.split(/\r?\n/)) {
        const keyMatch = line.match(/^HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\(.+)/i);
        if (keyMatch) {
          currentKey = keyMatch[1];
          continue;
        }

        const valueMatch = line.match(/^\s+UserFolder\s+REG_SZ\s+(.+)/i);
        if (valueMatch && currentKey) {
          const folderPath = valueMatch[1].trim();
          const isBusiness = currentKey.toLowerCase().startsWith('business');
          accounts.push({
            name: currentKey,
            path: folderPath,
            isBusiness,
          });
        }
      }
    } catch {
      // Registry query failed, fall through to well-known paths
    }

    return accounts;
  }

  private findFromWellKnownPaths(): OneDriveAccount[] {
    const accounts: OneDriveAccount[] = [];
    const homeDir = os.homedir();

    try {
      const entries = fs.readdirSync(path.dirname(homeDir) === homeDir
        ? homeDir
        : path.dirname(homeDir));

      // Also check the home directory itself for OneDrive folders
      const homeDirEntries = fs.readdirSync(homeDir);

      for (const entry of homeDirEntries) {
        const fullPath = path.join(homeDir, entry);
        if (!fs.statSync(fullPath).isDirectory()) continue;

        if (entry.startsWith('OneDrive - ')) {
          // "OneDrive - CompanyName" pattern = Business account
          accounts.push({
            name: entry.replace('OneDrive - ', ''),
            path: fullPath,
            isBusiness: true,
          });
        } else if (entry === 'OneDrive') {
          // Plain "OneDrive" = personal account
          accounts.push({
            name: 'Personal',
            path: fullPath,
            isBusiness: false,
          });
        }
      }
    } catch {
      // Failed to scan directories
    }

    return accounts;
  }
}
