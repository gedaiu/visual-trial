import { TrialParser } from "../parsers/trialParser";
import * as vscode from "vscode";
import Action from "./action";
import { DubParser } from "../parsers/dubParser";

export default class RunTestAction extends Action {
    parser: TrialParser = new TrialParser();
    dubParser: DubParser = new DubParser();

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
                this.dubParser.setData(data);
                this.parser.setData(data);
            });

            process.stderr.on('data', (data) => {
                this.dubParser.setData(data);
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    if(this.dubParser.hasCompilerErrors) {
                        return callback(`Trial failed because of some compiler errors`);
                    }

                    if(this.dubParser.hasLinkerErrors) {
                        return callback(`Trial failed because of some linker errors`);
                    }

                    return callback(`Trial failed with code ${code}`);
                }

                callback(null);
            });
        });
    }
}