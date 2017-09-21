import { TestResult, TestState, TestError } from "./testResult";

export class TrialParser {
    private eventFunction: (result: TestResult) => void;
    private lastResult: TestResult = null;

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
            if(line === "BEGIN TEST;") {
                this.lastResult = new TestResult();
                this.lastResult.status = TestState.run;
                return;
            }

            if(line === "END TEST;") {
                this.notify(this.lastResult);
                this.lastResult = null;
                return;
            }

            if(this.lastResult) {
                if(this.lastResult.error && this.lastResult.error.raw) {
                    this.lastResult.error.raw += line + "\n";
                } else {
                    this.parseProperty(line);
                }
            }
        });

        if(this.lastResult != null && this.lastResult.suite && this.lastResult.test && this.lastResult.status) {
            this.notify(this.lastResult);
        }
    }

    private parseProperty(line: string) {
        var pieces = line.split(":");
        var property = pieces[0];

        pieces.shift();
        var value = pieces.join(":");


        switch(property) {
            case "suite":
                this.lastResult.suite = value;
                break;

            case "test":
                this.lastResult.test = value;
                break;

            case "status":
                if(value == "success" ) {
                    this.lastResult.status = TestState.success;
                } else {
                    this.lastResult.status = TestState.failure;
                    this.lastResult.error = new TestError();
                    this.lastResult.error.location = {};
                }

                break;

            case "file":
                this.lastResult.location.fileName = value;
                break;

            case "errorFile":
                this.lastResult.error.location.fileName = value;
                break;

            case "message":
                this.lastResult.error.message = value;
                break;

            case "line":
                this.lastResult.location.line = parseInt(value);
                break;

            case "labels":
                try {
                    this.lastResult.labels = JSON.parse(value);
                } catch(e) {}
                break;

            case "errorLine":
                this.lastResult.error.location.line = parseInt(value);
                break;

            case "error":
                this.lastResult.error.raw = value + "\n";
                break;
        }
    }
}
