import { TreeItem, TreeItemCollapsibleState, ExtensionContext } from "vscode";
import { TrialNode } from "../trialTestsDataProvider";
import { TestRunner } from "../testRunner";
import { TrialCollection } from "./trialCollection";

export class TrialRootNode implements TrialNode {
    testFetcher: Thenable<TrialNode[]>;
    subpackage: string = "";

    constructor(private name: string, private context: ExtensionContext, private testRunner: TestRunner, private collection: TrialCollection) {
        this.subpackage = this.name.indexOf(":") === 0 ? this.name : "";
    }

    toTreeItem(): TreeItem {
        var icon = this.collection.icon('package.svg');

        return {
            label: this.name,
            iconPath: icon,
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
                    this.collection.getSuite(this.subpackage, a)
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

