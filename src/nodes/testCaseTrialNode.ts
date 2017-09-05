import { TrialNode } from "../trialTestsDataProvider";
import { TrialCollection } from "./trialCollection";
import { Uri, TreeItem, TreeItemCollapsibleState } from "vscode";
import { TestState } from "../testRunner";

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

        if(result.status == TestState.success) {
            return this.collection.icon('ok.svg');
        }

        if(result.status == TestState.run) {
            return this.collection.icon('run.gif');
        }

        if(result.status == TestState.wait) {
            return this.collection.icon('wait.gif');
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
