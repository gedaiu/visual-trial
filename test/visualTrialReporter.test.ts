// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { TrialParser, TestResult } from "../src/trialParser";

suite("Visual Trial reporter protocol", () => {

    test("It should parse a success test result", (done) => {
        var parser = new TrialParser();

        parser.onTestResult((result: TestResult) => {
            should(result.status).equal("success");
            should(result.suite).equal("trial.discovery.testclass.OtherTestSuite");
            should(result.test).equal("Some other name");

            done();
        });

        parser.setString("BEGIN TEST;\n" + 
        "suite:trial.discovery.testclass.OtherTestSuite\n" + 
        "test:Some other name\n" + 
        "status:success\n" + 
        "END TEST;");
    });
});