import { t } from './i18n';
import { ScheduledTaskDependencies, ScheduledTaskManager } from './windows-service';
import { LaunchAgentDependencies, LaunchAgentManager } from './macos-auto-start';

export type AutoStartState = 'installed' | 'not-installed';

export interface AutoStartManager {
  isSupported(): boolean;
  queryState(): AutoStartState;
  install(): void;
  uninstall(): void;
  start(): void;
  getName(): string;
}

interface CreateAutoStartManagerOptions {
  platform?: NodeJS.Platform;
  windowsDeps?: ScheduledTaskDependencies;
  macosDeps?: LaunchAgentDependencies;
}

class UnsupportedAutoStartManager implements AutoStartManager {
  private readonly platform: NodeJS.Platform;

  constructor(platform: NodeJS.Platform) {
    this.platform = platform;
  }

  isSupported(): boolean {
    return false;
  }

  queryState(): AutoStartState {
    return 'not-installed';
  }

  install(): void {
    throw new Error(t('autostart.unsupported', { platform: this.platform }));
  }

  uninstall(): void {
    throw new Error(t('autostart.unsupported', { platform: this.platform }));
  }

  start(): void {
    throw new Error(t('autostart.unsupported', { platform: this.platform }));
  }

  getName(): string {
    return this.platform;
  }
}

export function createAutoStartManager(options: CreateAutoStartManagerOptions = {}): AutoStartManager {
  const platform = options.platform ?? process.platform;

  switch (platform) {
    case 'win32':
      return new ScheduledTaskManager(options.windowsDeps);
    case 'darwin':
      return new LaunchAgentManager(options.macosDeps);
    default:
      return new UnsupportedAutoStartManager(platform);
  }
}
