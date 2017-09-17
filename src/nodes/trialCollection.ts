import { ExtensionContext, Uri } from "vscode";
import { TestRunner } from "../testRunner";
import { TrialRootNode } from "./trialRootNode";
import { TestCaseTrialNode, TestLocation } from "./testCaseTrialNode";
import { SuiteTrialNode } from "./suiteTrialNode";
import { TestResult } from "../testResult";
import * as path from 'path';

export class TrialCollection {
    private subpackages = {};
    private suites = {};
    private tests = {};

    constructor(private context: ExtensionContext, private testRunner: TestRunner) {

    }

    getSubpackage(name: string) {
        if(!this.subpackages[name]) {
            this.subpackages[name] =  new TrialRootNode(name, this.context, this.testRunner, this);
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

    getTest(subpackage: string, suite: string, name: string) : TestCaseTrialNode {
        const key = subpackage + "#" + suite + "#" + name;

        if(!this.tests[key]) {
            this.tests[key] = new TestCaseTrialNode(subpackage, suite, name, this);
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
