import { Action } from "../action";
import { TrialParser } from "../trialParser";
import * as vscode from "vscode";

export default class RunTestAction extends Action {
    parser: TrialParser = new TrialParser();

    constructor(command: string, workingDir: string, subpackage: string, testName: string, callback) {

        super("run " + testName, (done) => {
            var options = [];
            if(subpackage != "") {
                options.push(subpackage);
            }

            options.push("-t");
            options.push(testName);

            options.push("-r");
            options.push("visualtrial");

            var process = this.command(command, options, workingDir, done);

            let rawDescription = "";

            process.stdout.on('data', (data) => {
                this.parser.setData(data);
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    return callback(`Trial existed with code ${code}`);
                }

                try {
                    callback(null);
                } catch (e) {
                    callback(`Can not parse the description`);
                }
            });
        });
    }
}