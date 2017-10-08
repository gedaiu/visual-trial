import { TestResult, TestState } from "./testResult";
import { EventEmitter, Event } from "vscode";

function flatten(obj, callback) {
    if (Array.isArray(obj)) {
        obj.forEach((a) => {
            const result: TestResult = {
                status: a.status || TestState.unknown,
                suite: a.suiteName,
                test: a.name,
                location: a.location,
                labels: a.labels
            };

            callback(result);
        });

        return;
    }

    Object.keys(obj).forEach((a) => {
        flatten(obj[a], callback);
    });
}

export default class ResultManager {
    private results: Map<string, Map<string, Map<string, TestResult>>> = new Map<string, Map<string, Map<string, TestResult>>>();
    private _onResult: EventEmitter<any> = new EventEmitter<any>();
    readonly onResult: Event<any> = this._onResult.event;

    private notify(subpackage: string, suite: string, test: string) {
        this._onResult.fire([subpackage, suite, test]);
    }

    cache(subpackage: string, data: object) {
        if (this.results.has(subpackage)) {
            this.results.delete(subpackage);
        }

        const _this = this;
        flatten(data,(result) => {
            _this.add(subpackage, result);
        });
    }

    updateCache(subpackage: string, data: object) {
        const _this = this;
        var oldStatus = {};
        var cleared = {};

        flatten(data,(result) => {
            if(!cleared[result.suite]) {
                cleared[result.suite] = true;
                if(this.results.has(subpackage) && this.results.get(subpackage).has(result.suite)) {
                    this.results.get(subpackage).get(result.suite).forEach((result) => {
                        oldStatus[result.test] = result.status;
                    });

                    this.results.get(subpackage).delete(result.suite);
                }
            }

            if(!result.status || result.status == TestState.unknown) {
                if(oldStatus[result.test]) {
                    result.status = oldStatus[result.test];
                } else if(result.test.indexOf("__unittestL") == 0 && result.test != "__unittestL") {
                    var oldTestName = Object.keys(oldStatus).filter(name => name.indexOf(result.test) == 0);

                    if(oldTestName.length == 1) {
                        result.status = oldStatus[oldTestName[0]];
                    }
                }
            }

            _this.add(subpackage, result);
        });
    }

    add(subpackage: string, result: TestResult) {
        if(subpackage == undefined) {
            return;
        }

        if (!this.results.has(subpackage)) {
            this.results.set(subpackage, new Map<string, Map<string, TestResult>>());
        }

        if (!this.results.get(subpackage).has(result.suite)) {
            this.results.get(subpackage).set(result.suite, new Map<string, TestResult>());
        }

        this.results.get(subpackage).get(result.suite).set(result.test, result);
        this.notify(subpackage, result.suite, result.test);
    }

    getRestultsByFile(filename: string) : Map<string, TestResult[]> {
        var filteredResults = new Map<string, TestResult[]>();

        this.results.forEach((suites, subpackage) => {
            filteredResults.set(subpackage, []);

            suites.forEach((results, suiteName) => {
                results.forEach((result, testName) => {
                    if(result.location.fileName == filename) {
                        filteredResults.get(subpackage).push(result);
                    }
                });
            });
        });

        return filteredResults;
    }

    getResult(subpackage: string, suite: string, testName: string): TestResult | null {
        if (!this.results.has(subpackage)) {
            return null;
        }

        if (!this.results.get(subpackage).has(suite)) {
            return null;
        }

        if (!this.results.get(subpackage).get(suite).get(testName)) {
            return null;
        }

        return this.results.get(subpackage).get(suite).get(testName);
    }

    getSuites(subpackage): string[] {
        if (!this.results.has(subpackage)) {
            return [];
        }

        return Array.from(this.results.get(subpackage).keys());
    }

    getTestNames(subpackage: string, suite: string) {
        if (!this.results.has(subpackage)) {
            return [];
        }

        if (!this.results.get(subpackage).has(suite)) {
            return [];
        }

        return Array.from(this.results.get(subpackage).get(suite).keys());
    }

    setTestState(subpackage: string, suite: string, test: string, func: (result: TestResult) => void) {
        if (!this.results.has(subpackage) ||
            !this.results.get(subpackage).has(suite) ||
            !this.results.get(subpackage).get(suite).has(test)) {
            const result = {
                status: TestState.unknown,
                suite: suite,
                test: test
            };

            this.add(subpackage, result);
        }

        func(this.results.get(subpackage).get(suite).get(test));

        this.notify(subpackage, suite, test);
    }

    setPackageState(subpackage: string, func: (result: TestResult) => void) {
        if (!this.results.has(subpackage)) {
            return;
        }

        this.results.get(subpackage).forEach((suite) => {
            suite.forEach((result) => {
                func(result);
                this.notify(subpackage, result.suite, result.test);
            });
        });
    }

    removeWaiting(subpackage?: string) {
        if(!subpackage) {
            this.results.forEach((value, key) => {
                this.removeWaiting(key);
            });

            return;
        }

        if (this.results.has(subpackage)) {
            this.results.get(subpackage).forEach((suite) => {
                suite.forEach((result, name) => {
                    if (result.status === TestState.wait) {
                        suite.delete(name);
                    }
                });
            });
        }
    }
}