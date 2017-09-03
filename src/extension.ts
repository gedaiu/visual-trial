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
import { TestResult } from "./trialParser";
import { TestDiagnostics } from "./testDiagnostics";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const actions = new ActionCollection();
    const actionsPresenter = new ActionsPresenter(actions);
    const testRunner = new TestRunner(vscode.workspace.rootPath, actions);
    const testDiagnostics = new TestDiagnostics();

    const trialTests = new TrialTestsDataProvider(vscode.workspace.rootPath, context, testRunner);

    testRunner.onClearResults(() => {
        testDiagnostics.clear();
    });

    testRunner.onResult((data) => {
        var result: TestResult = testRunner.getResult(data[0], data[1], data[2]);

        if(result.status != "success") {
            var fileName;

            if(path.isAbsolute(result.file)) {
                fileName = result.file;
            } else {
                fileName = path.join(vscode.workspace.rootPath, result.file);
            }
            
            testDiagnostics.add(fileName, result);
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
                selection: new Range(location.line - 1, 0, location.line - 1, 0)
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