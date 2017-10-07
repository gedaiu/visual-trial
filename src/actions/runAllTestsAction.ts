import { TrialParser } from "../trialParser";
import * as vscode from "vscode";
import Action from "./action";

export default class RunAllTestsAction extends Action {
    parser: TrialParser = new TrialParser();

    constructor(command: string, workingDir: string, subpackage: string, callback) {
        super(("run all tests " + subpackage).trim(), (done) => {
            var options = [];
            if(subpackage != "") {
                options.push(subpackage);
            }

            options.push("-r");
            options.push("visualtrial");

            var process = this.command(command, options, workingDir, done);

            let rawDescription = "";

            process.stdout.on('data', (data) => {
                this.parser.setData(data);
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    return callback(`Trial failed with code ${code}`);
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