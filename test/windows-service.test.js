const test = require('node:test');
const assert = require('node:assert/strict');

function createManager(overrides = {}) {
  const { ScheduledTaskManager } = require('../dist/services/windows-service.js');
  const mgr = new ScheduledTaskManager(overrides);
  return { mgr };
}

test('queryTaskState returns "installed" when schtasks succeeds', () => {
  const { mgr } = createManager({
    execSyncFn: () => 'TaskName: Lattix\r\nStatus: Ready\r\n',
  });
  assert.equal(mgr.queryTaskState(), 'installed');
});

test('queryTaskState returns "not-installed" when schtasks fails', () => {
  const { mgr } = createManager({
    execSyncFn: () => { throw new Error('task not found'); },
  });
  assert.equal(mgr.queryTaskState(), 'not-installed');
});

test('install calls schtasks /create', () => {
  const calledCmds = [];
  const { mgr } = createManager({
    execSyncFn: (cmd) => {
      calledCmds.push(cmd);
      if (cmd.startsWith('where')) return 'C:\\Program Files\\nodejs\\npx.cmd\n';
      return '';
    },
  });
  mgr.install();
  const createCmd = calledCmds.find(c => c.includes('schtasks'));
  assert.ok(createCmd, 'should call schtasks');
  assert.ok(createCmd.includes('/create'));
  assert.ok(createCmd.includes('Lattix'));
  assert.ok(createCmd.includes('ONLOGON'));
});

test('uninstall calls schtasks /delete', () => {
  let calledCmd = null;
  const { mgr } = createManager({
    execSyncFn: (cmd) => { calledCmd = cmd; return ''; },
  });
  mgr.uninstall();
  assert.ok(calledCmd.includes('schtasks /delete'));
  assert.ok(calledCmd.includes('Lattix'));
});

test('getTaskName returns "Lattix"', () => {
  const { mgr } = createManager({});
  assert.equal(mgr.getTaskName(), 'Lattix');
});
