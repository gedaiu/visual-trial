import { ExtensionContext, TreeDataProvider, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult, ProcessExecution } from 'vscode';
import * as ChildProcess from "child_process"
import * as path from 'path';
import * as vscode from 'vscode';
import TestRunner from "./testRunner";
import { TestResult } from "./tapParser";

export interface TrialNode {
    subpackage: string;

    toTreeItem(): TreeItem;
    getChildren(): TrialNode[] | Thenable<TrialNode[]>;
}

export interface TestLocation {
    fileName: string;
    line: number;
}

export interface TestCaseData {
    suiteName: string;
    name: string;
    location: TestLocation;
}

export class TestCaseTrialNode implements TrialNode {
    constructor(public subpackage: string,
                public suite: string,
                public name: string,
                public location: TestLocation, 
                private collection: TrialCollection) {

    }

    getIcon() : { light: string | Uri; dark: string | Uri } {
        var result = this.collection.getResult(this.subpackage, this.suite, this.name);

        if(!result) {
            return this.collection.icon('unknown.svg');
        }

        if(result.value == "ok") {
            return this.collection.icon('ok.svg');
        }

        return this.collection.icon('not_ok.svg');
    }

    toTreeItem(): TreeItem {
        return {
            label: this.name,
            collapsibleState: TreeItemCollapsibleState.None,
            command: {
                command: 'goToTestSource',
                arguments: [ this.location ],
                title: 'Go to the test source'
            },
            contextValue: 'trialTestCase',
            iconPath: this.getIcon()
        };
    }

    getChildren(): TrialNode[] | Thenable<TrialNode[]> {
        return [];
    }

}

export class SuiteTrialNode implements TrialNode {
    constructor(public subpackage: string, 
                public name: string, 
                public childElements: Array<TestCaseData> | object, 
                private collection: TrialCollection) {

    }

    toTreeItem(): TreeItem {
        return {
            label: this.name.split(".").reverse()[0],
            iconPath: this.collection.icon('suite.svg'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'trialSuite'
        };
    }

    getChildren(): TrialNode[] | Thenable<TrialNode[]> {
        if (Array.isArray(this.childElements)) {
            return this.childElements.map(a =>
                this.collection.getTest(this.subpackage, a.suiteName, a.name, a.location)
            );
        }

        const pre = this.name === "" ? "" : this.name + ".";
        return Object.keys(this.childElements).map(a => 
            this.collection.getSuite(this.subpackage, pre + a, this.childElements[a])
        );
    }
}

export class TrialRootNode implements TrialNode {
    testFetcher: Thenable<TrialNode[]>;
    subpackage: string = "";

    constructor(private name: string, private context: vscode.ExtensionContext, private testRunner: TestRunner, private collection: TrialCollection) {
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

                let items: TrialNode[] = Object.keys(description).map(a => 
                    this.collection.getSuite(this.subpackage, a, description[a])
                );

                resolve(items);
            }, (err) => {
                this.testFetcher = null;
                reject(err);
            });
        });

        return this.testFetcher;
    }
}

class TrialCollection {
    private subpackages: Map<string, TrialRootNode> = new Map<string, TrialRootNode>();
    private suites: Map<string, SuiteTrialNode> = new Map<string, SuiteTrialNode>();
    private tests: Map<string, TestCaseTrialNode> = new Map<string, TestCaseTrialNode>();

    constructor(private context: vscode.ExtensionContext, private testRunner: TestRunner) {

    }

    getSubpackage(name: string) {
        if(!this.subpackages[name]) {
            this.subpackages[name] = new TrialRootNode(name, this.context, this.testRunner, this);
        }

        return this.subpackages[name];
    }
    
    getSuite(subpackage: string, suite: string, content: Array<TestCaseTrialNode> | object | null = null) {
        const key = subpackage + "#" + suite;

        if(!this.suites[key]) {
            this.suites[key] = new SuiteTrialNode(subpackage, suite, content, this);
        }

        if(content != null) {
            this.suites[key].childElements = content;
        }

        return this.suites[key];
    }

    getTest(subpackage: string, suite: string, name: string, location: TestLocation | null = null) : TestCaseTrialNode {
        const key = subpackage + "#" + suite + "#" + name;
        
        if(!this.tests[key]) {
            this.tests[key] = new TestCaseTrialNode(subpackage, suite, name, location, this);
        }

        if(location != null) {
            this.tests[key].location = location;
        }

        return this.tests[key];
    }

    getResult(subpackage: string, suite: string, name: string) : TestResult | null {
        return this.testRunner.getResult(subpackage, suite, name);
    }

    icon(name: string) : { light: string | Uri; dark: string | Uri } {
        return {
            light: this.context.asAbsolutePath(path.join('resources', 'light', name)),
            dark: this.context.asAbsolutePath(path.join('resources', 'dark', name))
        };
    }
}

export class TrialTestsDataProvider implements TreeDataProvider<TrialNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private testRunner: TestRunner;
    private collection: TrialCollection;

    constructor(public projectRoot: string, private context: vscode.ExtensionContext) {
        this.testRunner = new TestRunner(projectRoot);
        this.collection =  new TrialCollection(context, this.testRunner);

        this.testRunner.onResult((subpackage: string, suite: string, name: string) => {
            this.refresh(this.collection.getSuite(subpackage, suite));
        });
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
    }

    public runAll(node: TrialRootNode) {
        this.testRunner.runAll(node);
    }

    public getChildren(element?: TrialNode): TrialNode[] | Thenable<TrialNode[]> {
        if (!element) {
            return this.rootNodes();
        }

        return element.getChildren();
    }
}