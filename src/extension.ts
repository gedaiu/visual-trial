'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { TrialTestsDataProvider, TrialNode } from './trialTestsDataProvider'
import { Range, languages, Uri } from "vscode";
import { TestLocation } from "./nodes/testCaseTrialNode";
import { ActionCollection } from "./action";
import { ActionsPresenter } from "./actionsPresenter";
import { TestRunner } from "./testRunner";
import { TestResult } from "./tapParser";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const actions = new ActionCollection();
    const actionsPresenter = new ActionsPresenter(actions);
    const testRunner = new TestRunner(vscode.workspace.rootPath, actions);

    const trialTests = new TrialTestsDataProvider(vscode.workspace.rootPath, context, testRunner);
    const diagnosticCollection = languages.createDiagnosticCollection("Trial");

    testRunner.onClearResults(() => {
        diagnosticCollection.clear();
    });

    testRunner.onResult((data) => {
        var result: TestResult = testRunner.getResult(data[0], data[1], data[2]);

        if(result.value != "ok" && result.other && result.other["location"]) {
            var location = result.other["location"];
            var fileName;

            if(path.isAbsolute(location["fileName"])) {
                fileName = location["fileName"];
            } else {
                fileName = path.join(vscode.workspace.rootPath, location["fileName"]);
            }

            diagnosticCollection.set(
                Uri.file(fileName), 
                [ 
                    new vscode.Diagnostic(new Range(location.line, 0, location.line, 0), result.diagnostics, vscode.DiagnosticSeverity.Error) 
                ]);
        }
    });


    vscode.window.registerTreeDataProvider('trialTests', trialTests);

    vscode.commands.registerCommand('goToTestSource', (location: TestLocation) => {

        if(path.isAbsolute(location.fileName)) {
            var fileName = location.fileName;
        } else {
            var fileName = path.join(vscode.workspace.rootPath, location.fileName);
        }

        vscode.workspace.openTextDocument(fileName).then(document => {
            vscode.window.showTextDocument(document, {
                selection: new Range(location.line, 0, location.line, 0)
            });
        });
    });

    vscode.commands.registerCommand('showTrialActions', () => {
        actionsPresenter.show();
    });

    vscode.commands.registerCommand('refreshEntry', node => {
        trialTests.refresh(node);
    });

    vscode.commands.registerCommand('runTest', node => {
        trialTests.runTest(node);
    });

    vscode.commands.registerCommand('runAll', node => {
        trialTests.runAll(node);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}