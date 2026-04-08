const test = require('node:test');
const assert = require('node:assert/strict');

function createDetector({
  platform = 'win32',
  homeDir = 'C:\\Users\\Test',
  registryOutput = '',
  existsPaths = [],
  homeEntries = [],
  extraEntries = {},
} = {}) {
  const existing = new Set(existsPaths);

  const { OneDriveDetector } = require('../dist/services/onedrive-detector.js');
  return new OneDriveDetector({
    platform,
    homedir: () => homeDir,
    execSyncImpl: () => registryOutput,
    existsSync: (filePath) => existing.has(filePath),
    readdirSyncImpl: (dirPath) => {
      if (dirPath === homeDir) {
        return homeEntries;
      }

      if (Object.prototype.hasOwnProperty.call(extraEntries, dirPath)) {
        return extraEntries[dirPath];
      }

      return [];
    },
    statSyncImpl: () => ({
      isDirectory: () => true,
    }),
  });
}

test('OneDriveDetector finds a personal account from the well-known path', () => {
  const detector = createDetector({
    existsPaths: ['C:\\Users\\Test\\OneDrive'],
    homeEntries: ['OneDrive'],
  });

  const accounts = detector.detectAccounts();

  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].accountType, 'personal');
  assert.equal(accounts[0].path, 'C:\\Users\\Test\\OneDrive');
});

test('OneDriveDetector finds a business account from the registry', () => {
  const detector = createDetector({
    registryOutput: [
      'HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\Business1',
      '    UserFolder    REG_SZ    C:\\Users\\Test\\OneDrive - Contoso',
      '',
    ].join('\n'),
    existsPaths: ['C:\\Users\\Test\\OneDrive - Contoso'],
  });

  const accounts = detector.detectAccounts();

  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].accountType, 'business');
  assert.equal(accounts[0].accountKey, 'Business1');
  assert.equal(accounts[0].accountName, 'Contoso');
});

test('OneDriveDetector returns both personal and business accounts when both are available', () => {
  const detector = createDetector({
    registryOutput: [
      'HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\Business1',
      '    UserFolder    REG_SZ    C:\\Users\\Test\\OneDrive - Contoso',
      '',
      'HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\Personal',
      '    UserFolder    REG_SZ    C:\\Users\\Test\\OneDrive',
      '',
    ].join('\n'),
    existsPaths: ['C:\\Users\\Test\\OneDrive - Contoso', 'C:\\Users\\Test\\OneDrive'],
  });

  const accounts = detector.detectAccounts();

  assert.deepEqual(
    accounts.map((account) => account.accountType).sort(),
    ['business', 'personal']
  );
});

test('OneDriveDetector returns no accounts when no supported OneDrive folders exist', () => {
  const detector = createDetector();

  const accounts = detector.detectAccounts();

  assert.deepEqual(accounts, []);
});

test('OneDriveDetector finds a personal account from macOS CloudStorage', () => {
  const homeDir = '/Users/Test';
  const cloudStorageDir = '/Users/Test/Library/CloudStorage';
  const detector = createDetector({
    platform: 'darwin',
    homeDir,
    existsPaths: [`${cloudStorageDir}/OneDrive-Personal`],
    extraEntries: {
      [cloudStorageDir]: ['OneDrive-Personal'],
    },
  });

  const accounts = detector.detectAccounts();

  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].accountType, 'personal');
  assert.equal(accounts[0].accountName, 'Personal');
  assert.equal(accounts[0].path, `${cloudStorageDir}/OneDrive-Personal`);
});

test('OneDriveDetector returns both personal and business accounts on macOS', () => {
  const homeDir = '/Users/Test';
  const cloudStorageDir = '/Users/Test/Library/CloudStorage';
  const detector = createDetector({
    platform: 'darwin',
    homeDir,
    existsPaths: [
      `${cloudStorageDir}/OneDrive-Personal`,
      `${cloudStorageDir}/OneDrive-Contoso`,
    ],
    extraEntries: {
      [cloudStorageDir]: ['OneDrive-Personal', 'OneDrive-Contoso'],
    },
  });

  const accounts = detector.detectAccounts();

  assert.deepEqual(
    accounts.map((account) => account.accountType).sort(),
    ['business', 'personal']
  );
});

test('OneDriveDetector falls back to legacy macOS home-directory paths', () => {
  const detector = createDetector({
    platform: 'darwin',
    homeDir: '/Users/Test',
    existsPaths: ['/Users/Test/OneDrive'],
    homeEntries: ['OneDrive'],
  });

  const accounts = detector.detectAccounts();

  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].accountType, 'personal');
  assert.equal(accounts[0].path, '/Users/Test/OneDrive');
});
