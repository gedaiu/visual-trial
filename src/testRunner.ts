import * as ChildProcess from "child_process"
import { TestCaseTrialNode } from "./trialTestsDataProvider";
import { TapParser } from "./tapParser";
import { EventEmitter } from "vscode";

export default class TestRunner {
    private subpackagesPromise: Thenable<string[]>;
    private testsPromise: Thenable<object>;
    private tapParser: TapParser;
    private results: any = {};

    constructor(private projectRoot: string, private _onDidChangeTreeData: EventEmitter<any>) {
        this.tapParser = new TapParser();

        this.tapParser.onTestResult((result) => {
            if(!this.results[result.suite]) {
                this.results[result.suite] = {};
            }

            this.results[result.suite][result.name] = result;
        });
    }

    getTests(subpackage: string = ""): Thenable<object> {
        if (this.testsPromise) {
            return this.testsPromise;
        }

        let options = ["describe"];

        if (subpackage.indexOf(":") === 0) {
            options.push(subpackage);
        }

        this.testsPromise = new Promise((resolve, reject) => {
            const trialProcess = ChildProcess.spawn("trial", options, { cwd: this.projectRoot });
            let rawDescription = "";

            trialProcess.stdout.on('data', (data) => {
                rawDescription += data;
            });

            trialProcess.on('close', (code) => {
                this.testsPromise = null;

                if (code !== 0) {
                    reject(`trial process exited with code ${code}`);
                }

                try {
                    resolve(JSON.parse(rawDescription));
                } catch (e) {
                    reject(e);
                }
            });
        });

        return this.testsPromise;
    }

    getResult(suite: string, testName: string): object {
        if(!this.results[suite]) {
            return {};
        }

        if(!this.results[suite][testName]) {
            return {};
        }

        return this.results[suite][testName];
    }

    subpackages(): Thenable<string[]> {
        if (this.subpackagesPromise) {
            return this.subpackagesPromise;
        }

        this.subpackagesPromise = new Promise((resolve, reject) => {
            const trialProcess = ChildProcess.spawn("trial", ["subpackages"], { cwd: this.projectRoot });

            let rawSubpackages = "";

            trialProcess.stdout.on('data', (data) => {
                rawSubpackages += data;
            });

            trialProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(`trial process exited with code ${code}`);
                }

                let items = rawSubpackages.trim().split("\n");

                resolve(items);
                this.subpackagesPromise = null;
            });
        });

        return this.subpackagesPromise;
    }

    runTest(node: TestCaseTrialNode) {
        var subpackage = node.subpackage;
        var testName = node.data.name;

        var options = [];

        if(subpackage.indexOf(":") === 0) {
            options.push(subpackage);
        }

        options.push("-t");
        options.push(testName);

        options.push("-r");
        options.push("tap");

        let testResult: string = "";

        const trialProcess = ChildProcess.spawn("trial", options, { cwd: this.projectRoot });

        trialProcess.stdout.on('data', (data) => {
            this.tapParser.setData(data);
        });

        trialProcess.on('close', (code) => {
            if (code !== 0) {
                //reject(`trial process exited with code ${code}`);
            }

            this._onDidChangeTreeData.fire(node);

            console.log(testResult);
        });
    }
}