

export default class Action {
    private _name: string;
    private _func: any;
    private _event: any;

    constructor(name: string, func: any) {
        this._name = name;
        this._func = func;
    }

    perform() {
        setImmediate(() => {
            this._func(() => {
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
}