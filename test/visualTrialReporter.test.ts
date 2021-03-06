// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { TrialParser } from "../src/parsers/trialParser";
import { TestResult } from "../src/testResult";

suite("Visual Trial reporter protocol", () => {

    test("It should send a run status after the test and suite was set", (done) => {
        var parser = new TrialParser();

        parser.onTestResult((result: TestResult) => {
            should(result.status).equal("run");
            should(result.suite).equal("trial.discovery.testclass.OtherTestSuite");
            should(result.test).equal("Some other name");

            done();
        });

        parser.setString("BEGIN TEST;\n" +
        "suite:trial.discovery.testclass.OtherTestSuite\n" +
        "test:Some other name\n");
    });

    test("It should parse a success test result", (done) => {
        var parser = new TrialParser();

        parser.onTestResult((result: TestResult) => {
            should(result.status).equal("success");
            should(result.suite).equal("trial.discovery.testclass.OtherTestSuite");
            should(result.test).equal("Some other name");
            should(result.location.fileName).equal("base.d");
            should(result.location.line).equal(199);
            should(result.labels.length).equal(2);
            should(result.labels[0].name).equal("name");
            should(result.labels[0].value).equal("value");

            done();
        });

        parser.setString("BEGIN TEST;\n" +
        "suite:trial.discovery.testclass.OtherTestSuite\n" +
        "test:Some other name\n" +
        "status:success\n" +
        "file:base.d\n" +
        "line:199\n" +
        "labels:[{ \"name\": \"name\", \"value\": \"value\" }, { \"name\": \"name1\", \"value\": \"value1\" }]\n" +
        "END TEST;");
    });

    test("It should append the extra lines to the output property", (done) => {
        var parser = new TrialParser();

        parser.onTestResult((result: TestResult) => {
            should(result.output).equal("1\n2\n3\n4\n");
            done();
        });

        parser.setString("BEGIN TEST;\n" +
        "suite:trial.discovery.testclass.OtherTestSuite\n" +
        "test:Some other name\n" +
        "1\n" +
        "2\n" +
        "status:success\n" +
        "3\n" +
        "file:base.d\n" +
        "line:199\n" +
        "labels:[{ \"name\": \"name\", \"value\": \"value\" }, { \"name\": \"name1\", \"value\": \"value1\" }]\n" +
        "4\n" +
        "END TEST;");
    });

    test("It should parse a failed test result", (done) => {
        var parser = new TrialParser();

        parser.onTestResult((result: TestResult) => {
            should(result.suite).equal("trial.discovery.testclass.OtherTestSuite");
            should(result.test).equal("Some other name");
            should(result.status).equal("failure");
            should(result.error.location.fileName).equal("unknown");
            should(result.error.location.line).equal(0);
            should(result.error.message).equal("message");
            should(result.error.raw).equal("fluentasserts.core.base.TestException@unknown(0): message\n\n" +
                "    Extra:a\n" +
                "  Missing:b\n\n");

            done();
        });

        parser.setString("BEGIN TEST;\n" +
        "suite:trial.discovery.testclass.OtherTestSuite\n" +
        "test:Some other name\n" +
        "status:failure\n" +
        "errorFile:unknown\n" +
        "errorLine:0\n" +
        "message:message\n" +
        "error:fluentasserts.core.base.TestException@unknown(0): message\n\n" +
        "    Extra:a\n" +
        "  Missing:b\n\n" +
        "END TEST;\n");
    });
});