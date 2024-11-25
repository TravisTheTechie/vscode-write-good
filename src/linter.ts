import { Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode';
import { default as WriteGood } from 'write-good';

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
            const start = new Position(lineCount + startingLine, suggestion.index);
            const end = new Position(lineCount + startingLine, suggestion.index + suggestion.offset);
            diagnostics.push(new Diagnostic(new Range(start, end), suggestion.reason, DiagnosticSeverity.Warning));
        });
    });
}
