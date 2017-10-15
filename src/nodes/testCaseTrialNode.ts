import { TrialNodeCollection } from "./trialNodeCollection";
import { Uri, TreeItem, TreeItemCollapsibleState } from "vscode";
import { TestState } from "../testResult";
import { TrialNode } from "../providers/trialTestsDataProvider";

export interface TestLocation {
    fileName?: string;
    line?: number;
}

export interface TestCaseData {
    suiteName: string;
    name: string;
}

export class TestCaseTrialNode implements TrialNode {
    constructor(public subpackage: string,
                public suite: string,
                public name: string,
                private collection: TrialNodeCollection) {

    }

    getIcon() : { light: string | Uri; dark: string | Uri } {
        var result = this.collection.getResult(this.subpackage, this.suite, this.name);

        if(!result || result.status == TestState.unknown) {
            return this.collection.icon('unknown.svg');
        }

        if(result.status == TestState.success) {
            return this.collection.icon('ok.svg');
        }

        if(result.status == TestState.pending) {
            return this.collection.icon('pending.svg');
        }

        if(result.status == TestState.run) {
            return this.collection.icon('run.gif');
        }

        if(result.status == TestState.wait) {
            return this.collection.icon('wait.gif');
        }

        if(result.status == TestState.failure) {
            return this.collection.icon('not_ok.svg');
        }

        if(result.status == TestState.error || result.status == TestState.cancel) {
            return this.collection.icon('error.svg');
        }

        return this.collection.icon('unknown.svg');
    }

    toTreeItem(): TreeItem {
        const result = this.collection.getResult(this.subpackage, this.suite, this.name);

        return {
            label: this.name,
            collapsibleState: TreeItemCollapsibleState.None,
            command: {
                command: 'goToTestSource',
                arguments: [ result.location ],
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
