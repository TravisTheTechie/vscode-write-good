import * as Mocha from 'mocha';
import { globSync } from 'glob';
import * as path from 'node:path';

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 20000, reporter: 'spec' });
  const testsRoot = __dirname;

  return new Promise((resolve, reject) => {
    try {
      const files = globSync('**/*.test.js', { cwd: testsRoot });
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
      const runner = mocha.run(failures => {
        if (failures > 0) {
          reject(new Error(`${failures} test(s) failed.`));
        } else {
          resolve();
        }
      });
      runner.on('fail', (test, err) => {
        // eslint-disable-next-line no-console
        console.error(`Test failed: ${test.fullTitle()}`);
        // eslint-disable-next-line no-console
        console.error(err && (err.stack || err.message || err));
      });
    } catch (e) {
      reject(e);
    }
  });
}
