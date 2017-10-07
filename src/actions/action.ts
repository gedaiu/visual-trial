import { window, ProgressLocation, Progress, StatusBarItem } from "vscode";
import { spawn } from "child_process";
import * as vscode from "vscode";

export default class Action {
    private _name: string;
    private _func: any;
    private _cancelFunc: any;
    private _onOutput: any;
    private _event: any;
    private _isRunning: boolean = false;

    constructor(name: string, func: any, cancelFunc: any = null) {
        this._name = name;
        this._func = func;
        this._cancelFunc = cancelFunc;
    }

    perform() {
        this._isRunning = true;

        setImmediate(() => {
            this._func(() => {
                this._isRunning = false;
                if(this._event) {
                    this._event();
                }
            });
        });

        return this;
    };

    cancel() {
        if(this._cancelFunc) {
            this._cancelFunc();
        }
    }

    onFinish(event) : Action {
        this._event = event;
        return this;
    }

    get name() : string {
        return this._name;
    }

    get isRunning() : boolean {
        return this._isRunning;
    }

    output(text: string) {
        if(this._onOutput) {
            this._onOutput(text);
        }
    }

    onOutput(event) {
        this._onOutput = event;
    }

    command(name: string, options: string[], workingDir: string, done) {
        this.output("> " + name + " " + options.join(' ') + "\n");
        var proc = spawn(name, options, { cwd: workingDir });

        proc.stdout.on('data', (data) => {
            this.output(data.toString());
        });

        proc.stderr.on('data', (data) => {
            this.output(data.toString());
        });

        proc.on('close', (code) => {
            this.output(`\n${name} process exited with code ${code}\n\n`);

            if(done) {
                done();
            }
        });

        proc.on('disconnect', () => {
            this.output(`\n${name} process disconnected\n\n`);
            vscode.window.showErrorMessage(`${name} process disconnected`);

            if(done) {
                done();
            }
        });

        proc.on('error', (err) => {
            this.output(`\n${name} process error: ` + err + `\n\n`);
            vscode.window.showErrorMessage(`${name} process error: ` + err);

            if(done) {
                done();
            }
        });

        return proc;
    }
}
