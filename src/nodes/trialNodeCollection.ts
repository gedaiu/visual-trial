import { ExtensionContext, Uri } from "vscode";
import { TestRunner } from "../testRunner";
import { TrialRootNode } from "./trialRootNode";
import { TestCaseTrialNode, TestLocation } from "./testCaseTrialNode";
import { SuiteTrialNode } from "./suiteTrialNode";
import { TestResult } from "../testResult";
import * as path from 'path';
import { TrialNode } from "../trialTestsDataProvider";

export class TrialNodeCollection {
    private subpackages = {};
    private suites = {};
    private tests = {};

    constructor(private context: ExtensionContext, private testRunner: TestRunner) {
    }

    getSuiteNodes(suite) {
        var prefixedSuite = "#" + suite;
        var suiteNames = Object.keys(this.suites).filter(a => a.indexOf(prefixedSuite) != -1);

        return suiteNames.map(name => this.suites[name]);
    }

    getSubpackage(name: string) {
        if(!this.subpackages[name]) {
            this.subpackages[name] =  new TrialRootNode(name, this.context, this.testRunner, this);
        }

        return this.subpackages[name];
    }

    getSuite(subpackage: string, suite: string) {
        const key = subpackage + "#" + suite;

        if(!this.suites[key]) {
            this.suites[key] = new SuiteTrialNode(subpackage, suite, this);
        }

        return this.suites[key];
    }

    getSuiteChilds(subpackage: string, suite: string) {
        let elements: TrialNode[] = [];

        var _this = this;

        function getModule(key: string) {
            if(key.indexOf(suite + ".") != 0) {
                return "";
            }

            var other = key.substring(suite.length + 1).split(".");

            return suite + "." + other[0];
        }

        var suites = this.testRunner.results.getSuites(subpackage)
                .map((a) => { return getModule(a); })
                .filter((v, i, a) => a.indexOf(v) === i) // unique values
                .filter(a => a != "")
                .sort()
                .map((a) => { return this.getSuite(subpackage, a); });

        var tests = this.testRunner.results.getTestNames(subpackage, suite)
                .sort()
                .map((a) => { return this.getTest(subpackage, suite, a); });

        elements = elements.concat(suites).concat(tests);

        return elements;
    }

    getTest(subpackage: string, suite: string, name: string) : TestCaseTrialNode {
        const key = subpackage + "#" + suite + "#" + name;

        if(!this.tests[key]) {
            this.tests[key] = new TestCaseTrialNode(subpackage, suite, name, this);
        }

        return this.tests[key];
    }

    getResult(subpackage: string, suite: string, name: string) : TestResult | null {
        return this.testRunner.results.getResult(subpackage, suite, name);
    }

    icon(name: string) : { light: string | Uri; dark: string | Uri } {
        return {
            light: this.context.asAbsolutePath(path.join('resources', 'light', name)),
            dark: this.context.asAbsolutePath(path.join('resources', 'dark', name))
        };
    }
}
