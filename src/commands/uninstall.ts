import { AutoStartManager, createAutoStartManager } from '../services/auto-start';
import { DaemonService } from '../services/daemon';
import { t } from '../services/i18n';

interface UninstallDependencies {
  autoStartManager?: AutoStartManager;
  daemonService?: DaemonService;
  exit?: (code: number) => never;
  killProcess?: (pid: number) => void;
}

export function uninstallCommand(
  _options?: unknown,
  _cmdObj?: unknown,
  dependencies: UninstallDependencies = {}
): void {
  const autoStartManager = dependencies.autoStartManager ?? createAutoStartManager();
  const daemonService = dependencies.daemonService ?? new DaemonService();
  const exit = dependencies.exit ?? ((code: number) => process.exit(code)) as (code: number) => never;
  const killProcess = dependencies.killProcess ?? ((pid: number) => process.kill(pid, 'SIGTERM'));

  if (!autoStartManager.isSupported()) {
    console.error(`❌ ${t('autostart.unsupported', { platform: process.platform })}`);
    return exit(1);
  }

  const taskState = autoStartManager.queryState();

  if (taskState === 'not-installed') {
    console.log(`ℹ️ ${t('uninstall.not_installed')}`);
    return;
  }

  // Stop running instance if any
  const pid = daemonService.readPid();
  if (pid !== null && daemonService.isRunning(pid)) {
    try {
      killProcess(pid);
      console.log(`⏹️ ${t('uninstall.stopped', { pid })}`);
    } catch { /* ignore */ }
    daemonService.removePid();
  }

  try {
    autoStartManager.uninstall();
    console.log(`✅ ${t('uninstall.removed')}`);
    console.log(`   ${t('uninstall.no_auto_start')}`);
  } catch (err) {
    console.error(`❌ ${t('uninstall.failed', { message: (err as Error).message })}`);
    return exit(1);
  }
}
