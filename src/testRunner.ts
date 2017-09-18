import * as vscode from 'vscode';
import { Action, ActionCollection } from "./action";
import { TrialRootNode } from "./nodes/trialRootNode";
import { TestCaseTrialNode } from "./nodes/testCaseTrialNode";
import { ChildProcess, spawn } from "child_process";
import { EventEmitter, Event } from "vscode";
import { TrialParser } from "./trialParser";
import { TestResult, TestState } from "./testResult";
import Trial from "./trial";

export class TestRunner {
    private subpackagesPromise: Thenable<string[]>;
    private results: Map<string, Map<string, Map<string, TestResult>>> = new Map<string, Map<string, Map<string, TestResult>>>();

    private _resultNotification: (subpackage: string, suite: string, name: string) => void;

    private _onClearResults: EventEmitter<any> = new EventEmitter<any>();
    readonly onClearResults: Event<any> = this._onClearResults.event;

    private _onResult: EventEmitter<any> = new EventEmitter<any>();
    readonly onResult: Event<any> = this._onResult.event;

    private _onFinish: EventEmitter<any> = new EventEmitter<any>();
    readonly onFinish: Event<any> = this._onFinish.event;

    constructor(private trial: Trial, private actions: ActionCollection) { }

    private notify(subpackage: string, suite: string, test: string) {
        this._onResult.fire([subpackage, suite, test]);
    }

    private addResult(subpackage: string, result: TestResult) {
        if(!this.results.has(subpackage)) {
            this.results.set(subpackage, new Map<string, Map<string, TestResult>>());
        }

        if(!this.results.get(subpackage).has(result.suite)) {
            this.results.get(subpackage).set(result.suite, new Map<string, TestResult>());
        }

        this.results.get(subpackage).get(result.suite).set(result.test, result);
        this.notify(subpackage, result.suite, result.test);
    }

    getSuites(subpackage): string[] {
        if(!this.results.has(subpackage)) {
            return [];
        }

        return Array.from(this.results.get(subpackage).keys());
    }

    getTestNames(subpackage: string, suite: string) {
        if(!this.results.has(subpackage)) {
            return [];
        }

        if(!this.results.get(subpackage).has(suite)) {
            return [];
        }

        return Array.from(this.results.get(subpackage).get(suite).keys());
    }

    getResult(subpackage: string, suite: string, testName: string): TestResult | null {
        if(!this.results.has(subpackage)) {
            return null;
        }

        if(!this.results.get(subpackage).has(suite)) {
            return null;
        }

        if(!this.results.get(subpackage).get(suite).get(testName)) {
            return null;
        }

        return this.results.get(subpackage).get(suite).get(testName);
    }

    subpackages(): Thenable<string[]> {
        if (this.subpackagesPromise) {
            return this.subpackagesPromise;
        }

        var _this = this;

        this.subpackagesPromise = new Promise((resolve, reject) => {
            var trialProcess;

            this.actions.push(this.trial.getSubpackages((err, values: string[]) => {
                if(err) {
                    return reject(err);
                }

                resolve(values);
            }));
        });

        return this.subpackagesPromise;
    }

    private cacheTests(subpackage: string, data: object) {
        if(this.results.has(subpackage)) {
            this.results.delete(subpackage);
        }

        const _this = this;
        function flatten(obj) {
            if (Array.isArray(obj)) {
                obj.forEach((a) => {
                    const result : TestResult = {
                        status: TestState.unknown,
                        suite: a.suiteName,
                        test: a.name,
                        location: a.location,
                        labels: a.labels
                    };

                    _this.addResult(subpackage, result);
                });

                return;
            }

            Object.keys(obj).forEach((a) => {
                flatten(obj[a]);
            });
        }

        flatten(data);
    }

    getTests(subpackage: string = ""): Thenable<object> {
        return new Promise((resolve, reject) => {
            var trialProcess;

            this.actions.push(this.trial.getTests(subpackage, (err, values: object) => {
                if(err) {
                    return reject(err);
                }

                this.cacheTests(subpackage, values);
                resolve(values);
            }));
        });
    }

    private setTestState(subpackage: string, suite: string, test: string, func: (result: TestResult) => void) {
        if(!this.results.has(subpackage) || 
           !this.results.get(subpackage).has(suite) || 
           !this.results.get(subpackage).get(suite).has(test)) {
            const result = {
                status: TestState.unknown,
                suite: suite,
                test: test
            };

            this.addResult(subpackage, result);
        }

        func(this.results.get(subpackage).get(suite).get(test));

        this.notify(subpackage, suite, test);
    }

    private setPackageState(subpackage: string, func: (result: TestResult) => void) {
        if(!this.results.has(subpackage)) {
            return;
        }

        this.results.get(subpackage).forEach((suite) => {
            suite.forEach((result) => {
                func(result);
                this.notify(subpackage, result.suite, result.test);
            });
        });
    }

    runTest(node: TestCaseTrialNode) {
        this._onClearResults.fire();

        this.setTestState(node.subpackage, node.suite, node.name, (result) => {
            result.status = TestState.wait;
        });

        var action = this.trial.runTest(node.subpackage, node.name, (err) => {
            if(err) {
                vscode.window.showErrorMessage(err);
            }
        });

        action.parser.onTestResult((result) => {
            this.addResult(node.subpackage, result);
        });

        this.actions.push(action);
    }

    runAll(node: TrialRootNode) {
        this._onClearResults.fire();

        this.setPackageState(node.subpackage, (result) => {
            result.status = TestState.wait;
        });

        var action = this.trial.runAllTests(node.subpackage, (err) => {
            if(this.results.has(node.subpackage)) {
                this.results.get(node.subpackage).forEach((suite) => {
                    suite.forEach((result, name) => {
                        if(result.status === TestState.wait) {
                            suite.delete(name);
                        }
                    });
                });
            }

            if(err) {
                vscode.window.showErrorMessage(err);
            }
        });

        action.parser.onTestResult((result) => {
            this.addResult(node.subpackage, result);
        });

        this.actions.push(action);
    }
}