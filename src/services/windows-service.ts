import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface ScheduledTaskDependencies {
  homedir?: string;
  execSyncFn?: (cmd: string, opts?: object) => string;
}

export type TaskState = 'installed' | 'not-installed';

const TASK_NAME = 'Lattix';

export class ScheduledTaskManager {
  private readonly lattixDir: string;
  private readonly deps: ScheduledTaskDependencies;

  constructor(deps: ScheduledTaskDependencies = {}) {
    this.deps = deps;
    const home = deps.homedir ?? os.homedir();
    this.lattixDir = path.join(home, '.lattix');
  }

  getTaskName(): string {
    return TASK_NAME;
  }

  private exec(cmd: string): string {
    const execFn = this.deps.execSyncFn ?? ((c: string, opts?: object) => execSync(c, { encoding: 'utf-8', ...opts }));
    return execFn(cmd);
  }

  queryTaskState(): TaskState {
    try {
      this.exec(`schtasks /query /tn "${TASK_NAME}" /fo LIST`);
      return 'installed';
    } catch {
      return 'not-installed';
    }
  }

  install(): void {
    // Use npx lattix run -d as the command, so it always uses the latest version
    const npxPath = this.findNpx();
    const cmd = `schtasks /create /tn "${TASK_NAME}" /tr "\\"${npxPath}\\" lattix run -d" /sc ONLOGON /rl LIMITED /f`;
    this.exec(cmd);
  }

  uninstall(): void {
    this.exec(`schtasks /delete /tn "${TASK_NAME}" /f`);
  }

  private findNpx(): string {
    // Find the npx executable path
    try {
      const result = this.exec('where npx').trim().split(/\r?\n/);
      // Prefer the .cmd version on Windows
      const cmd = result.find(p => p.endsWith('.cmd')) ?? result[0];
      return cmd.trim();
    } catch {
      return 'npx';
    }
  }
}
