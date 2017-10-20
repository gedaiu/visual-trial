// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as should from 'should';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { DubParser, DubState } from "../src/parsers/dubParser";

suite("Dub parsers", () => {

    test("It should detect compiler errors", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n" +
        "web/vibe/web/rest.d(398,1): Error: no identifier for declarator unittes \n" +
        "web/vibe/web/rest.d(398,1): Error: declaration expected, not {\n" +
        "web/vibe/web/rest.d(421,2): Error: unrecognized declaration\n");

        should(parser.hasCompilerErrors).equal(true);
        should(parser.hasLinkerErrors).equal(false);
    });

    test("It should detect compiler errors", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n" +
        "web/vibe/web/rest.d(398,1): Err");
        
        parser.setString("or: no identifier for declarator unittes\n");

        should(parser.hasCompilerErrors).equal(true);
        should(parser.hasLinkerErrors).equal(false);
    });

    test("It should detect when there are no compiler errors", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n");

        should(parser.hasCompilerErrors).equal(false);
        should(parser.hasLinkerErrors).equal(false);
    });

    test("It should detect when there are no linker errors", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n" +
        "Linking...\n");

        should(parser.hasCompilerErrors).equal(false);
        should(parser.hasLinkerErrors).equal(false);
    });

    test("It should detect linker errors", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n" +
        "Linking...\n" +
        "duplicate symbol __Dmain in:\n" +
        "    .dub/build/trial-root-unittest-cov-posix.osx-x86_64-dmd_2076-D9F008AB0014C0223EBB4DAFC985E4AA/trial-root.o\n" +
        "    web/.dub/build/library-unittest-cov-posix.osx-x86_64-dmd_2076-98C41C82FC5003592330D2DB223518BC/libvibe-d_web.a(trial_web.o)\n" +
        "ld: 2 duplicate symbols for architecture x86_64\n" +
        "clang: error: linker command failed with exit code 1 (use -v to see invocation)\n" +
        "Error: linker exited with status 1\n");

        should(parser.hasCompilerErrors).equal(false);
        should(parser.hasLinkerErrors).equal(true);
    });

    test("It should detect when there are no linker errors", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n" +
        "Linking...\n");

        should(parser.hasCompilerErrors).equal(false);
        should(parser.hasLinkerErrors).equal(false);
    });

    test("It should when the app started", () => {
        var parser = new DubParser();

        parser.setString("Generate main file: /Users/gedaiu/workspace/vibe.d/trial_root.d\n" +
        "Looking for files inside `vibe-d`\n" +
        "We will embed the `trial:lifecycle` code inside the project.\n" +
        "Performing \"unittest-cov\" build using dmd for x86_64.\n" +
        "vibe-d:mail 0.8.2-alpha.2+commit.1.gb3f5d2a3: building configuration \"library\"...\n" +
        "Linking...\n" +
        "Running ./trial-root\n");

        should(parser.hasCompilerErrors).equal(false);
        should(parser.hasLinkerErrors).equal(false);
        should(parser.state).equal(DubState.run);
    });

});