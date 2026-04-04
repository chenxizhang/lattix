import { DaemonService } from '../services/daemon';

interface StopDependencies {
  daemonService?: DaemonService;
  exit?: (code: number) => never;
  killProcess?: (pid: number) => void;
}

export function stopCommand(dependencies: StopDependencies = {}): void {
  const daemonService = dependencies.daemonService ?? new DaemonService();
  const exit = dependencies.exit ?? ((code: number) => process.exit(code));
  const killProcess = dependencies.killProcess ?? ((pid: number) => process.kill(pid, 'SIGTERM'));

  const pid = daemonService.readPid();

  if (pid === null) {
    console.log('ℹ️ Lattix is not running (no PID file found)');
    exit(0);
    return undefined as never;
  }

  if (!daemonService.isRunning(pid)) {
    console.log('ℹ️ Lattix is not running (stale PID file cleaned up)');
    daemonService.removePid();
    exit(0);
    return undefined as never;
  }

  try {
    killProcess(pid);
    console.log(`✅ Lattix stopped (PID ${pid})`);
  } catch (err) {
    console.error(`❌ Failed to stop Lattix (PID ${pid}): ${(err as Error).message}`);
    exit(1);
    return undefined as never;
  }

  // Give the process a moment to clean up its own PID file
  setTimeout(() => {
    daemonService.removePid();
    exit(0);
  }, 500);
}
