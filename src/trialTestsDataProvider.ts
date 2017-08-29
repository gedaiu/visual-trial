import { ExtensionContext, TreeDataProvider, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult, ProcessExecution } from 'vscode';
import * as ChildProcess from "child_process"
import * as path from 'path';
import * as vscode from 'vscode';

export interface TrialNode {
    toTreeItem(): TreeItem;
    getChildren(): TrialNode[] | Thenable<TrialNode[]>;
}

export interface TestLocation {
    fileName: string;
    line: number;
}

export class TestCaseTrialNode implements TrialNode {
    constructor(public data: any, private context: vscode.ExtensionContext) {

    }

    toTreeItem(): TreeItem {
        return {
            label: this.data.name,
            collapsibleState: TreeItemCollapsibleState.None,
            command: {
                command: 'goToTestSource',
                arguments: [ this.data.location ],
                title: 'Go to the test source'
            },
            contextValue: 'trialTestCase'
       };
    }

    getChildren(): TrialNode[] | Thenable<TrialNode[]> {
        return [];
    }

}

export class SuiteTrialNode implements TrialNode {

    constructor(public name: string, public childElements: any, private context: vscode.ExtensionContext) {

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
            return this.childElements.map(a => new TestCaseTrialNode(a, this.context));
        }

        return Object.keys(this.childElements).map(a => new SuiteTrialNode(a, this.childElements[a], this.context));
    }
}

export class TrialRootNode implements TrialNode {
    testFetcher: Thenable<TrialNode[]>;

    constructor(public name: string, public projectRoot: string, private context: vscode.ExtensionContext) {
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
            let options = ["describe"];

            if (this.name.indexOf(":") === 0) {
                options.push(this.name);
            }

            const trialProcess = ChildProcess.spawn("trial", options, { cwd: this.projectRoot });
            let rawDescription = "";

            trialProcess.stdout.on('data', (data) => {
                rawDescription += data;
            });

            trialProcess.on('close', (code) => {
                this.testFetcher = null;

                if (code !== 0) {
                    reject(`trial process exited with code ${code}`);
                }

                let description: any;

                try {
                    description = JSON.parse(rawDescription);
                } catch (e) {
                    reject(e);
                    return;
                }

                let items: TrialNode[] = Object.keys(description).map(a => new SuiteTrialNode(a, description[a], this.context));

                resolve(items);
            });
        });


        return this.testFetcher;
    }
}

export class TrialTestsDataProvider implements TreeDataProvider<TrialNode> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private rootNodesFetcher: Thenable<TrialNode[]>;

    constructor(public projectRoot: string, private context: vscode.ExtensionContext) {
    }

    public getTreeItem(element: TrialNode): TreeItem {
        return element.toTreeItem();
    }

    private rootNodes(): Thenable<TrialNode[]> {
        if (this.rootNodesFetcher) {
            return this.rootNodesFetcher;
        }

        this.rootNodesFetcher = new Promise((resolve, reject) => {
            const trialProcess = ChildProcess.spawn("trial", ["subpackages"], { cwd: this.projectRoot });
            let rawSubpackages = "";

            trialProcess.stdout.on('data', (data) => {
                rawSubpackages += data;
            });

            trialProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(`trial process exited with code ${code}`);
                }

                let items = rawSubpackages.trim().split("\n").map(a => new TrialRootNode(a, this.projectRoot, this.context));

                resolve(items);

                this.rootNodesFetcher = null;
            });
        });

        return this.rootNodesFetcher;
    }

    public refresh(node: TrialNode) {
        this._onDidChangeTreeData.fire(node);
    }

    public getChildren(element?: TrialNode): TrialNode[] | Thenable<TrialNode[]> {
        if (!element) {
            return this.rootNodes();
        }

        return element.getChildren();
    }
}