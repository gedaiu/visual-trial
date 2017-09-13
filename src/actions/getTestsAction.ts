import { Action } from "../action";

export default class GetTestsAction extends Action {

    constructor(command: string, workingDir: string, subpackage: string, callback) {
        super("get tests for " + subpackage, (done) => {
            var process = this.command(command, ["describe", subpackage], workingDir, done);

            let rawDescription = "";

            process.stdout.on('data', (data) => {
                rawDescription += data;
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    return callback(`Trial existed with code ${code}`);
                }

                try {
                    let description = JSON.parse(rawDescription);
                    callback(null, description);
                } catch (e) {
                    callback(`Can not parse the description`);
                }
            });
        });
    }
}