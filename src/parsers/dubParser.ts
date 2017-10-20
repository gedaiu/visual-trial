
export enum DubState {
    compile,
    link,
    run
}

export class DubParser {
    state: DubState = DubState.compile;
    compileOutput: string = "";
    linkOutput: string = "";
    rest: string = "";

    setData(data: string | Buffer) {
        if(typeof data === "string" || data instanceof String) {
            this.setString(<string> data);
            return;
        }

        this.setString(data.toString());
    }

    setString(data: string) {
        data = this.rest + data;

        if(!data.endsWith("\n")) {
            var pos = data.lastIndexOf("\n");
            this.rest = data.substr(pos + 1);
            data = data.substr(0, pos);
        }

        data.split("\n").forEach((line) => {
            if(this.state == DubState.compile && this.hasLinkTokens(line)) {
                this.state = DubState.link;
            }

            if(this.state == DubState.link && this.hasRunTokens(line)) {
                this.state = DubState.run;
            }

            if(this.state == DubState.compile) {
                this.compileOutput += line + "\n";
            }

            if(this.state == DubState.link) {
                this.linkOutput += line + "\n";
            }
        });
    }

    get hasCompilerErrors() : boolean {
        if(this.state != DubState.compile) {
            return false;
        }

        var errorLines = this.compileOutput.split("\n").filter(a => a.toLowerCase().trim().indexOf(" error:") != -1);

        return errorLines.length > 0;
    }

    get hasLinkerErrors() : boolean {
        if(this.state != DubState.link) {
            return false;
        }

        var errorLines = this.linkOutput.split("\n").filter(a => a.toLowerCase().trim().indexOf("error:") == 0);

        return errorLines.length > 0;
    }

    hasLinkTokens(line: string) : boolean {
        return line == "Linking...";
    }

    hasRunTokens(line: string) : boolean {
        return line.indexOf("Running .") == 0;
    }
}
