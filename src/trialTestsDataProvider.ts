import { ExtensionContext, TreeDataProvider, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult, ProcessExecution } from 'vscode';
import * as ChildProcess from "child_process"
import * as path from 'path';
import * as vscode from 'vscode';
import TestRunner from "./testRunner";

export interface TrialNode {
    subpackage: string;

    toTreeItem(): TreeItem;
    getChildren(): TrialNode[] | Thenable<TrialNode[]>;
}

export interface TestLocation {
    fileName: string;
    line: number;
}

export class TestCaseTrialNode implements TrialNode {
    constructor(public data: any, private context: vscode.ExtensionContext, public subpackage: string) {

    }

    toTreeItem(): TreeItem {
        return {
            label: this.data.name,
            collapsibleState: TreeItemCollapsibleState.None,
            command: {
                command: 'goToTestSource',
                arguments: [this.data.location],
                title: 'Go to the test source'
            },
            contextValue: 'trialTestCase',
            iconPath: {
                light: this.context.asAbsolutePath(path.join('resources', 'light', 'unknown.svg')),
                dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'unknown.svg'))
            },
        };
    }

    getChildren(): TrialNode[] | Thenable<TrialNode[]> {
        return [];
    }

}

export class SuiteTrialNode implements TrialNode {
    constructor(public name: string, public childElements: any, private context: vscode.ExtensionContext, public subpackage: string) {

    }

    toTreeItem(): TreeItem {
        return {
            label: this.name,
            iconPath: {
                light: this.context.asAbsolutePath(path.join('resources', 'light', 'suite.svg')),
                dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'suite.svg'))
            },
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'trialSuite'
        };
    }

    getChildren(): TrialNode[] | Thenable<TrialNode[]> {
        if (Array.isArray(this.childElements)) {
            return this.childElements.map(a => new TestCaseTrialNode(a, this.context, this.subpackage));
        }

        return Object.keys(this.childElements).map(a => new SuiteTrialNode(a, this.childElements[a], this.context, this.subpackage));
    }
}

export class TrialRootNode implements TrialNode {
    testFetcher: Thenable<TrialNode[]>;
    subpackage: string = "";

    constructor(private name: string, private context: vscode.ExtensionContext, private testRunner: TestRunner) {
        this.subpackage = this.name.indexOf(":") === 0 ? this.name : "";
    }

    toTreeItem(): TreeItem {
        return {
            label: this.name,
            iconPath: {
                light: this.context.asAbsolutePath(path.join('resources', 'light', 'package.svg')),
                dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'package.svg'))
            },
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'trialRoot'
        };
    }

    getChildren(): TrialNode[] | Thenable<TrialNode[]> {
        if (this.testFetcher) {
            return this.testFetcher;
        }

        this.testFetcher = new Promise((resolve, reject) => {
            this.testRunner.getTests(this.subpackage).then((description: object) => {
                this.testFetcher = null;

                let items: TrialNode[] = Object.keys(description).map(a => new SuiteTrialNode(a, description[a], this.context, this.subpackage));

                resolve(items);
            }, (err) => {
                this.testFetcher = null;
                reject(err);
            });
        });

        return this.testFetcher;
    }
}

export class TrialTestsDataProvider implements TreeDataProvider<TrialNode> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private rootNodesFetcher: Thenable<TrialNode[]>;
    private testRunner: TestRunner;

    constructor(public projectRoot: string, private context: vscode.ExtensionContext) {
        this.testRunner = new TestRunner(projectRoot);
    }

    public getTreeItem(element: TrialNode): TreeItem {
        return element.toTreeItem();
    }

    private rootNodes(): Thenable<TrialNode[]> {
        if (this.rootNodesFetcher) {
            return this.rootNodesFetcher;
        }

        this.rootNodesFetcher = new Promise((resolve, reject) => {
            this.testRunner.subpackages().then((items: string[]) => {
                resolve(items.map(a => new TrialRootNode(a, this.context, this.testRunner)));

                this.rootNodesFetcher = null;
            }, (err) => {
                this.rootNodesFetcher = null;
                reject(err);
            });
        });

        return this.rootNodesFetcher;
    }

    public refresh(node: TrialNode) {
        this._onDidChangeTreeData.fire(node);
    }

    public runTest(node: TestCaseTrialNode) {
        this.testRunner.runTest(node);
    }

    public getChildren(element?: TrialNode): TrialNode[] | Thenable<TrialNode[]> {
        if (!element) {
            return this.rootNodes();
        }

        return element.getChildren();
    }
}