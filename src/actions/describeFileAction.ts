import { Action } from "../action";

export default class DescribeFileAction extends Action {
    constructor(command: string, workingDir: string, fileName: string, callback) {
        super("get tests inside " + fileName, (done) => {
            var process = this.command(command, ["describe", fileName], workingDir, done);

            let rawDescription = "";

            process.stdout.on('data', (data) => {
                rawDescription += data;
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    return callback(`Trial failed with code ${code}`);
                }

                try {
                    let description = JSON.parse(rawDescription);
                    callback(null, this.getSuite(description), description);
                } catch (e) {
                    callback(`Can not parse the description`);
                }
            });
        });
    }

    getSuite(description) : string {
        var suite = "";
        var glue = "";

        while(typeof description === 'object') {
            var keys = Object.keys(description);

            if(keys.length == 1) {
                suite += glue + keys[0];
                glue = ".";
                description = description[keys[0]];
            } else {
                break;
            }
        }

        return suite;
    }
}
