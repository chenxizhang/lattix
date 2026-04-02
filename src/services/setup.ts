import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AgentBrokerConfig, DEFAULT_CONFIG } from '../types';

const AGENTBROKER_DIR = '.agentbroker';
const ONEDRIVE_SUBDIR = 'AgentBroker';
const SYMLINK_TARGETS = ['tasks', 'output'] as const;

export class SetupService {
  private readonly homeDir: string;
  private readonly brokerDir: string;

  constructor() {
    this.homeDir = os.homedir();
    this.brokerDir = path.join(this.homeDir, AGENTBROKER_DIR);
  }

  getBrokerDir(): string {
    return this.brokerDir;
  }

  getTasksDir(): string {
    return path.join(this.brokerDir, 'tasks');
  }

  getOutputDir(): string {
    return path.join(this.brokerDir, 'output');
  }

  getConfigPath(): string {
    return path.join(this.brokerDir, 'config.json');
  }

  getProcessedPath(): string {
    return path.join(this.brokerDir, 'processed.json');
  }

  /**
   * Run full setup: create directories, symlinks, and config.
   * Returns the loaded or created config.
   */
  setup(onedrivePath: string): AgentBrokerConfig {
    // 1. Create ~/.agentbroker if it doesn't exist
    if (!fs.existsSync(this.brokerDir)) {
      fs.mkdirSync(this.brokerDir, { recursive: true });
      console.log(`✓ Created ${this.brokerDir}`);
    }

    // 2. Create OneDrive subdirectories
    const onedriveBase = path.join(onedrivePath, ONEDRIVE_SUBDIR);
    for (const subdir of SYMLINK_TARGETS) {
      const targetDir = path.join(onedriveBase, subdir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`✓ Created OneDrive directory: ${targetDir}`);
      }
    }

    // 3. Create or validate symlinks
    for (const subdir of SYMLINK_TARGETS) {
      const linkPath = path.join(this.brokerDir, subdir);
      const targetPath = path.join(onedriveBase, subdir);
      this.ensureSymlink(linkPath, targetPath);
    }

    // 4. Create or load config
    const config = this.ensureConfig(onedrivePath);

    // 5. Ensure processed.json exists
    if (!fs.existsSync(this.getProcessedPath())) {
      fs.writeFileSync(this.getProcessedPath(), JSON.stringify({ processedIds: [] }, null, 2));
    }

    return config;
  }

  private ensureSymlink(linkPath: string, targetPath: string): void {
    if (fs.existsSync(linkPath)) {
      // Check if it's a symlink/junction pointing to the right place
      try {
        const stats = fs.lstatSync(linkPath);
        if (stats.isSymbolicLink()) {
          const currentTarget = fs.readlinkSync(linkPath);
          if (path.resolve(currentTarget) === path.resolve(targetPath)) {
            console.log(`✓ Symlink valid: ${linkPath} → ${targetPath}`);
            return;
          }
          // Stale symlink — remove and recreate
          console.log(`⟳ Symlink stale, recreating: ${linkPath}`);
          fs.unlinkSync(linkPath);
        } else {
          // It's a real directory, not a symlink — skip
          console.warn(`⚠ ${linkPath} exists as a regular directory, not a symlink. Skipping.`);
          return;
        }
      } catch {
        // If we can't read the symlink, remove and recreate
        try { fs.unlinkSync(linkPath); } catch { /* ignore */ }
      }
    }

    // Create symlink (or junction as fallback on Windows)
    try {
      fs.symlinkSync(targetPath, linkPath, 'junction');
      console.log(`✓ Created junction: ${linkPath} → ${targetPath}`);
    } catch (symlinkErr) {
      try {
        // Fallback: try directory symlink (requires Developer Mode)
        fs.symlinkSync(targetPath, linkPath, 'dir');
        console.log(`✓ Created symlink: ${linkPath} → ${targetPath}`);
      } catch {
        throw new Error(
          `Failed to create symlink or junction at ${linkPath}.\n` +
          'On Windows, try enabling Developer Mode:\n' +
          '  Settings → Update & Security → For developers → Developer Mode\n' +
          `Error: ${(symlinkErr as Error).message}`
        );
      }
    }
  }

  private ensureConfig(onedrivePath: string): AgentBrokerConfig {
    const configPath = this.getConfigPath();

    if (fs.existsSync(configPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AgentBrokerConfig;
        // Update hostname in case machine name changed
        existing.hostname = os.hostname();
        if (existing.onedrivePath !== onedrivePath) {
          console.log(`⟳ OneDrive path changed, updating config`);
          existing.onedrivePath = onedrivePath;
        }
        fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
        console.log(`✓ Config loaded: ${configPath}`);
        return existing;
      } catch {
        console.warn(`⚠ Config file corrupt, recreating`);
      }
    }

    const config: AgentBrokerConfig = {
      onedrivePath,
      hostname: os.hostname(),
      ...DEFAULT_CONFIG,
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ Config created: ${configPath}`);
    return config;
  }
}
