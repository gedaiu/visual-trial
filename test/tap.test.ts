// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import TapParser from "../src/tapParser";

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

suite("TAP Protocol", () => {

    test("should find a successful tests", (done) => {
        var parser = new TapParser();

        parser.onTestResult((result) => {
            assert.equal(result.name, "it should be able to compile the settings code");
            assert.equal(result.suite, "trial.settings");
            assert.equal(result.result, "ok");

            done();
        });

        parser.setData(oneSuccessTest);
    });
});