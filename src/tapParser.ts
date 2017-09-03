import * as YAML from "yamljs";

export class TapParser {
    private eventFunction: (result: TestResult) => void;
    private lastResult: TestResult = null;
    private readingYaml: boolean = false;
    private yamlData: string;

    onTestResult(eventFunction: (result: TestResult) => void) {
        this.eventFunction = eventFunction;
    }

    private notify(result: TestResult) {
        if(this.eventFunction) {
            this.eventFunction(result);
        }
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
            if(line == "") {
                this.lastResult = null;
                return;
            }

            if(TestResult.isValidResult(line)) {
                this.readingYaml = false;
                this.lastResult = new TestResult(line);
                this.notify(this.lastResult);
                return;
            }

            if(this.lastResult != null) {
                if(line == "  ---") {
                    this.readingYaml = true;
                    this.yamlData = "";
                    return;
                }
                
                if(this.readingYaml) {
                    this.yamlData += line + "\n";
                    this.lastResult.setYamlData(this.yamlData);
                } else {
                    this.lastResult.addLine(line);
                }

                this.notify(this.lastResult);
            }
        });
    }
}

export class TestResult {
    private static resultValues: Array<string> = [ "ok", "not ok" ];

    private _value: string = "unknown";
    private _name: string;
    private _suite: string;
    private _index: number = NaN;
    private _diagnostics: string = "";
    private _other: Object;

    constructor(private line: string) {
        this.parseResultLine(line);
    }

    public static isValidResult(line: string) {
        return TestResult.resultValues.filter((value) => line.indexOf(value + " ") === 0).length === 1;
    }

    private parseResultLine(line: String) {
        if(this.value != "unknown") {
            throw new Error("There already is a valid result.");
        }

        const value = TestResult.resultValues.filter((value) => line.indexOf(value + " ") === 0);
        if(value.length == 1) {
            this._value = value[0];
            line = line.substr(this._value.length + 1); /// we want to remove the space too
        } else {
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

    addLine(line: string) {
        if(TestResult.isValidResult(line)) {
            this.parseResultLine(line);
            return;
        }

        this._diagnostics += line.substr(2) + "\n";
    }

    setYamlData(data: string) {
        try {
            this._other = YAML.parse(data);
        } catch(err) {
            this._other = {
                message: data
            }
        }
    }

    get diagnostics() {
        return this._diagnostics;
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

    get other(): Object {
        return this._other;
    }
}

