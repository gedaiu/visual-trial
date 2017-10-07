// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { TestDiagnostics } from '../src/testDiagnostics';
import { TestResult, TestError } from '../src/testResult';
import DescribeFileAction from '../src/actions/describeFileAction';

suite("DescribeFileAction", () => {
    test("It should get the right suite path", () => {
        var action = new DescribeFileAction("", "", "", null);
        var data = {
            a: {
                b: {
                    c: []
                }
            }
        };
        should(action.getSuite(data)).equal("a.b.c");
    });
});