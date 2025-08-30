import * as vscode from 'vscode';
import * as path from 'node:path';
import { expect } from 'chai';

const EXT_ID = 'travisthetechie.write-good-linter';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForDiagnostics(uri: vscode.Uri, timeoutMs = 3000) {
  const start = Date.now();
  // Poll for diagnostics to appear
  while (Date.now() - start < timeoutMs) {
    const diags = vscode.languages.getDiagnostics(uri);
    if (diags.length > 0) return diags;
    await sleep(50);
  }
  return vscode.languages.getDiagnostics(uri);
}

async function waitForWorkspace(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      return vscode.workspace.workspaceFolders[0];
    }
    await sleep(50);
  }
  throw new Error('Workspace not available for tests');
}

suite('Write Good Linter (behavior)', function () {
  this.timeout(20000);

  suiteSetup(async () => {
    await vscode.extensions.getExtension(EXT_ID)?.activate();
    await waitForWorkspace();
  });

  test('produces diagnostics for bad.md', async () => {
    // Make linting immediate and enabled during edit/open
    await vscode.workspace.getConfiguration('write-good')
      .update('debounce-time-in-ms', 0, vscode.ConfigurationTarget.Workspace);
    await vscode.workspace.getConfiguration('write-good')
      .update('only-lint-on-save', false, vscode.ConfigurationTarget.Workspace);

    const folder = await waitForWorkspace();
    const uri = vscode.Uri.joinPath(folder.uri, 'bad.md');
    let doc = await vscode.workspace.openTextDocument(uri);
    doc = await vscode.languages.setTextDocumentLanguage(doc, 'markdown');
    await vscode.window.showTextDocument(doc);

    const diags = await waitForDiagnostics(uri);
    expect(diags.length).to.be.greaterThan(0);
  });

  test('respects language filter', async () => {
    // Restrict to plaintext so Markdown should not be linted
    await vscode.workspace.getConfiguration('write-good')
      .update('languages', ['plaintext'], vscode.ConfigurationTarget.Workspace);

    const folder = await waitForWorkspace();
    // Create a fresh markdown file so previous diagnostics don't carry over
    const uri = vscode.Uri.joinPath(folder.uri, 'tmp-filter.md');
    await vscode.workspace.fs.writeFile(uri, Buffer.from('Really actually clearly just bad prose.'));

    // Open as markdown and confirm no diagnostics with filter
    let doc = await vscode.workspace.openTextDocument(uri);
    doc = await vscode.languages.setTextDocumentLanguage(doc, 'markdown');
    await vscode.window.showTextDocument(doc);
    await sleep(200);

    const diags = vscode.languages.getDiagnostics(uri);
    expect(diags.length).to.equal(0);

    // Clean up temp file
    await vscode.workspace.fs.delete(uri);

    // Restore default configuration for subsequent tests (markdown + plaintext)
    await vscode.workspace.getConfiguration('write-good')
      .update('languages', ['markdown', 'plaintext'], vscode.ConfigurationTarget.Workspace);
  });

  test('only lints on save when enabled', async () => {
    // Ensure linting does not run on edit, only on save
    await vscode.workspace.getConfiguration('write-good')
      .update('only-lint-on-save', true, vscode.ConfigurationTarget.Workspace);
    await vscode.workspace.getConfiguration('write-good')
      .update('debounce-time-in-ms', 0, vscode.ConfigurationTarget.Workspace);
    await vscode.workspace.getConfiguration('write-good')
      .update('languages', '*', vscode.ConfigurationTarget.Workspace);
    await sleep(200);

    const folder = await waitForWorkspace();
    const uri = vscode.Uri.joinPath(folder.uri, 'tmp-save.md');
    await vscode.workspace.fs.writeFile(uri, Buffer.from('This text is fine.'));

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);

    // Initial open should have no diagnostics
    let diags = vscode.languages.getDiagnostics(uri);
    expect(diags.length).to.equal(0);

    // Insert problematic text but do not save
    await editor.edit(edit => {
      edit.insert(new vscode.Position(doc.lineCount, 0), '\nSo this is very actually really just a test.');
    });

    // Wait a bit to verify no diagnostics were produced by edit
    await sleep(400);
    diags = vscode.languages.getDiagnostics(uri);
    expect(diags.length).to.equal(0);

    // Save and expect diagnostics to appear
    await doc.save();
    diags = await waitForDiagnostics(uri);
    expect(diags.length).to.be.greaterThan(0);

    // Clean up and restore default
    await vscode.workspace.fs.delete(uri);
    await vscode.workspace.getConfiguration('write-good')
      .update('only-lint-on-save', false, vscode.ConfigurationTarget.Workspace);
  });

  test('debounces linting on edit', async () => {
    // Enable edit-time linting but set a high debounce
    await vscode.workspace.getConfiguration('write-good')
      .update('only-lint-on-save', false, vscode.ConfigurationTarget.Workspace);
    await vscode.workspace.getConfiguration('write-good')
      .update('debounce-time-in-ms', 500, vscode.ConfigurationTarget.Workspace);
    await vscode.workspace.getConfiguration('write-good')
      .update('languages', '*', vscode.ConfigurationTarget.Workspace);

    const folder = await waitForWorkspace();
    const uri = vscode.Uri.joinPath(folder.uri, 'tmp-debounce.md');
    await vscode.workspace.fs.writeFile(uri, Buffer.from('This text is fine.'));
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);

    // Baseline: no diagnostics
    let diags = vscode.languages.getDiagnostics(uri);
    expect(diags.length).to.equal(0);

    // Introduce problematic text and force baseline via save (ensures initial lint)
    await editor.edit(edit => {
      edit.insert(new vscode.Position(doc.lineCount, 0), '\nSo this is very actually really just a test.');
    });
    await doc.save();
    diags = await waitForDiagnostics(uri, 3000);
    const baseline = diags.length;
    expect(baseline).to.be.greaterThan(0);

    // Make a second edit that would normally add more issues, still within debounce window
    await editor.edit(edit => {
      edit.insert(new vscode.Position(doc.lineCount, 0), '\nObviously clearly very really.');
    });
    await sleep(100);
    // Expect diagnostics unchanged (no re-lint during debounce interval)
    diags = vscode.languages.getDiagnostics(uri);
    expect(diags.length).to.equal(baseline);

    // After debounce window, trigger another tiny change to force a re-lint
    await sleep(600);
    await editor.edit(edit => {
      edit.insert(new vscode.Position(doc.lineCount, 0), '\n');
    });
    diags = await waitForDiagnostics(uri, 2000);
    expect(diags.length).to.be.greaterThan(baseline);

    // Clean up and restore fast tests
    await vscode.workspace.fs.delete(uri);
    await vscode.workspace.getConfiguration('write-good')
      .update('debounce-time-in-ms', 0, vscode.ConfigurationTarget.Workspace);
  });
});
