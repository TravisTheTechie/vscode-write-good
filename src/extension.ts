import type {
    ExtensionContext as ExtensionContext_vscode,
    TextDocument as TextDocument_vscode,
    Diagnostic as Diagnostic_vscode,
    DiagnosticCollection as DiagnosticCollection_vscode,
} from 'vscode';
import type {
    ExtensionContext as ExtensionContext_coc,
    TextDocument as TextDocument_coc,
    Diagnostic as Diagnostic_coc,
    DiagnosticCollection as DiagnosticCollection_coc,
} from 'coc.nvim';
type ExtensionContext = ExtensionContext_vscode | ExtensionContext_coc;
type TextDocument = TextDocument_vscode | TextDocument_coc;
type Diagnostic = Diagnostic_vscode | Diagnostic_coc;
type DiagnosticCollection = DiagnosticCollection_vscode | DiagnosticCollection_coc;
let vscode;
try {
    vscode = require('vscode');  // eslint-disable-line
} catch (error) {
    vscode = require('coc.nvim');  // eslint-disable-line
}
const workspace = vscode.workspace;
const languages = vscode.languages;
const Uri = vscode.Uri;


import { lintText } from './linter';

let diagnosticCollection: DiagnosticCollection;
let diagnosticMap: Map<string, Diagnostic[]>;
let lastLint: Map<string, number>;

export function activate(context: ExtensionContext) {

    console.log("Write-Good Linter active...");
    diagnosticCollection = languages.createDiagnosticCollection("Write-Good Lints");
    diagnosticMap = new Map();
    lastLint = new Map();

    if (context == null) return;

    function isWriteGoodLanguage(languageId: string) {
        const wgLanguages: string = workspace.getConfiguration('write-good').get('languages');
        return (wgLanguages.indexOf(languageId) > -1 || wgLanguages === '*');
    }
    
    // full lint when document is saved
    context.subscriptions.push(workspace.onDidSaveTextDocument(document => {
        if (isWriteGoodLanguage(document.languageId)) {
            doLint(document);
        }
    }));

    function didOpenTextDocument(document: TextDocument) {
        if (isWriteGoodLanguage(document.languageId)) {
            doLint(document);
        }
    }

    context.subscriptions.push(workspace.onDidOpenTextDocument(didOpenTextDocument));
    workspace.documents.map((doc) => {
        didOpenTextDocument(doc.textDocument);
    });

    // attempt to only lint changes on motification
    context.subscriptions.push(workspace.onDidChangeTextDocument(event => {
        try {
            if (!isWriteGoodLanguage(event.document.languageId)) {
                // language is unsupported. 
                return;
            }
        } catch (error) {
            return;
        }

        const onlyLintOnSave: boolean = workspace.getConfiguration('write-good').get('only-lint-on-save');
        if (onlyLintOnSave) {
            // not a save event, so don't bother linting
            return;
        }

        // debounce linting on editing
        const debounceMs: number = workspace.getConfiguration('write-good').get('debounce-time-in-ms');
        const lastLintMs: number = lastLint.get(event.document.uri.toString()) || 0;
        const nowMs = (new Date()).getTime();
        if (lastLintMs + debounceMs < nowMs) {
            // debounce time is less than now, let's do this
            console.log("LINTING!!!!");
            doLint(event.document);
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
    console.log("Write-Good Linter deactivating...");
}

function resetDiagnostics() {
    diagnosticCollection.clear();

    diagnosticMap.forEach((diags, file) => {
        try {
            // @ts-expect-error: for vscode
            diagnosticCollection.set(Uri.parse(file), diags);
        } catch (e) {
            // @ts-expect-error: for coc.nvim
            diagnosticCollection.set(Uri.parse(file).path, diags);
        }
    });
}

function getWriteGoodConfig() : object {
    let wgConfig: object = workspace.getConfiguration('write-good').get('write-good-config');
    if (wgConfig === undefined || wgConfig === null) {
        wgConfig = {};
    }
    return wgConfig;
}

function doLint(document: TextDocument) {
    const wgConfig = getWriteGoodConfig();
    const diagnostics: Diagnostic[] = [];
    lintText(document.getText(), wgConfig, 0, diagnostics);

    diagnosticMap.set(document.uri.toString(), diagnostics);
    lastLint.set(document.uri.toString(), (new Date()).getTime());
    resetDiagnostics();
}
