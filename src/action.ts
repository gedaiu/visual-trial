import { window, ProgressLocation, Progress, StatusBarItem } from "vscode";

export class Action {
    private _name: string;
    private _func: any;
    private _cancelFunc: any;
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
}

export class ActionCollection {

    private actions: Array<Action> = [];
    private statusBarItem: StatusBarItem;

    constructor() {
        this.statusBarItem = window.createStatusBarItem();
    }

    push(action: Action) {
        this.actions.push(action);
        this.nextAction();
    }

    cancel(name: string) {
        this.actions.filter(a => a.name == name).filter(a => a.isRunning).forEach(a => a.cancel());
        this.actions = this.actions.filter(a => a.name != name);
        this.nextAction();
    }

    get length(): number {
        return this.actions.length;
    }

    private updateStatus() {
        if(this.length === 0) {
            this.statusBarItem.hide();
            return;
        }

        if(this.length === 1) {
            this.statusBarItem.text = "1 Trial action";
        } else {
            this.statusBarItem.text = this.length + " Trial actions";
        }

        this.statusBarItem.show();
    }

    private nextAction() {
        this.updateStatus();

        if(this.length === 0) {
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
}