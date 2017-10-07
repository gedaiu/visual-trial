import Action from "./action";
import { StatusBarItem, window } from "vscode";


export default class ActionCollection {

    private actions: Array<Action> = [];
    private statusBarItem: StatusBarItem;

    constructor() {
        this.statusBarItem = window.createStatusBarItem();
        this.statusBarItem.command = "showTrialActions";
    }

    getNames(): string[] {
        return this.actions.map(a => a.name);
    }

    push(action: Action) {
        this.actions.push(action);
        this.nextAction();
    }

    cancel(name: string) {
        this.actions.filter(a => a.name == name).forEach(a => a.cancel());
        this.actions = this.actions.filter(a => a.name != name);
        this.nextAction();
    }

    get length(): number {
        return this.actions.length;
    }

    private updateStatus() {
        if (this.length === 0) {
            this.statusBarItem.hide();
            return;
        }

        if (this.length === 1) {
            this.statusBarItem.text = "1 Trial action";
        } else {
            this.statusBarItem.text = this.length + " Trial actions";
        }

        this.statusBarItem.show();
    }

    private nextAction() {
        this.updateStatus();

        if (this.length === 0) {
            return;
        }

        if (this.actions[0].isRunning) {
            return;
        }

        this.actions[0].perform().onFinish(() => {
            this.actions.shift();
            this.nextAction();
        });
    }
}