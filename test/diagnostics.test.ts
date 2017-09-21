// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { TestDiagnostics } from '../src/testDiagnostics';
import { TestResult, TestError } from '../src/testResult';

suite("TestDiagnostics", () => {
    test("It should not add a result twice", () => {
        var diagnostics = new TestDiagnostics();

        var result = new TestResult();
        result.error = new TestError();
        result.error.location = {
            fileName: "someFile.d",
            line: 12
        };

        diagnostics.add(result);
        diagnostics.add(result);

        should(diagnostics.problems("someFile.d")).equal(1);
    });
});