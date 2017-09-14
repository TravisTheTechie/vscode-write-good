'use strict';

import { workspace, Disposable, ExtensionContext, TextDocument, languages,
         Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode';
let WriteGood = require('write-good');

export function activate(context: ExtensionContext) {

    console.log("Write-Good Linter active...");

    function isWriteGoodLanguage(languageId) {
        let wgLanguages: string = workspace.getConfiguration('write-good').get('include');
        return (wgLanguages.indexOf(languageId) > -1);
    }
    
    context.subscriptions.push(workspace.onDidChangeTextDocument(event => {
        if (isWriteGoodLanguage(event.document.languageId)) {
            doLint(event.document);
        }
    }));

    context.subscriptions.push(workspace.onDidOpenTextDocument(event => {
        if (isWriteGoodLanguage(event.languageId) {
            doLint(event);
        }
    }));
}

export function deactivate() {
    console.log("Write-Good Linter deactivating...")
}

interface Suggestion {
    index: number,
    offset: number,
    reason: string
}

function doLint(document: TextDocument) {
    let diagnosticCollection = languages.createDiagnosticCollection("Write-Good Lints");
    let diagnostics : Diagnostic[] = [];
    let lines = document.getText().split(/\r?\n/g);
    lines.forEach((line, lineCount) => {
        let suggestions : Suggestion[] = WriteGood(line);
        suggestions.forEach((suggestion, si) => {
            let start = new Position(lineCount, suggestion.index);
            let end = new Position(lineCount, suggestion.index + suggestion.offset);
            diagnostics.push(new Diagnostic(new Range(start, end), suggestion.reason, DiagnosticSeverity.Warning));
        });
    });

    diagnosticCollection.clear();
    diagnosticCollection.set(document.uri, diagnostics);
}