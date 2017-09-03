import { ActionCollection } from "./action";
import { window } from "vscode";

export class ActionsPresenter {
    constructor(private actions: ActionCollection) {

    }

    show() {
        window.showQuickPick(this.actions.getNames()).then((value) => {
            if(value) {
                window.showInformationMessage("Are you sure you want to cancel: " + value + "?", "Yes").then((option) => {
                    if(option === "Yes") {
                        this.actions.cancel(value);
                    }
                });
            }
        });
    }
}