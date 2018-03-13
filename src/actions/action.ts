import { window, ProgressLocation, Progress, StatusBarItem } from "vscode";
import { spawn, ChildProcess } from "child_process";
import { EventEmitter, Event } from "vscode";
import * as vscode from "vscode";

export default class Action {
    private _name: string;
    private _func: any;
    private _onOutput: any;
    private _isRunning: boolean = false;
    protected proc: ChildProcess;

    private _onFinish: EventEmitter<void> = new EventEmitter<void>();
    readonly onFinish: Event<void> = this._onFinish.event;

    private _onCancel: EventEmitter<void> = new EventEmitter<void>();
    readonly onCancel: Event<void> = this._onCancel.event;

    constructor(name: string, func: any, cancelFunc?: any) {
        this._name = name;
        this._func = func;

        if(cancelFunc) {
            this.onCancel(cancelFunc);
        }
    }

    perform() {
        this._isRunning = true;

        setImmediate(() => {
            this._func(() => {
                this._isRunning = false;
                this._onFinish.fire();
            });
        });

        return this;
    };

    cancel() {
        this._onCancel.fire();
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

        try {
            this.proc = spawn(name, options, { cwd: workingDir });
        } catch(err) {
            this.output(err);
            done(err);
            return;
        }

        this.onCancel(() => {
            if(this.proc) {
                this.proc.kill();
            }
        });

        this.proc.stdout.on('data', (data) => {
            this.output(data.toString());
        });

        this.proc.stderr.on('data', (data) => {
            this.output(data.toString());
        });

        this.proc.on('close', (code) => {
            this.output(`\n${name} process exited with code ${code}\n\n`);

            if(done) {
                done();
            }
        });

        this.proc.on('disconnect', () => {
            this.output(`\n${name} process disconnected\n\n`);
            vscode.window.showErrorMessage(`${name} process disconnected`);

            if(done) {
                done();
            }
        });

        this.proc.on('error', (err) => {
            this.output(`\n${name} process error: ` + err + `\n\n`);
            vscode.window.showErrorMessage(`${name} process error: ` + err);

            if(done) {
                done();
            }
        });

        return this.proc;
    }
}
