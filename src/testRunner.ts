import * as ChildProcess from "child_process"
import { TestCaseTrialNode, TrialRootNode } from "./trialTestsDataProvider";
import { TapParser, TestResult } from "./tapParser";
import * as vscode from 'vscode';
import Action from "./action";

export default class TestRunner {
    private subpackagesPromise: Thenable<string[]>;
    private testsPromise: Map<string, Thenable<object>> = new Map<string, Thenable<object>>();
    private tapParser: TapParser;
    private results: Map<string, Map<string, TestResult>> = new Map<string, Map<string, TestResult>>();
    private actions: Array<Action> = [];
    private output: vscode.OutputChannel;
    private runningSubpackage: string = "";
    private _notification: (subpackage: string, suite: string, name: string) => void;

    constructor(private projectRoot: string) {
        this.tapParser = new TapParser();
        this.output = vscode.window.createOutputChannel("Trial");

        this.tapParser.onTestResult((result) => {
            if(!this.results[result.suite]) {
                this.results[result.suite] = {};
            }

            this.results[result.suite][result.name] = result;
            this.notify(result.suite, result.name);
        });
    }

    private notify(suite: string, name: string) {
        if(this._notification) {
            this._notification(this.runningSubpackage, suite, name);
        }
    }

    onResult(notification: (subpackage: string, suite: string, name: string) => void) {
        this._notification = notification;
    }

    private start(options: Array<string>) {
        this.output.appendLine("> trial " + options.join(' '));
        var proc = ChildProcess.spawn("trial", options, { cwd: this.projectRoot, shell: true });
        
        proc.stdout.on('data', (data) => {
            this.output.append(data.toString());
        });

        proc.stderr.on('data', (data) => {
            this.output.append(data.toString());
        });

        proc.on('close', (code) => {
            this.output.appendLine(`\ntrial process exited with code ${code}\n\n`);
        });

        proc.on('disconnect', () => {
            this.output.appendLine(`\ntrial process disconnected\n\n`);
        });

        proc.on('error', (err) => {
            this.output.appendLine(`\ntrial process error: ` + err + `\n\n`);
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
            this.actions.push(new Action(key, (done) => {
                const trialProcess = this.start(options);
                let rawDescription = "";

                trialProcess.stdout.on('data', (data) => {
                    rawDescription += data;
                });

                trialProcess.on('close', (code) => {
                    this.testsPromise[key] = null;

                    if (code !== 0) {
                        reject(`trial process exited with code ${code}`);
                        done();
                        return;
                    }

                    try {
                        resolve(JSON.parse(rawDescription));
                    } catch (e) {
                        reject(e);
                    }
                    
                    done();
                });
            }));

            _this.nextAction();
        });

        return this.testsPromise[key];
    }

    getResult(suite: string, testName: string): TestResult | null {
        if(!this.results[suite]) {
            return null;
        }

        if(!this.results[suite][testName]) {
            return null;
        }

        return this.results[suite][testName];
    }

    subpackages(): Thenable<string[]> {
        if (this.subpackagesPromise) {
            return this.subpackagesPromise;
        }

        var _this = this;

        this.subpackagesPromise = new Promise((resolve, reject) => {
            this.actions.push(new Action("subpackages", (done) => {
                const trialProcess = this.start(["subpackages"]);

                let rawSubpackages = "";

                trialProcess.stdout.on('data', (data) => {
                    rawSubpackages += data;
                });

                trialProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(`trial process exited with code ${code}`);
                        done();
                        return;
                    }

                    let items = rawSubpackages.trim().split("\n");

                    resolve(items);
                    this.subpackagesPromise = null;
                    done();
                });
            }));

            _this.nextAction();
        });

        return this.subpackagesPromise;
    }

    nextAction() {
        if(this.actions.length === 0) {
            return;
        }

        if(this.actions[0].isRunning) {
            return;
        }

        this.actions[0].perform().onFinish(() => {
            this.actions.shift();
            this.nextAction();
        });
    }

    runTest(node: TestCaseTrialNode) {
        this.runningSubpackage = node.subpackage;
        var testName = node.data.name;

        var options = [];

        if(this.runningSubpackage.indexOf(":") === 0) {
            options.push(this.runningSubpackage);
        }

        options.push("-t");
        options.push(testName);

        options.push("-r");
        options.push("tap");

        let testResult: string = "";

        this.actions.push(new Action("run test " + this.runningSubpackage + "#" + testName , (done) => {
            const trialProcess = this.start(options);
    
            trialProcess.stdout.on('data', (data) => {
                this.tapParser.setData(data);
            });
    
            trialProcess.on('close', (code) => {
                if (code !== 0) {
                    //reject(`trial process exited with code ${code}`);
                }

                done();
            });
        }));

        this.nextAction();
    }


    runAll(node: TrialRootNode) {
        this.runningSubpackage = node.subpackage;
        
        var options = [];
        if(this.runningSubpackage.indexOf(":") === 0) {
            options.push(this.runningSubpackage);
        }

        options.push("-r");
        options.push("tap");

        let testResult: string = "";

        this.actions.push(new Action("run all " + this.runningSubpackage , (done) => {
            const trialProcess = this.start(options);
    
            trialProcess.stdout.on('data', (data) => {
                this.tapParser.setData(data);
            });
    
            trialProcess.on('close', (code) => {
                if (code !== 0) {
                    //reject(`trial process exited with code ${code}`);
                }

                done();
            });
        }));

        this.nextAction();
    }
}