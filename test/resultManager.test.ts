// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { TestDiagnostics } from '../src/testDiagnostics';
import { TestResult, TestError } from '../src/testResult';
import ResultManager from '../src/resultManager';

suite("ResultManager", () => {
    test("It should cache the tests", () => {
        var manager = new ResultManager();

        manager.cache("", {
            "gol": [{
                "suiteName": "gol",
                "name": "__unittestL51_106()",
                "labels": [],
                "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
            }]
        });

        should(manager.getResult("", "gol", "__unittestL51_106()").test).equal("__unittestL51_106()");
        should(manager.getResult("", "gol", "__unittestL51_106()").suite).equal("gol");
        should(manager.getResult("", "gol", "__unittestL51_106()").location.fileName).equal("/Users/gedaiu/workspace/GOL/source/gol.d", );
        should(manager.getResult("", "gol", "__unittestL51_106()").location.line).equal(51);
    });

    test("It should update the cached tests", () => {
        var manager = new ResultManager();

        manager.cache("", {
            "gol": {
                "module1": [{
                    "suiteName": "gol.module1",
                    "name": "__unittestL51_106()",
                    "labels": [],
                    "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
                }],
                "module2": [{
                    "status": "success",
                    "suiteName": "gol.module2",
                    "name": "__unittestL51_106()",
                    "labels": [],
                    "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
                }]
            }
        });

        should(manager.getResult("", "gol.module1", "__unittestL51_106()").test).equal("__unittestL51_106()");
        should(manager.getResult("", "gol.module1", "__unittestL51_106()").suite).equal("gol.module1");
        should(manager.getResult("", "gol.module1", "__unittestL51_106()").location.fileName).equal("/Users/gedaiu/workspace/GOL/source/gol.d", );
        should(manager.getResult("", "gol.module1", "__unittestL51_106()").location.line).equal(51);

        should(manager.getResult("", "gol.module2", "__unittestL51_106()").test).equal("__unittestL51_106()");
        should(manager.getResult("", "gol.module2", "__unittestL51_106()").suite).equal("gol.module2");
        should(manager.getResult("", "gol.module2", "__unittestL51_106()").location.fileName).equal("/Users/gedaiu/workspace/GOL/source/gol.d", );
        should(manager.getResult("", "gol.module2", "__unittestL51_106()").location.line).equal(51);

        manager.updateCache("", {
            "gol": {
                "module2": [{
                    "suiteName": "gol.module2",
                    "name": "__unittestL51_108()",
                    "labels": [],
                    "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
                }]
            }
        });

        should(manager.getResult("", "gol.module2", "__unittestL51_106()")).equal(null);
        should(manager.getResult("", "gol.module2", "__unittestL51_108()").test).equal("__unittestL51_108()");
    });


    test("It should update the cached tests and keep the status if the test name does not change", () => {
        var manager = new ResultManager();

        manager.cache("", {
            "gol": {
                "module2": [{
                    "status": "success",
                    "suiteName": "gol.module2",
                    "name": "__unittestL51_108()",
                    "labels": [],
                    "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
                }]
            }
        });

        manager.updateCache("", {
            "gol": {
                "module2": [{
                    "suiteName": "gol.module2",
                    "name": "__unittestL51_108()",
                    "labels": [],
                    "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
                }]
            }
        });

        let result = manager.getResult("", "gol.module2", "__unittestL51_108()")

        should(result.test).equal("__unittestL51_108()");
        should(result.status).equal("success");
    });

    test("It should find tests by filename", () => {
        var manager = new ResultManager();

        manager.cache("", {
            "gol2": [{
                "suiteName": "gol2",
                "name": "first test",
                "labels": [],
                "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol2.d", "line": 51 }
            }],

            "gol3": [{
                "suiteName": "gol3",
                "name": "some test",
                "labels": [],
                "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol3.d", "line": 51 }
            }]
        });

        var results: Map<string, TestResult[]> = manager.getRestultsByFile("/Users/gedaiu/workspace/GOL/source/gol3.d");

        should(results.has("")).equal(true);
        should(results.get("").length).equal(1);
        should(results.get("")[0].test).equal("some test");
    });
});