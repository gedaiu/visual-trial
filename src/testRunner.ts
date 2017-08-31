import * as ChildProcess from "child_process"

export default class TestRunner {
    private subpackagesPromise: Thenable<string[]>;
    private testsPromise: Thenable<object>;

    constructor(private projectRoot: string) {
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

    runTest(subpackage: string, testName: string) {
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
            testResult += data;
        });

        trialProcess.on('close', (code) => {
            if (code !== 0) {
                //reject(`trial process exited with code ${code}`);
            }

            console.log(testResult);
        });
    }
}