'use strict';

import { workspace, ExtensionContext, TextDocument, languages, Uri,
         Diagnostic, DiagnosticCollection, TextDocumentContentChangeEvent } from 'vscode';
import { isNullOrUndefined } from 'util';
import { lintText } from './linter';

let diagnosticCollection: DiagnosticCollection;
let diagnosticMap: Map<string, Diagnostic[]>;

export function activate(context: ExtensionContext) {

    console.log("Write-Good Linter active...");
    diagnosticCollection = languages.createDiagnosticCollection("Write-Good Lints");
    diagnosticMap = new Map();

    if (context == null) return;

    function isWriteGoodLanguage(languageId: string) {
        let wgLanguages: string = workspace.getConfiguration('write-good').get('languages');
        return (wgLanguages.indexOf(languageId) > -1 || wgLanguages === '*');
    }
    
    // full lint when document is saved
    context.subscriptions.push(workspace.onDidSaveTextDocument(document => {
        if (isWriteGoodLanguage(document.languageId)) {
            doLint(document);
        }
    }));

    // attempt to only lint changes on motification
    context.subscriptions.push(workspace.onDidChangeTextDocument(event => {
        if (isWriteGoodLanguage(event.document.languageId)) {
            // this doesn't work yet, instead, check for a setting?
            // doPartialLint(event.document, event.contentChanges);
            const onlyLintOnSave: Boolean = workspace.getConfiguration('write-good').get('only-lint-on-save');
            if (!onlyLintOnSave) {
                doLint(event.document);
            }
        }
    }));

    // full lint on a new document/opened document
    context.subscriptions.push(workspace.onDidOpenTextDocument(event => {
        if (isWriteGoodLanguage(event.languageId)) {
            doLint(event);
        }
    }));

    // clean up any lints when the document is closed
    context.subscriptions.push(workspace.onDidCloseTextDocument(event => {
        if (diagnosticMap.has(event.uri.toString())) {
            diagnosticMap.delete(event.uri.toString());
        }
        resetDiagnostics();
    }));
}

export function deactivate() {
    console.log("Write-Good Linter deactivating...")
}

function resetDiagnostics() {
    diagnosticCollection.clear();

    diagnosticMap.forEach((diags, file) => {
        diagnosticCollection.set(Uri.parse(file), diags);
    });
}

function getWriteGoodConfig() : object {
    var wgConfig: object = workspace.getConfiguration('write-good').get('write-good-config');
    if (isNullOrUndefined(wgConfig)) {
        wgConfig = {};
    }
    return wgConfig;
}

function doPartialLint(document: TextDocument, changes: TextDocumentContentChangeEvent[]) {
    const wgConfig = getWriteGoodConfig();
    let diagnostics: Diagnostic[] = diagnosticMap.get(document.uri.toString());
    changes.forEach((changeEvent, index) => {
        // remove any overlapping diagnostics
        let toRemove: number[] = [];
        diagnostics.forEach((diagnostic, index) => {
            // if the diagnostic range intersects with the change event, we assume the diagnostic should be removed
            // and will be re-added with the change event.  
            if (diagnostic.range.intersection(changeEvent.range) != undefined) {
                toRemove.push(index);
            }
        });
        toRemove.forEach((i) => diagnostics.splice(i, 1));

        // skip linting if there's content
        if(changeEvent.text.length > 0) {
            const lineOffset = changeEvent.range.start.line;
            lintText(changeEvent.text, wgConfig, lineOffset, diagnostics);
        }
    });
}

function doLint(document: TextDocument) {
    const wgConfig = getWriteGoodConfig();
    let diagnostics: Diagnostic[] = [];
    lintText(document.getText(), wgConfig, 0, diagnostics);

    diagnosticMap.set(document.uri.toString(), diagnostics);
    resetDiagnostics();
}