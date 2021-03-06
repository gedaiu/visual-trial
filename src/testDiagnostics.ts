import { languages, Uri, Range, Diagnostic, DiagnosticSeverity } from "vscode";
import { TestResult } from "./testResult";
import * as path from 'path';
import * as vscode from "vscode";

export class TestDiagnostics {
    private diagnosticCollection = languages.createDiagnosticCollection("Trial");
    private diagnostics: Map<string, Diagnostic[]> = new Map<string, Diagnostic[]>();

    clear() {
        this.diagnosticCollection.clear();
        this.diagnostics = new Map<string, Diagnostic[]>();
    }

    add(result: TestResult) {
        var fileName;

        if(path.isAbsolute(result.error.location.fileName)) {
            fileName = result.error.location.fileName;
        } else {
            var root = vscode.workspace.rootPath || "";
            fileName = path.join(root, result.error.location.fileName);
        }

        if(!this.diagnostics.has(fileName)) {
            this.diagnostics.set(fileName, []);
        }

        var fileDiagnostics = this.diagnostics.get(fileName)
            .filter(a => a.range.start.line != result.error.location.line - 1);

        let diagnostic = new Diagnostic(new Range(result.error.location.line - 1, 0, result.error.location.line, 0), result.error.message, DiagnosticSeverity.Error);
        diagnostic.source = "trial";

        fileDiagnostics.push(diagnostic);

        this.diagnostics.set(fileName, fileDiagnostics);

        this.diagnosticCollection.set(Uri.file(fileName), this.diagnostics.get(fileName));
    }

    problems(fileName: string): number {
        return this.diagnostics.get(fileName).length;
    }
}