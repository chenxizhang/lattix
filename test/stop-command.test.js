const test = require('node:test');
const assert = require('node:assert/strict');

test('stop command kills running process and cleans up', async () => {
  const { stopCommand } = require('../dist/commands/stop.js');
  let killedPid = null;
  let exitCode = null;

  stopCommand({
    daemonService: {
      readPid() { return 12345; },
      isRunning() { return true; },
      removePid() {},
    },
    killProcess: (pid) => { killedPid = pid; },
    exit: (code) => { exitCode = code; },
  });

  // Wait for setTimeout in stopCommand
  await new Promise(r => setTimeout(r, 600));

  assert.equal(killedPid, 12345, 'should have killed the process');
  assert.equal(exitCode, 0, 'should exit with 0');
});

test('stop command reports not running when no PID file', () => {
  const { stopCommand } = require('../dist/commands/stop.js');
  let exitCode = null;

  try {
    stopCommand({
      daemonService: {
        readPid() { return null; },
        isRunning() { return false; },
        removePid() {},
      },
      exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
    });
  } catch { /* expected */ }

  assert.equal(exitCode, 0);
});

test('stop command cleans up stale PID file', () => {
  const { stopCommand } = require('../dist/commands/stop.js');
  let pidRemoved = false;
  let exitCode = null;

  try {
    stopCommand({
      daemonService: {
        readPid() { return 99999; },
        isRunning() { return false; },
        removePid() { pidRemoved = true; },
      },
      exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
    });
  } catch { /* expected */ }

  assert.equal(pidRemoved, true, 'should have removed stale PID');
  assert.equal(exitCode, 0);
});

test('stop command handles kill failure', () => {
  const { stopCommand } = require('../dist/commands/stop.js');
  let exitCode = null;

  try {
    stopCommand({
      daemonService: {
        readPid() { return 12345; },
        isRunning() { return true; },
        removePid() {},
      },
      killProcess: () => { throw new Error('permission denied'); },
      exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
    });
  } catch { /* expected */ }

  assert.equal(exitCode, 1, 'should exit with 1 on kill failure');
});
