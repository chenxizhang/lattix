const test = require('node:test');
const assert = require('node:assert/strict');

function createMockDeps(overrides = {}) {
  return {
    taskManager: {
      queryTaskState() { return 'not-installed'; },
      install() {},
      getTaskName() { return 'Lattix'; },
    },
    daemonService: {
      readPid() { return null; },
      isRunning() { return false; },
    },
    exit: (code) => { throw new Error(`exit ${code}`); },
    runDaemon: () => {},
    ...overrides,
  };
}

test('install command creates scheduled task and starts daemon', () => {
  const { installCommand } = require('../dist/commands/install.js');
  let installed = false;
  let daemonStarted = false;

  installCommand(undefined, undefined, createMockDeps({
    taskManager: {
      ...createMockDeps().taskManager,
      install() { installed = true; },
    },
    runDaemon: () => { daemonStarted = true; },
  }));

  assert.ok(installed, 'should create scheduled task');
  assert.ok(daemonStarted, 'should start daemon');
});

test('install command reports when task already exists', () => {
  const { installCommand } = require('../dist/commands/install.js');

  // Should not throw
  installCommand(undefined, undefined, createMockDeps({
    taskManager: {
      queryTaskState() { return 'installed'; },
      getTaskName() { return 'Lattix'; },
    },
  }));
});

test('install command exits with 1 on failure', () => {
  const { installCommand } = require('../dist/commands/install.js');
  let exitCode = null;

  try {
    installCommand(undefined, undefined, createMockDeps({
      taskManager: {
        ...createMockDeps().taskManager,
        install() { throw new Error('schtasks failed'); },
      },
      exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
    }));
  } catch { /* expected */ }

  assert.equal(exitCode, 1);
});
