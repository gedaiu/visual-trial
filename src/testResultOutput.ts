import { OutputChannel }  from "vscode";
import * as vscode from "vscode";
import { TestResult } from "./testResult";


export default class TestResultOutput {
    private readonly output: OutputChannel;

    constructor() {
        this.output = vscode.window.createOutputChannel("Trial Test Result");
    }

    show(result: TestResult) {
        this.output.clear();

        if(result.output) {
            this.output.append(result.output);
            this.output.append("\n\n");
        }

        if(result.error && result.error.raw) {
            this.output.append(result.error.raw);
        }

        this.output.show();
    }
}