import * as vscode from 'vscode';
import { TrialRootNode } from "./nodes/trialRootNode";
import { TestCaseTrialNode } from "./nodes/testCaseTrialNode";
import { ChildProcess, spawn } from "child_process";
import { EventEmitter, Event } from "vscode";
import { TrialParser } from "./parsers/trialParser";
import { TestResult, TestState } from "./testResult";
import Trial from "./trial";
import ResultManager from './resultManager';
import ActionCollection from './actions/actionCollection';

export class TestRunner {
    private subpackagesPromise: Thenable<string[]>;
    readonly results: ResultManager = new ResultManager();

    private _resultNotification: (subpackage: string, suite: string, name: string) => void;

    private _onClearResults: EventEmitter<any> = new EventEmitter<any>();
    readonly onClearResults: Event<any> = this._onClearResults.event;

    private _onResult: EventEmitter<any> = new EventEmitter<any>();
    readonly onResult: Event<any> = this._onResult.event;

    private _onFinish: EventEmitter<any> = new EventEmitter<any>();
    readonly onFinish: Event<any> = this._onFinish.event;

    constructor(private trial: Trial, private actions: ActionCollection) {
        this.results.onResult((data) => {
            this._onResult.fire(data);
        });
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

                this.results.cache(subpackage, values);
                resolve(values);
            }));
        });
    }

    refreshFile(fileName: string, callback) {
        var action = this.trial.describeFile(fileName, callback);

        this.actions.push(action);
    }

    cancelTest(node: TestCaseTrialNode) {
        var names = this.actions.getNames();

        if(names.indexOf("run " + node.name) != -1) {
            this.actions.cancel("run " + node.name);
            return;
        }

        if(names.indexOf("run all tests " + node.subpackage) != -1) {
            this.actions.cancel("run all tests " + node.subpackage);
            return;
        }
    }

    handleTestErrors(err, subpackage?: string) {
        if(typeof err == "string") {
            this.results.setErrors(subpackage);
        } else {
            this.results.removeWaiting(subpackage);
        }
    }

    runTest(node: TestCaseTrialNode) {
        var names = this.actions.getNames();

        if(names.indexOf("run " + node.name) != -1) {
            vscode.window.showInformationMessage("Please wait until the current action for `" + node.name + "` is finished.");
            return;
        }

        if(names.indexOf("run all tests " + node.subpackage) != -1) {
            vscode.window.showInformationMessage("Please wait until the current action for `" + node.subpackage + "` is finished.");
            return;
        }

        this._onClearResults.fire();

        this.results.setTestState(node.subpackage, node.suite, node.name, (result) => {
            result.status = TestState.wait;
        });

        var action = this.trial.runTest(node.subpackage, node.name, (err) => {
            if(err) {
                this.handleTestErrors(err, node.subpackage);
            }
        });

        action.parser.onTestResult((result) => {
            this.results.add(node.subpackage, result);
        });

        action.onCancel(() => {
            this.results.setTestState(node.subpackage, node.suite, node.name, (result) => {
                result.status = TestState.cancel;
            });
        });

        this.actions.push(action);
    }

    runAll(node: TrialRootNode) {
        var names = this.actions.getNames();

        if(names.indexOf("run all tests " + node.subpackage) != -1) {
            vscode.window.showInformationMessage("Please wait until the current action for `" + node.subpackage + "` is finished.");
            return;
        }

        this._onClearResults.fire();

        this.results.setPackageState(node.subpackage, (result) => {
            result.status = TestState.wait;
        });

        var action = this.trial.runAllTests(node.subpackage, (err) => {
            if(err) {
                this.handleTestErrors(err, node.subpackage);
            }
        });

        action.parser.onTestResult((result) => {
            this.results.add(node.subpackage, result);
        });

        action.onCancel(() => {
            this.results.setPackageState(node.subpackage, (result) => {
                if(result.status == TestState.run || result.status == TestState.wait) {
                    result.status = TestState.cancel;
                }
            });
        });

        this.actions.push(action);
    }
}