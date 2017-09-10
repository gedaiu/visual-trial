export class TestResult {
    status: TestState;
    suite: string;
    test: string;

    file: string;
    line: number;
    message: string;
    error: string;
}

export enum TestState {
    unknown = "unknown",
    success = "success",
    failure = "failure",
    run = "run",
    wait = "wait"
}
