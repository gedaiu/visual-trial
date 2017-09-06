import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { TrialNode } from "../trialTestsDataProvider";
import { TestCaseData } from "./testCaseTrialNode";
import { TrialCollection } from "./trialCollection";

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
