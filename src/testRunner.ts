import * as ChildProcess from "child_process"

export default class TestRunner {
    private subpackagesPromise: Thenable<string[]>;

    constructor(private projectRoot: string) {

    }

    subpackages() : Thenable<string[]> {
        if(this.subpackagesPromise) {
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
}