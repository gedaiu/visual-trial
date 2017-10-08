'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { Range, languages, Uri, Disposable } from "vscode";
import { TestLocation } from "./nodes/testCaseTrialNode";
import { ActionsPresenter } from "./actionsPresenter";
import { TestRunner } from "./testRunner";
import { TestDiagnostics } from "./testDiagnostics";
import { TestResult, TestState } from "./testResult";
import Trial from "./trial";
import { TrialTestsDataProvider } from './providers/trialTestsDataProvider';
import TrialCodeLenseProvider from './providers/trialCodeLenseProvider';
import ActionCollection from './actions/actionCollection';

let codeLenseDisposer: Disposable;
function initExtension(context: vscode.ExtensionContext, trial: Trial) {
    const actions = new ActionCollection();
    const actionsPresenter = new ActionsPresenter(actions);
    const testRunner = new TestRunner(trial, actions);
    const testDiagnostics = new TestDiagnostics();

    const trialTests = new TrialTestsDataProvider(vscode.workspace.rootPath, context, testRunner);
    const codeLenseProvider = new TrialCodeLenseProvider(testRunner.results);

    testRunner.onClearResults(() => {
        testDiagnostics.clear();
    });

    testRunner.onResult((data) => {
        var result: TestResult = testRunner.results.getResult(data[0], data[1], data[2]);

        if(result.status == TestState.failure) {
            testDiagnostics.add(result);
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

    vscode.commands.registerCommand('runTest', (subpackage: string, suite: string, name: string) => {
        var node;

        if(typeof subpackage == "string" && suite && name) {
            node = trialTests.collection.getTest(subpackage, suite, name);
        } else {
            node = subpackage;
        }

        testRunner.runTest(node);
    });

    vscode.commands.registerCommand('cancelTest', (subpackage: string, suite: string, name: string) => {
        let node = trialTests.collection.getTest(subpackage, suite, name);

        testRunner.cancelTest(node);
    });

    vscode.commands.registerCommand('runAll', node => {
        testRunner.runAll(node);
    });

    vscode.workspace.onDidSaveTextDocument(e => {
        testRunner.refreshFile(e.fileName, (err, subpackage, data) => {
            trialTests.collection.getSuiteNodes(subpackage).forEach(node => {
                testRunner.results.updateCache(node.subpackage, data);
                trialTests.refresh(node);
            });
        });
    });

    codeLenseDisposer = vscode.languages.registerCodeLensProvider({ pattern: '**/*.d' }, codeLenseProvider);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    var trial = new Trial(context.extensionPath, vscode.workspace.rootPath);

    trial.waitToBeReady().then(() => {
        initExtension(context, trial);
    }, (error) => {
        vscode.window.showErrorMessage("Trial setup error: " + error);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
    codeLenseDisposer
}