// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { Diagnostic } from 'vscode';
import * as linter from '../src/linter';

suite("Linter Tests", () => {

	let wgConfig = {};
	let diagonstics: Diagnostic[] = [];

	test("Linter accepts empty text", () => {
		diagonstics = [];
		linter.lintText("", wgConfig, 0, diagonstics);

		assert.strictEqual(diagonstics.length, 0);
	});

	test("Linter accepts null text", () => {
		diagonstics = [];
		linter.lintText(null, wgConfig, 0, diagonstics);

		assert.strictEqual(diagonstics.length, 0);
	});

	test("Expect diagonstics from input text", () => {
		const text = "This is licensed under the MIT open source license.";
		diagonstics = [];
		linter.lintText(text, wgConfig, 0, diagonstics);

		// find 'is licensed'
		assert.strictEqual(diagonstics.length, 1);
		assert.strictEqual(diagonstics[0].range.start.character, 5);
		assert.strictEqual(diagonstics[0].range.end.character, 16);
	});
});