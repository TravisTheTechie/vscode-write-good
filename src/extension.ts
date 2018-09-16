'use strict';

import { workspace, ExtensionContext, TextDocument, languages, Uri,
         Diagnostic, DiagnosticSeverity, Range, Position, DiagnosticCollection } from 'vscode';
import * as WriteGood from 'write-good';

let diagnosticCollection: DiagnosticCollection;
let diagnosticMap: Map<string, Diagnostic[]>;

export function activate(context: ExtensionContext) {

    console.log("Write-Good Linter active...");
    diagnosticCollection = languages.createDiagnosticCollection("Write-Good Lints");
    diagnosticMap = new Map();

    function isWriteGoodLanguage(languageId) {
        let wgLanguages: string = workspace.getConfiguration('write-good').get('languages');
        return (wgLanguages.indexOf(languageId) > -1 || wgLanguages === '*');
    }
    
    context.subscriptions.push(workspace.onDidChangeTextDocument(event => {
        if (isWriteGoodLanguage(event.document.languageId)) {
            doLint(event.document);
        }
    }));

    context.subscriptions.push(workspace.onDidOpenTextDocument(event => {
        if (isWriteGoodLanguage(event.languageId)) {
            doLint(event);
        }
    }));

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

interface Suggestion {
    index: number,
    offset: number,
    reason: string
}

function resetDiagnostics() {
    diagnosticCollection.clear();

    diagnosticMap.forEach((diags, file) => {
        diagnosticCollection.set(Uri.parse(file), diags);
    });
}

function doLint(document: TextDocument) {
    let diagnostics: Diagnostic[] = [];
    let lines = document.getText().split(/\r?\n/g);
    lines.forEach((line, lineCount) => {
        let suggestions : Suggestion[] = WriteGood(line);
        suggestions.forEach((suggestion, si) => {
            let start = new Position(lineCount, suggestion.index);
            let end = new Position(lineCount, suggestion.index + suggestion.offset);
            diagnostics.push(new Diagnostic(new Range(start, end), suggestion.reason, DiagnosticSeverity.Warning));
        });
    });

    diagnosticMap.set(document.uri.toString(), diagnostics);
    resetDiagnostics();
}