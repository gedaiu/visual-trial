import { languages, Uri, Range, Diagnostic, DiagnosticSeverity } from "vscode";
import { TestResult } from "./trialParser";

export class TestDiagnostics {
    private diagnosticCollection = languages.createDiagnosticCollection("Trial");
    private diagnostics: Map<string, Diagnostic[]> = new Map<string, Diagnostic[]>();

    clear() {
        this.diagnosticCollection.clear();
        this.diagnostics = new Map<string, Diagnostic[]>();
    }

    add(fileName: string, result: TestResult) {
        if(!this.diagnostics.has(fileName)) {
            this.diagnostics.set(fileName, []);
        }

        this.diagnostics.get(fileName).push(new Diagnostic(new Range(result.line - 1, 0, result.line, 0), result.message, DiagnosticSeverity.Error)); 

        this.diagnosticCollection.set(Uri.file(fileName), this.diagnostics.get(fileName));
    }
}