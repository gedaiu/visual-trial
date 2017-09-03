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
                return;
            }

            if(line === "END TEST;") {
                this.notify(this.lastResult);
                this.lastResult = null;
                return;
            }

            if(this.lastResult) {
                this.parseProperty(line);
            }
        });
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
                this.lastResult.status = value;
                break;
        }
    }
}

export class TestResult {
    status: string;
    suite: string;
    test: string;
}

