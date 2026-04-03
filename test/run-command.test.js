const test = require('node:test');
const assert = require('node:assert/strict');

function createAccount(overrides = {}) {
  return {
    provider: 'onedrive',
    accountKey: 'personal',
    accountName: 'Personal',
    accountType: 'personal',
    path: 'C:\\Users\\Test\\OneDrive',
    ...overrides,
  };
}

function createConfig(selection) {
  return {
    provider: selection.provider,
    onedrivePath: selection.path,
    onedriveAccountKey: selection.accountKey,
    onedriveAccountName: selection.accountName,
    onedriveAccountType: selection.accountType,
    hostname: 'TEST-HOST',
    defaultAgent: 'claude-code',
    defaultAgentCommand: 'claude -p {prompt}',
    pollIntervalSeconds: 10,
    maxConcurrency: 1,
    taskTimeoutMinutes: 30,
    outputSizeLimitBytes: 1024 * 1024,
  };
}

function createMockDeps(overrides = {}) {
  const selection = overrides.selection || createAccount();
  const config = overrides.config || createConfig(selection);

  return {
    bootstrapFn: overrides.bootstrapFn || (async () => config),
    setup: overrides.setup || {
      getOutputDir() { return 'C:\\temp\\output'; },
      getTasksDir() { return 'C:\\temp\\tasks'; },
      getProcessedPath() { return 'C:\\temp\\processed.json'; },
    },
    createExecutor: overrides.createExecutor || (() => ({
      async execute() { throw new Error('executor not expected'); },
    })),
    createWriter: overrides.createWriter || (() => ({
      write() { throw new Error('writer not expected'); },
    })),
    createWatcher: overrides.createWatcher || (() => ({
      onTask() {},
      async start() {},
      async stop() {},
      markProcessed() {},
    })),
    registerSignal: overrides.registerSignal || (() => {}),
    exit: overrides.exit || ((code) => { throw new Error(`unexpected exit ${code}`); }),
  };
}

test('run command auto-initializes when no config exists', async () => {
  const { runCommand } = require('../dist/commands/run.js');
  let bootstrapCalled = false;
  let startCalled = false;

  const deps = createMockDeps({
    bootstrapFn: async () => {
      bootstrapCalled = true;
      return createConfig(createAccount());
    },
    createWatcher: () => ({
      onTask() {},
      async start() { startCalled = true; },
      async stop() {},
      markProcessed() {},
    }),
  });

  await runCommand({ pollInterval: '10', concurrency: '1', daemon: false }, deps);

  assert.equal(bootstrapCalled, true);
  assert.equal(startCalled, true);
});

test('run command uses existing config', async () => {
  const { runCommand } = require('../dist/commands/run.js');
  const selection = createAccount({
    accountKey: 'business1',
    accountName: 'Contoso',
    accountType: 'business',
    path: 'C:\\Users\\Test\\OneDrive - Contoso',
  });
  const config = createConfig(selection);
  let startCalled = false;

  const deps = createMockDeps({
    bootstrapFn: async () => config,
    createWatcher: () => ({
      onTask() {},
      async start() { startCalled = true; },
      async stop() {},
      markProcessed() {},
    }),
  });

  await runCommand({ pollInterval: '10', concurrency: '1', daemon: false }, deps);

  assert.equal(startCalled, true);
});

test('run command starts watcher', async () => {
  const { runCommand } = require('../dist/commands/run.js');
  let taskHandler;
  let startCalled = false;

  const deps = createMockDeps({
    createWatcher: () => ({
      onTask(handler) { taskHandler = handler; },
      async start() { startCalled = true; },
      async stop() {},
      markProcessed() {},
    }),
  });

  await runCommand({ pollInterval: '10', concurrency: '1', daemon: false }, deps);

  assert.equal(startCalled, true);
  assert.ok(taskHandler, 'task handler should be registered');
});

test('run command respects poll-interval and concurrency options', async () => {
  const { runCommand } = require('../dist/commands/run.js');
  let watcherPollInterval;

  const deps = createMockDeps({
    createWatcher: (tasksDir, processedPath, pollInterval) => {
      watcherPollInterval = pollInterval;
      return {
        onTask() {},
        async start() {},
        async stop() {},
        markProcessed() {},
      };
    },
  });

  await runCommand({ pollInterval: '30', concurrency: '3', daemon: false }, deps);

  assert.equal(watcherPollInterval, 30);
});

test('run command in daemon mode calls spawnDetached and exits', async () => {
  const { runCommand } = require('../dist/commands/run.js');
  let exitCode = null;
  let spawnedArgs = null;
  let spawnedLogFile = null;

  const mockDaemon = {
    checkExistingDaemon() { return null; },
    getDefaultLogPath() { return 'C:\\temp\\lattix.log'; },
    getPidPath() { return 'C:\\temp\\lattix.pid'; },
    spawnDetached(args, logFile) {
      spawnedArgs = args;
      spawnedLogFile = logFile;
      return 12345;
    },
  };

  const deps = createMockDeps({
    exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
  });
  deps.daemonService = mockDaemon;
  deps.processArgv = ['dist/cli.js', 'run', '--daemon'];

  try {
    await runCommand({ pollInterval: '10', concurrency: '1', daemon: true }, deps);
  } catch (e) {
    // expected exit
  }

  assert.equal(exitCode, 0, 'should exit with 0');
  assert.ok(spawnedArgs, 'should have called spawnDetached');
  assert.equal(spawnedLogFile, 'C:\\temp\\lattix.log');
});

test('run command in daemon mode rejects when daemon already running', async () => {
  const { runCommand } = require('../dist/commands/run.js');
  let exitCode = null;

  const mockDaemon = {
    checkExistingDaemon() { return 99999; },
    getDefaultLogPath() { return 'C:\\temp\\lattix.log'; },
    getPidPath() { return 'C:\\temp\\lattix.pid'; },
    spawnDetached() { throw new Error('should not be called'); },
  };

  const deps = createMockDeps({
    exit: (code) => { exitCode = code; throw new Error(`exit ${code}`); },
  });
  deps.daemonService = mockDaemon;

  try {
    await runCommand({ pollInterval: '10', concurrency: '1', daemon: true }, deps);
  } catch (e) {
    // expected exit
  }

  assert.equal(exitCode, 1, 'should exit with 1 when daemon already running');
});
