import { ExtensionContext, TreeDataProvider, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult, ProcessExecution } from 'vscode';
import * as ChildProcess from "child_process"
import * as path from 'path';
import * as vscode from 'vscode';
import { TestState, TestRunner } from "./testRunner";
import { TestResult } from "./tapParser";
import { TrialCollection } from "./nodes/trialCollection";
import { TestCaseTrialNode } from "./nodes/testCaseTrialNode";
import { TrialRootNode } from "./nodes/trialRootNode";
import { ActionCollection } from "./action";

export interface TrialNode {
    subpackage: string;

    toTreeItem(): TreeItem;
    getChildren(): TrialNode[] | Thenable<TrialNode[]>;
}

export class TrialTestsDataProvider implements TreeDataProvider<TrialNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private collection: TrialCollection;

    constructor(public projectRoot: string, private context: vscode.ExtensionContext, private testRunner: TestRunner) {
        this.collection =  new TrialCollection(context, this.testRunner);

        this.testRunner.onResult((data) => {
            this.refresh(this.collection.getSuite(data[0], data[1]));
        }, this);
    }

    public getTreeItem(element: TrialNode): TreeItem {
        return element.toTreeItem();
    }

    private rootNodes(): Thenable<TrialNode[]> {
        return new Promise((resolve, reject) => {
            this.testRunner.subpackages().then((items: string[]) => {
                resolve(items.map(a => this.collection.getSubpackage(a)));
            }, reject);
        });
    }

    public refresh(node: TrialNode) {
        this._onDidChangeTreeData.fire(node);
    }

    public runTest(node: TestCaseTrialNode) {
        this.testRunner.runTest(node);
        this.refresh(this.collection.getSubpackage(node.subpackage));
    }

    public runAll(node: TrialRootNode) {
        this.testRunner.runAll(node);
        this.refresh(this.collection.getSubpackage(node.subpackage));
    }

    public getChildren(element?: TrialNode): TrialNode[] | Thenable<TrialNode[]> {
        if (!element) {
            return this.rootNodes();
        }

        return element.getChildren();
    }
}