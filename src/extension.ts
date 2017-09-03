'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { TrialTestsDataProvider, TrialNode } from './trialTestsDataProvider'
import { Range } from "vscode";
import { TestLocation } from "./nodes/testCaseTrialNode";
import { ActionCollection } from "./action";
import { ActionsPresenter } from "./actionsPresenter";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const actions = new ActionCollection();
    const actionsPresenter = new ActionsPresenter(actions);
    const trialTests = new TrialTestsDataProvider(vscode.workspace.rootPath, context, actions);

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