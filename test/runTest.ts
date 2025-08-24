import * as path from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    // Use source workspace fixtures, not compiled output path
    const workspacePath = path.resolve(extensionDevelopmentPath, 'test', 'fixtures', 'ws');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath],
      version: undefined,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

main();
