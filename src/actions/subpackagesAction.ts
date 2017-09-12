import { Action } from "../action";
import { spawn } from "child_process";
import * as vscode from "vscode";

export default class SubpackagesAction extends Action {

    constructor(command: string, workingDir: string, callback) {
        super("get subpackages", (done) => {
            var process = this.command(command, ["subpackages"], workingDir, done);

            let rawSubpackages = "";

            process.stdout.on('data', (data) => {
                rawSubpackages += data;
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    return callback(`Trial existed with code ${code}`);
                }

                callback(null, rawSubpackages.trim().split("\n"));
            });
        });
    }
}
