const test = require('node:test');
const assert = require('node:assert/strict');

test('createAutoStartManager returns ScheduledTaskManager on Windows', () => {
  const { createAutoStartManager } = require('../dist/services/auto-start.js');

  const manager = createAutoStartManager({ platform: 'win32' });

  assert.equal(manager.constructor.name, 'ScheduledTaskManager');
  assert.equal(manager.isSupported(), true);
});

test('createAutoStartManager returns LaunchAgentManager on macOS', () => {
  const { createAutoStartManager } = require('../dist/services/auto-start.js');

  const manager = createAutoStartManager({ platform: 'darwin' });

  assert.equal(manager.constructor.name, 'LaunchAgentManager');
  assert.equal(manager.isSupported(), true);
});

test('createAutoStartManager returns unsupported manager on unsupported platforms', () => {
  const { createAutoStartManager } = require('../dist/services/auto-start.js');

  const manager = createAutoStartManager({ platform: 'linux' });

  assert.equal(manager.isSupported(), false);
  assert.equal(manager.queryState(), 'not-installed');
});
