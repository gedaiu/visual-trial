

export interface TestResult {
    name: string;
    suite: string;
    result: string;
}

export class TapParser {
    private eventFunction: any;

    onTestResult(eventFunction) {
        this.eventFunction = eventFunction;
    }

    setData(data: string | Buffer) {
        if(typeof data === "string" || data instanceof String) {
            this.setString(<string> data);
        }

        this.setString(data.toString());
    }
        
    setString(data: string) {
        data.split("\n").forEach((line: string) => {
            console.log(line);

            if(line.indexOf("ok - ") === 0) {
                line = line.substr(5);
                var pieces = line.split(".");

                var testResult = {
                    name: pieces[pieces.length - 1],
                    suite: pieces.slice(0, pieces.length - 1).join("."),
                    result: "ok"
                };

                this.eventFunction(testResult);
            }
        });
    }
}