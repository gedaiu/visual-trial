// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { TapParser, TestResult } from "../src/tapParser";

var oneSuccessTest = `Building package trial:lifecycle in /Users/gedaiu/workspace/trial/
Generate main file: /Users/gedaiu/workspace/trial/generated.d
Looking for files inside \`trial:lifecycle\`
Selecting tests conaining \`it should be able to compile the settings code\`.
Building package trial:lifecycle in /Users/gedaiu/workspace/trial/
Generating test runner configuration 'trial-lifecycle-test-library' for 'library' (library).
Performing "unittest" build using dmd for x86_64.
ddmp 0.0.1-0.dev.2: target for configuration "library" is up to date.
fluent-asserts:core 0.6.6: target for configuration "library" is up to date.
fluent-asserts 0.6.6: target for configuration "library" is up to date.
trial:lifecycle 0.3.1+commit.16.g2f5e957: building configuration "trial-lifecycle-test-library"...
Linking...
To force a rebuild of up-to-date targets, run again with --force.
Running ./trial-lifecycle-test-library
TAP version 13
1..1
ok - trial.settings.it should be able to compile the settings code
`

var oneFailedTest = `Building package trial:lifecycle in /Users/gedaiu/workspace/trial/
Generate main file: /Users/gedaiu/workspace/trial/generated.d
Looking for files inside \`trial:lifecycle\`
Selecting tests conaining \`it should be able to compile the settings code\`.
Building package trial:lifecycle in /Users/gedaiu/workspace/trial/
Generating test runner configuration 'trial-lifecycle-test-library' for 'library' (library).
Performing "unittest" build using dmd for x86_64.
ddmp 0.0.1-0.dev.2: target for configuration "library" is up to date.
fluent-asserts:core 0.6.6: target for configuration "library" is up to date.
fluent-asserts 0.6.6: target for configuration "library" is up to date.
trial:lifecycle 0.3.1+commit.16.g2f5e957: building configuration "trial-lifecycle-test-library"...
Linking...
To force a rebuild of up-to-date targets, run again with --force.
Running ./trial-lifecycle-test-library
TAP version 13
1..1
not ok - trial.discovery.unit.It should find the line of this test
# core.exception.RangeError: Range violation
#
# --------------------
# lifecycle/trial/discovery/unit.d:426
# --------------------
#    421:
#    422:       testDiscovery.addModule!(__FILE__, "trial.discovery.unit");
#    423:
#    424:       testDiscovery.testCases.keys.should.contain("trial.discovery.unit");
#    425:
# >  426:       auto r = testDiscovery.testCases["trial.dwiscovery.unit"].values.filter!(a => a.name == "It should find the line of this test");
#    427:
#    428:       r.empty.should.equal(false).because("the location should be present");
#    429:       r.front.location.fileName.should.endWith("unit.d");
#    430:       r.front.location.line.should.equal(line - 1);
#    431: }
# --------------------
#
# Stack trace:
# -------------------
# ...
# 4   0x000000010eb98b22 _d_arrayboundsp at trial-lifecycle-test-library + 110
# 5   0x000000010eaba3bd void trial.discovery.unit.__unittestL418_93() at trial-lifecycle-test-library + 313
# ...
#
  ---
  message: 'core.exception.RangeError: Range violation'
  severity: failure
  location:
    fileName: 'lifecycle/trial/discovery/unit.d'
    line: 426
`

