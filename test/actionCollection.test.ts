import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import ActionCollection from '../src/actions/actionCollection';
import Action from '../src/actions/action';

suite("Action collection", () => {

    test("It should execute the action when it's added", (done) => {
        var collection = new ActionCollection();
        collection.push(new Action("name", () => {
            done();
        }));
    });

    test("It should execute the actions in order", (done) => {
        var collection = new ActionCollection();
        var actions = [];

        collection.push(new Action("name 1", (localDone) => {
            actions.push(1);
            localDone();
        }));

        collection.push(new Action("name 2", (localDone) => {
            actions.push(2);
            localDone();
        }));

        collection.push(new Action("name 3", () => {
            should(actions).deepEqual([1, 2]);
            done();
        }));
    });

    test("It should be able to cancel actions", () => {
        var collection = new ActionCollection();
        var cancel = false;

        collection.push(new Action("name", () => { }, () => {
            cancel = true;
        }));

        should(collection.length).equal(1);
        collection.cancel("name");

        should(collection.length).equal(0);
        should(cancel).equal(true);
    });

    test("It should call cancel function for stoped actions", (done) => {
        var collection = new ActionCollection();

        collection.push(new Action("name", () => {
        }));

        collection.push(new Action("cancel this", () => {
        }, () => {
            done();
        }));

        should(collection.length).equal(2);
        collection.cancel("cancel this");
        should(collection.length).equal(1);
    });


    test("It should call the next function when one is canceled", (done) => {
        var collection = new ActionCollection();

        collection.push(new Action("name", () => {
        }));

        collection.push(new Action("other", () => {
            done();
        }));

        collection.cancel("name");
    });
});