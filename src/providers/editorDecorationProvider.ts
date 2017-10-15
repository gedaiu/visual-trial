import * as vscode from 'vscode';
import { TextDocument, TextEditor, TextEditorDecorationType, Range, Position } from 'vscode';
import * as path from 'path';
import ResultManager from '../resultManager';
import { TestResult, TestState } from '../testResult';

export default class EditorDecorationProvider {
    private successDecoration: TextEditorDecorationType;
    private failureDecoration: TextEditorDecorationType;
    private waitDecoration: TextEditorDecorationType;
    private runDecoration: TextEditorDecorationType;
    private pendingDecoration: TextEditorDecorationType;
    private errorDecoration: TextEditorDecorationType;

    constructor(context: vscode.ExtensionContext, private results: ResultManager) {
        this.successDecoration = this.getDecorationIcon(context, "ok.svg");
        this.failureDecoration = this.getDecorationIcon(context, "not_ok.svg");
        this.pendingDecoration = this.getDecorationIcon(context, "pending.svg");
        this.waitDecoration = this.getDecorationIcon(context, "wait.gif");
        this.runDecoration = this.getDecorationIcon(context, "run.gif");
        this.errorDecoration = this.getDecorationIcon(context, "error.svg");
    }

    private getDecorationIcon(context: vscode.ExtensionContext, fileName: string) {
        return vscode.window.createTextEditorDecorationType({
            light: {
                gutterIconPath: context.asAbsolutePath(path.join('resources', 'light', fileName)),
                gutterIconSize: "10px"
            },
            dark: {
                gutterIconPath: context.asAbsolutePath(path.join('resources', 'dark', fileName)),
                gutterIconSize: "10px"
            },
        });
    }

    updateAll() {
        vscode.window.visibleTextEditors.forEach((editor) => {
            this.update(editor);
        });
    }

    update(textEditor: TextEditor) {
        var fileResults: Map<string, TestResult[]> = this.results.getRestultsByFile(textEditor.document.fileName);
        var successLocations = [];
        var failureLocations = [];
        var waitLocations = [];
        var pendingLocations = [];
        var runLocations = [];
        var errorLocations = [];

        fileResults.forEach((subpackageResults: TestResult[], subpackageName) => {
            subpackageResults.forEach((result: TestResult) => {
                let location = new Position(result.location.line - 1, 0);

                if(result.status == TestState.success) {
                    successLocations.push(new Range(location, location));
                }

                if(result.status == TestState.failure) {
                    failureLocations.push(new Range(location, location));
                }

                if(result.status == TestState.wait) {
                    waitLocations.push(new Range(location, location));
                }

                if(result.status == TestState.pending) {
                    pendingLocations.push(new Range(location, location));
                }

                if(result.status == TestState.run) {
                    runLocations.push(new Range(location, location));
                }

                if(result.status == TestState.error || result.status == TestState.cancel) {
                    errorLocations.push(new Range(location, location));
                }
            });
        });

        textEditor.setDecorations(this.successDecoration, successLocations);
        textEditor.setDecorations(this.failureDecoration, failureLocations);
        textEditor.setDecorations(this.waitDecoration, waitLocations);
        textEditor.setDecorations(this.pendingDecoration, pendingLocations);
        textEditor.setDecorations(this.runDecoration, runLocations);
        textEditor.setDecorations(this.errorDecoration, errorLocations);
    }
}