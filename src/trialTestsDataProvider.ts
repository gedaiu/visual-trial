import { ExtensionContext, TreeDataProvider, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult, ProcessExecution } from 'vscode';
import * as ChildProcess from "child_process"

export class TrialNode {
    constructor(public name: string) {
    }
}

export class TrialTestsDataProvider implements TreeDataProvider<TrialNode> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private rootNodesFetcher: Thenable<TrialNode[]>;

    constructor(public projectRoot: string) {
    }

    public getTreeItem(element: TrialNode): TreeItem {
        var item = {
            label: element.name
        };

        return item;
/*
        return {
            label: element.name,
            collapsibleState: element.isFolder ? TreeItemCollapsibleState.Collapsed : void 0,
            command: element.isFolder ? void 0 : {
                command: 'openFtpResource',
                arguments: [element.resource],
                title: 'Open FTP Resource'
            },
            iconPath: {
                light: element.isFolder ? path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg') : path.join(__filename, '..', '..', '..', 'resources', 'light', 'document.svg'),
                dark: element.isFolder ? path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg') : path.join(__filename, '..', '..', '..', 'resources', 'dark', 'document.svg')
            }
        };*/
    }

    private rootNodes(): Thenable<TrialNode[]> {
        if(this.rootNodesFetcher) {
            return this.rootNodesFetcher;
        }

        this.rootNodesFetcher = new Promise((resolve, reject) => {
            const trialProcess = ChildProcess.spawn("trial", [ "subpackages" ], { cwd: this.projectRoot });
            let rawSubpackages = "";

            trialProcess.stdout.on('data', (data) => {
                rawSubpackages += data;
            });

            trialProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(`trial process exited with code ${code}`);
                }

                let items = rawSubpackages.trim().split("\n").map(a => new TrialNode(a));

                resolve(items);
            });
        });

        return this.rootNodesFetcher;
    }

    public getChildren(element?: TrialNode): TrialNode[] | Thenable<TrialNode[]> {
        if (!element) {
            return this.rootNodes();
        }

        return [];//this.model.getChildren(element);
    }
}