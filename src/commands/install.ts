import { ScheduledTaskManager } from '../services/windows-service';
import { DaemonService } from '../services/daemon';

interface InstallDependencies {
  taskManager?: ScheduledTaskManager;
  daemonService?: DaemonService;
  exit?: (code: number) => never;
  runDaemon?: () => void;
}

export function installCommand(
  _options?: unknown,
  _cmdObj?: unknown,
  dependencies: InstallDependencies = {}
): void {
  const taskManager = dependencies.taskManager ?? new ScheduledTaskManager();
  const daemonService = dependencies.daemonService ?? new DaemonService();
  const exit = dependencies.exit ?? ((code: number) => process.exit(code)) as (code: number) => never;

  const taskState = taskManager.queryTaskState();

  if (taskState === 'installed') {
    console.log('ℹ️ Lattix scheduled task is already installed.');
    console.log(`   Task name: ${taskManager.getTaskName()}`);

    const pid = daemonService.readPid();
    if (pid !== null && daemonService.isRunning(pid)) {
      console.log(`   Status: running (PID ${pid})`);
    } else {
      console.log('   Status: not running');
      console.log('   Run `lattix run` to start, or it will auto-start on next login.');
    }
    return;
  }

  try {
    taskManager.install();
    console.log('✅ Lattix scheduled task installed');
    console.log(`   Task name: ${taskManager.getTaskName()}`);
    console.log('   Lattix will auto-start on login via `npx lattix run -d`');
  } catch (err) {
    console.error(`❌ Failed to install scheduled task: ${(err as Error).message}`);
    return exit(1);
  }

  // Start daemon immediately
  console.log('🚀 Starting Lattix now...');
  const runDaemon = dependencies.runDaemon ?? (() => {
    const { execSync } = require('child_process');
    try {
      execSync('npx lattix run -d', { stdio: 'inherit' });
    } catch { /* daemon spawns and parent exits, which looks like an error */ }
  });
  runDaemon();
}
