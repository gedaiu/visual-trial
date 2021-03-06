// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import Action from '../src/actions/action';

suite("Action", () => {
    test("It should execute the action", (done) => {
        var action = new Action("name", () => {
            done();
        });

        action.perform();
    });

    test("It should get the action name", () => {
        var executed = false;

        var action = new Action("name", () => {
            executed = true;
        });

        should(action.name).equal("name");
        should(executed).equal(false);
    });

    test("It should raise an event when it's done", (done) => {
        var action = new Action("name", (done) => {
            done();
        });

        action.onFinish(done);
        action.perform();
    });

    test("It should raise an event binded to perform when it's done", (done) => {
        var action = new Action("name", (localDone) => {
            localDone();
        });

        action.perform().onFinish(done);
    });

    test("It should mark it as running", (done) => {
        var action = new Action("name", (localDone) => {
            localDone();
        });

        action.perform().onFinish(() => {
            should(action.isRunning).equal(false);
            done();
        });
        should(action.isRunning).equal(true);
    });
});