import { EventEmitter, CodeLensProvider, Event, TextDocument, CancellationToken, CodeLens, Range, Position, Command } from "vscode";
import ResultManager from "../resultManager";
import { TestResult, TestState } from "../testResult";

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
                if(result.status == TestState.wait || result.status == TestState.run) {
                    lenses.push(this.createCancelLense(subpackageName, result));
                } else {
                    lenses.push(this.createRunLense(subpackageName, result));
                }

                if(result.status == TestState.success || result.status == TestState.failure || result.status == TestState.error) {
                    lenses.push(this.createStatusLense(subpackageName, result));
                }
            });
        });

        return lenses;
    }

    createStatusLense(subpackageName: string, result: TestResult) {
        let start = new Position(result.location.line - 1, 0);
        let end = new Position(result.location.line, 0);
        let title: string = result.status;

        let lense = new CodeLens(new Range(start, end), {
            title: title,
            command: null
        });

        return lense;
    }

    createRunLense(subpackageName: string, result: TestResult): CodeLens {
        let start = new Position(result.location.line - 1, 0);
        let end = new Position(result.location.line, 0);
        let title = "";

        if(title == "") {
            title = "Run the test";
        }

        if(subpackageName != "") {
            title += " (" + subpackageName + ")";
        }

        let lense = new CodeLens(new Range(start, end), {
            title: title,
            command: "runTest",
            arguments: [ subpackageName, result.suite, result.test ]
        });

        return lense;
    }

    createCancelLense(subpackageName: string, result: TestResult): CodeLens {
        let start = new Position(result.location.line - 1, 0);
        let end = new Position(result.location.line, 0);
        let title = "";

        if(result.status == TestState.wait) {
            title = "Waiting... cancel";
        }

        if(result.status == TestState.run) {
            title = "Running... cancel";
        }

        if(subpackageName != "") {
            title += " (" + subpackageName + ")";
        }

        let lense = new CodeLens(new Range(start, end), {
            title: title,
            command: "cancelTest",
            arguments: [ subpackageName, result.suite, result.test ]
        });

        return lense;
    }
}