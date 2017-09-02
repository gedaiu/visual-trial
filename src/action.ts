

export default class Action {
    private _name: string;
    private _func: any;
    private _event: any;
    private _isRunning: boolean = false;

    constructor(name: string, func: any) {
        this._name = name;
        this._func = func;
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