import { EventEmitter, CodeLensProvider, Event, TextDocument, CancellationToken, CodeLens, Range, Position, Command } from "vscode";
import ResultManager from "../resultManager";
import { TestResult } from "../testResult";

export default class TrialCodeLenseProvider implements CodeLensProvider {
    private _onDidChangeCodeLenses: EventEmitter<void> = new EventEmitter<void>();
    readonly onDidChangeCodeLenses: Event<void> = this._onDidChangeCodeLenses.event;

    constructor(private results: ResultManager) {
        results.onResult(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    provideCodeLenses(document: TextDocument, token: CancellationToken): CodeLens[] | Thenable<CodeLens[]> {
        if(document.isDirty) {
            return [];
        }

        var results: Map<string, TestResult[]> = this.results.getRestultsByFile(document.fileName);

        var lenses: CodeLens[] = [];

        results.forEach((results, subpackageName) => {
            results.forEach((result) => {
                let start = new Position(result.location.line - 1, 0);
                let end = new Position(result.location.line, 0);

                let title = "Run the test" + (subpackageName == "" ? "" : (" (" + subpackageName + ")"));

                let lense = new CodeLens(new Range(start, end), {
                    title: title,
                    command: "runTest",
                    arguments: [ subpackageName, result.suite, result.test ]
                });

                lenses.push(lense);
            });
        });

        return lenses;
    }
/*
    resolveCodeLens?(codeLens: CodeLens, token: CancellationToken): CodeLens | Thenable<CodeLens> {
        //throw new Error("Method not implemented.");

        return codeLens;
    }*/
}