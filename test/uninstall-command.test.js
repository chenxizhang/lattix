const test = require('node:test');
const assert = require('node:assert/strict');

function createMockDeps(overrides = {}) {
  return {
    autoStartManager: {
      isSupported() { return true; },
      queryState() { return 'installed'; },
      uninstall() {},
    },
    daemonService: {
      readPid() { return null; },
      isRunning() { return false; },
      removePid() {},
    },
    killProcess: () => {},
    exit: (code) => { throw new Error(`exit ${code}`); },
    ...overrides,
  };
}

test('uninstall command removes scheduled task and stops process', () => {
  const { uninstallCommand } = require('../dist/commands/uninstall.js');
  let uninstalled = false;
  let killed = false;

  uninstallCommand(undefined, undefined, createMockDeps({
    autoStartManager: {
      isSupported() { return true; },
      queryState() { return 'installed'; },
      uninstall() { uninstalled = true; },
    },
    daemonService: {
      readPid() { return 12345; },
      isRunning() { return true; },
      removePid() {},
    },
    killProcess: () => { killed = true; },
  }));

  assert.ok(killed, 'should kill running process');
  assert.ok(uninstalled, 'should remove scheduled task');
});

test('uninstall command reports when no task installed', () => {
  const { uninstallCommand } = require('../dist/commands/uninstall.js');

  // Should not throw
  uninstallCommand(undefined, undefined, createMockDeps({
    autoStartManager: {
      isSupported() { return true; },
      queryState() { return 'not-installed'; },
      uninstall() {},
    },
  }));
});

test('uninstall command exits with 1 on failure', () => {
  const { uninstallCommand } = require('../dist/commands/uninstall.js');
  let exitCode = null;

  try {
    uninstallCommand(undefined, undefined, createMockDeps({
      autoStartManager: {
        isSupported() { return true; },
        queryState() { return 'installed'; },
        uninstall() { throw new Error('failed'); },
      },
      exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
    }));
  } catch { /* expected */ }

  assert.equal(exitCode, 1);
});

test('uninstall command exits with 1 on unsupported platforms', () => {
  const { uninstallCommand } = require('../dist/commands/uninstall.js');
  let exitCode = null;

  try {
    uninstallCommand(undefined, undefined, createMockDeps({
      autoStartManager: {
        isSupported() { return false; },
        queryState() { return 'not-installed'; },
        uninstall() {},
      },
      exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
    }));
  } catch { /* expected */ }

  assert.equal(exitCode, 1);
});
