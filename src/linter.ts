import type { Diagnostic as Diagnostic_vscode } from 'vscode';
import type { Diagnostic as Diagnostic_coc } from 'coc.nvim';
type Diagnostic = Diagnostic_vscode | Diagnostic_coc;
let vscode;
try {
    vscode = require('vscode');
} catch (error) {
    vscode = require('coc.nvim');
}
const DiagnosticSeverity = vscode.DiagnosticSeverity;
const Range = vscode.Range;
const Position = vscode.Position;
const Diagnostic = vscode.Diagnostic;
import * as WriteGood from 'write-good';

interface Suggestion {
    index: number,
    offset: number,
    reason: string
}

export function lintText(content: string, wgConfig: object, startingLine: number = 0, diagnostics: Diagnostic[] = []) {
    if (content == null) return;
    const lines = content.split(/\r?\n/g);
    lines.forEach((line, lineCount) => {
        const suggestions : Suggestion[] = WriteGood(line, wgConfig);
        suggestions.forEach((suggestion) => {
            try {
                const start = new Position(lineCount + startingLine, suggestion.index);
                const end = new Position(lineCount + startingLine, suggestion.index + suggestion.offset);
                diagnostics.push(new Diagnostic(new Range(start, end), suggestion.reason, DiagnosticSeverity.Warning));
            } catch (e) {
              const start = Position.create(lineCount + startingLine, suggestion.index);
              const end = Position.create(lineCount + startingLine, suggestion.index + suggestion.offset);
              diagnostics.push(Diagnostic.create(Range.create(start, end), suggestion.reason, DiagnosticSeverity.Warning));
            }
        });
    });
}
