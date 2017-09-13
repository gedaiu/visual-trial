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
    private cachedTests = {};

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
        if(!this.results[subpackage]) {
            this.results[subpackage] = {};
        }

        if(!this.results[subpackage][result.suite]) {
            this.results[subpackage][result.suite] = {};
        }

        this.results[subpackage][result.suite][result.test] = result;
        this.notify(subpackage, result.suite, result.test);
    }

    getResult(subpackage: string, suite: string, testName: string): TestResult | null {
        if(!this.results[subpackage]) {
            return null;
        }

        if(!this.results[subpackage][suite]) {
            return null;
        }

        if(!this.results[subpackage][suite][testName]) {
            return null;
        }

        return this.results[subpackage][suite][testName];
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

    getTests(subpackage: string = ""): Thenable<object> {
        return new Promise((resolve, reject) => {
            var trialProcess;

            this.actions.push(this.trial.getTests(subpackage, (err, values: object) => {
                if(err) {
                    return reject(err);
                }

                resolve(values);
            }));
        });
    }

    private setTestState(subpackage: string, suite: string, test: string, func: (result: TestResult) => void) {
        if(!this.results[subpackage]) {
            this.results[subpackage] = {};
        }

        if(!this.results[subpackage][suite]) {
            this.results[subpackage][suite] = {};
        }

        if(!this.results[subpackage][suite][test]) {
            this.results[subpackage][suite][test] = {
                status: TestState.unknown,
                suite: suite,
                test: test,

                file: null,
                line: null,
                message: null,
                error: null
            };
        }

        func(this.results[subpackage][suite][test]);

        this.notify(subpackage, suite, test);
    }

    private setPackageState(subpackage: string, func: (result: TestResult) => void) {
        if(!this.cachedTests[subpackage]) {
            return;
        }

        var _this = this;
        function setCollectionState(collection: string, obj) {
            if (Array.isArray(obj)) {
                obj.forEach((a) => {
                    _this.setTestState(subpackage, collection, a.name, func);
                });

                return;
            }

            const pre = collection === "" ? "" : collection + ".";
            Object.keys(obj).forEach((a) => {
                setCollectionState(pre + a, obj[a]);
            });
        }

        setCollectionState("", this.cachedTests[subpackage]);
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