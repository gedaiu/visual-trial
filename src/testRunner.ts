import { TapParser, TestResult } from "./tapParser";
import * as vscode from 'vscode';
import { Action, ActionCollection } from "./action";
import { TrialRootNode } from "./nodes/trialRootNode";
import { TestCaseTrialNode } from "./nodes/testCaseTrialNode";
import { ChildProcess, spawn } from "child_process";

export enum TestState {
    unknown,
    success,
    failure,
    run,
    wait
}

export class TestRunner {
    private subpackagesPromise: Thenable<string[]>;
    private testsPromise: Map<string, Thenable<object>> = new Map<string, Thenable<object>>();
    private tapParser: TapParser;
    private results: Map<string, Map<string, Map<string, TestResult>>> = new Map<string, Map<string, Map<string, TestResult>>>();
    private output: vscode.OutputChannel;
    private runningSubpackage: string = "";
    private _resultNotification: (subpackage: string, suite: string, name: string) => void;
    private cachedTests = {};

    constructor(private projectRoot: string, private actions: ActionCollection) {
        this.tapParser = new TapParser();
        this.output = vscode.window.createOutputChannel("Trial");

        this.tapParser.onTestResult((result) => {
            if(!this.results[this.runningSubpackage]) {
                this.results[this.runningSubpackage] = {};
            }

            if(!this.results[this.runningSubpackage][result.suite]) {
                this.results[this.runningSubpackage][result.suite] = {};
            }

            this.results[this.runningSubpackage][result.suite][result.name] = result;
            this.notify(this.runningSubpackage, result.suite, result.name);
        });
    }

    private notify(subpackage: string, suite: string, name: string) {

        if(this._resultNotification) {
            this._resultNotification(subpackage, suite, name);
        }
    }

    onResult(notification: (subpackage: string, suite: string, name: string) => void) {
        this._resultNotification = notification;
    }

    private start(options: Array<string>, done) : ChildProcess {
        this.output.appendLine("> trial " + options.join(' '));
        var proc = spawn("trial", options, { cwd: this.projectRoot, shell: true });
        
        proc.stdout.on('data', (data) => {
            this.output.append(data.toString());
        });

        proc.stderr.on('data', (data) => {
            this.output.append(data.toString());
        });

        proc.on('close', (code) => {
            this.output.appendLine(`\ntrial process exited with code ${code}\n\n`);
            if(code != 0) {
                vscode.window.showErrorMessage(`trial process exited with code ${code}`);
            }

            if(done) {
                done();
            }
        });

        proc.on('disconnect', () => {
            this.output.appendLine(`\ntrial process disconnected\n\n`);
            vscode.window.showErrorMessage(`trial process disconnected`);

            if(done) {
                done();
            }
        });

        proc.on('error', (err) => {
            this.output.appendLine(`\ntrial process error: ` + err + `\n\n`);
            vscode.window.showErrorMessage(`trial process error: ` + err);

            if(done) {
                done();
            }
        });

        return proc;
    }

    getTests(subpackage: string = ""): Thenable<object> {
        const key = "getTests" + subpackage;

        if (this.testsPromise[key]) {
            return this.testsPromise[key];
        }

        let options = ["describe"];

        if (subpackage.indexOf(":") === 0) {
            options.push(subpackage);
        }

        var _this = this;

        this.testsPromise[key] = new Promise((resolve, reject) => {
            let trialProcess;
            this.actions.push(new Action(key, (done) => {
                trialProcess = this.start(options, done);

                let rawDescription = "";

                trialProcess.stdout.on('data', (data) => {
                    rawDescription += data;
                });

                trialProcess.on('close', (code) => {
                    this.testsPromise[key] = null;

                    if (code !== 0) {
                        reject(`trial process exited with code ${code}`);
                        return;
                    }

                    try {
                        let description = JSON.parse(rawDescription);
                        resolve(description);
                        this.cachedTests[subpackage] = description;
                    } catch (e) {
                        reject(e);
                    }
                });
            }, () => { 
                this.testsPromise[key] = null;

                if(trialProcess) {
                    trialProcess.kill(); 
                }

                reject(key + " was canceled.");
            }));
        });

        return this.testsPromise[key];
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
            this.actions.push(new Action("subpackages", (done) => {
                trialProcess = this.start(["subpackages"], done);

                let rawSubpackages = "";

                trialProcess.stdout.on('data', (data) => {
                    rawSubpackages += data;
                });

                trialProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject();
                        return;
                    }

                    let items = rawSubpackages.trim().split("\n");

                    resolve(items);
                    this.subpackagesPromise = null;
                });
            }, () => {
                if(trialProcess) {
                    trialProcess.kill();
                    reject("Trial subpackages was canceled.");
                }
            }));
        });

        return this.subpackagesPromise;
    }

    private createRunTestAction(name: string, options: Array<string>, subpackage: string) {
        var trialProcess;

        this.actions.push(new Action(name, (done) => {
            trialProcess = this.start(options, done);
    
            trialProcess.stdout.on('data', (data) => {
                this.tapParser.setData(data);
            });
        }, () => {
            if(trialProcess) {
                trialProcess.kill();
            }
        }));
    }

    runTest(node: TestCaseTrialNode) {
        this.runningSubpackage = node.subpackage;
        var testName = node.name;

        var options = [];

        if(this.runningSubpackage.indexOf(":") === 0) {
            options.push(this.runningSubpackage);
        }

        options.push("-t");
        options.push(testName);

        options.push("-r");
        options.push("tap");

        this.createRunTestAction("run test " + this.runningSubpackage + "#" + testName, options, node.subpackage);
    }

    runAll(node: TrialRootNode) {
        this.runningSubpackage = node.subpackage;
        
        var options = [];

        if(this.runningSubpackage.indexOf(":") === 0) {
            options.push(this.runningSubpackage);
        }

        options.push("-r");
        options.push("tap");

        this.createRunTestAction("run all " + this.runningSubpackage, options, node.subpackage);
    }
}