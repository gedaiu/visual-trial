export class TestResult {
    status: TestState;
    suite: string;
    test: string;
    file: string;
    line: number;
    labels: Label[] = [];

    errorFile: string;
    errorLine: number;
    message: string;
    error: string;
}

export interface Label {
    name: string;
    value: string;
}

export enum TestState {
    unknown = "unknown",
    success = "success",
    failure = "failure",
    run = "run",
    wait = "wait"
}