suite("TAP Protocol", () => {

    test("It should parse a success test result", () => {
        var result = new TestResult("ok - trial.settings.it should be able to compile the settings code");

        should(result.value).equal("ok");
        should(result.suite).equal("trial.settings");
        should(result.name).equal("it should be able to compile the settings code");
    });

    test("It should parse a failed test result", () => {
        var result = new TestResult("not ok - trial.settings.it should be able to compile the settings code");

        should(result.value).equal("not ok");
        should(result.suite).equal("trial.settings");
        should(result.name).equal("it should be able to compile the settings code");
    });

    test("It should parse a success test result with the test index", () => {
        var result = new TestResult("ok 1020 trial.settings.it should be able to compile the settings code");

        should(result.value).equal("ok");
        should(result.suite).equal("trial.settings");
        should(result.name).equal("it should be able to compile the settings code");
        should(result.index).equal(1020);
    });

    test("It should parse a success test result without the test index", () => {
        var result = new TestResult("ok trial.settings.it should be able to compile the settings code");

        should(result.value).equal("ok");
        should(result.suite).equal("trial.settings");
        should(result.name).equal("it should be able to compile the settings code");
    });

    test("It should parse a success test result without a suite", () => {
        var result = new TestResult("ok it should be able to compile the settings code");

        should(result.value).equal("ok");
        should(result.suite).equal("");
        should(result.name).equal("it should be able to compile the settings code");
    });

    test("It should parse a test with an unknown result", () => {
        var result = new TestResult("okish trial.settings.it should be able to compile the settings code");

        should(result.value).equal("unknown");
        should(result.suite).equal("trial.settings");
        should(result.name).equal("it should be able to compile the settings code");
    });

    test("It should add the details", () => {
        var result = new TestResult("");

        result.addLine("# core.exception.RangeError: Range violation");
        result.addLine("# ");
        result.addLine("# --------------------");
        
        should(result.diagnostics).equal("core.exception.RangeError: Range violation\n\n--------------------\n");
    });

    test("Adding a valid result should set the right fields", () => {
        var result = new TestResult("");

        result.addLine("ok it should be able to compile the settings code");
        
        should(result.value).equal("ok");
        should(result.suite).equal("");
        should(result.name).equal("it should be able to compile the settings code");
        should(result.diagnostics).equal("");
    });

    test("It should throw on adding a valid result twice", (done) => {
        var result = new TestResult("ok it should be able to compile the settings code");

        try {
            result.addLine("ok it should be able to compile the settings code");
        } catch(err) {
            done();
        }
    });

    test("It should parse yaml data", () => {
        var result = new TestResult("");
        result.setYamlData("  message: 'core.exception.RangeError: Range violation'\n" +
                           "  severity: failure\n" +
                           "  location:\n" + 
                           "    fileName: 'lifecycle/trial/discovery/unit.d'\n" + 
                           "    line: 426\n");

        should(result.other).have.keys('message', 'severity', 'location');
        should(result.other["message"]).equal('core.exception.RangeError: Range violation');
        should(result.other["severity"]).equal('failure');

        should(result.other["location"]).have.keys('fileName', 'line');
        should(result.other["location"]['fileName']).equal("lifecycle/trial/discovery/unit.d");
        should(result.other["location"]['line']).equal(426);
    });

    test("It should not parse invalid yaml data", () => {
        var result = new TestResult("");
        result.setYamlData("  some invalid line\n" +
                           " huh?\n" +
                           "  location:\n" + 
                           "    fileName: 'lifecycle/trial/discovery/unit.d'\n" + 
                           "    line: 426");

        should(result.other).have.keys('message');
        should(result.other["message"]).equal("  some invalid line\n huh?\n  location:\n    fileName: \'lifecycle/trial/discovery/unit.d\'\n    line: 426");
    });

    test("It should parse an empty line", () => {
        var result = new TestResult("");

        should(result.value).equal("unknown");
        should(result.suite).equal("");
        should(result.name).equal("");
    });

    test("should find a successful test", (done) => {
        var parser = new TapParser();

        parser.onTestResult((result) => {
            should(result.name).equal("it should be able to compile the settings code");
            should(result.suite).equal("trial.settings");
            should(result.value).equal("ok");

            done();
        });

        parser.setData(oneSuccessTest);
    });

    test("should find a failed test", (done) => {
        var parser = new TapParser();

        parser.onTestResult((result) => {
            should(result.name).equal("It should find the line of this test");
            should(result.suite).equal("trial.discovery.unit");
            should(result.value).equal("not ok");

            done();
        });

        parser.setData(oneFailedTest);
    });
});