import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { TrialNode } from "../trialTestsDataProvider";
import { TestCaseData } from "./testCaseTrialNode";
import { TrialCollection } from "./trialCollection";

export class SuiteTrialNode implements TrialNode {
    constructor(public subpackage: string,
                public name: string,
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
        return this.collection.getSuiteChilds(this.subpackage, this.name);
    }
}
