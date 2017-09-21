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
                "labels": [  ],
                "location": { "fileName": "/Users/gedaiu/workspace/GOL/source/gol.d", "line": 51 }
            }]});

        should(manager.getResult("", "gol", "__unittestL51_106()").test).equal("__unittestL51_106()");
        should(manager.getResult("", "gol", "__unittestL51_106()").suite).equal("gol");
        should(manager.getResult("", "gol", "__unittestL51_106()").location.fileName).equal("/Users/gedaiu/workspace/GOL/source/gol.d",);
        should(manager.getResult("", "gol", "__unittestL51_106()").location.line).equal(51);
    });
});