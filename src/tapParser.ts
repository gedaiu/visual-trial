export class TapParser {
    private eventFunction: (result: TestResult) => void;

    onTestResult(eventFunction: (result: TestResult) => void) {
        this.eventFunction = eventFunction;
    }

    setData(data: string | Buffer) {
        if(typeof data === "string" || data instanceof String) {
            this.setString(<string> data);
            return;
        }

        this.setString(data.toString());
    }
        
    setString(data: string) {
        data.split("\n").forEach((line: string) => {
            if(line.indexOf("ok - ") === 0 || line.indexOf("not ok - ") === 0) {
                this.eventFunction(new TestResult(line));
            }
        });
    }
}

export class TestResult {
    private static resultValues: Array<string> = [ "ok", "not ok" ];

    private _value: string;
    private _name: string;
    private _suite: string;
    private _index: number = NaN;

    constructor(private line: string) {
        const value = TestResult.resultValues.filter((value) => line.indexOf(value + " ") === 0);
        if(value.length == 1) {
            this._value = value[0];
            line = line.substr(this._value.length + 1); /// we want to remove the space too
        } else {
            this._value = "unknown";
            line = line.substr(line.indexOf(" ")).trim();
        }

        const firstSpaceIndex = line.indexOf(" ");
        const firstDotIndex = line.indexOf(".");
        this._index = parseInt(line.substr(0, firstSpaceIndex));
        
        if(firstDotIndex > firstSpaceIndex) {
            line = line.substr(firstSpaceIndex).trim();
        }

        var pieces = line.split(".");
        this._name = pieces.reverse()[0];

        pieces.reverse().pop();
        this._suite = pieces.join(".");
    }

    get name(): string {
        return this._name;
    }

    get suite(): string {
        return this._suite;
    }

    get value(): string {
        return this._value;
    }
    
    get index(): number {
        return this._index;
    }
}

