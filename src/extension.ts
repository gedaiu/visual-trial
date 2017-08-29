'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { TrialTestsDataProvider, TrialNode, TestLocation } from './trialTestsDataProvider'
import { Range } from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const trialTests = new TrialTestsDataProvider(vscode.workspace.rootPath, context);

    vscode.window.registerTreeDataProvider('trialTests', trialTests);

    vscode.commands.registerCommand('goToTestSource', (location: TestLocation) => {
        vscode.workspace.openTextDocument(location.fileName).then(document => {
            vscode.window.showTextDocument(document, {
                selection: new Range(location.line, 0, location.line, 0)
            });
        });
    });

    vscode.commands.registerCommand('refreshEntry', node => {
        trialTests.refresh(node);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}