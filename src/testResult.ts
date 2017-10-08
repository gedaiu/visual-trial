import { TestLocation } from "./nodes/testCaseTrialNode";

export class TestResult {
    status: TestState;
    suite: string;
    test: string;
    location?: TestLocation = {};
    labels?: Label[] = [];
    error?: TestError;
}

export class TestError {
    location?: TestLocation = {};
    message?: string;
    raw?: string = "";
}

export interface Label {
    name: string;
    value: string;
}

export enum TestState {
    unknown = "unknown",
    success = "success",
    failure = "failure",
    error = "error",
    run = "run",
    wait = "wait",
    cancel = "cancel"
}
