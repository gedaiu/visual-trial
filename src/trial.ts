var fs = require('fs');
var path = require('path');
var os = require('os');

import { ChildProcess, spawn } from "child_process";
import * as vscode from 'vscode';
import SubpackagesAction from "./actions/subpackagesAction";
import GetTestsAction from "./actions/getTestsAction";
import RunTestAction from "./actions/runTestAction";
import RunAllTestsAction from "./actions/runAllTestsAction";

export default class Trial {
  private output: vscode.OutputChannel;
  private static version = "0.3.0";

  constructor(private extensionPath: string, private projectRoot: string) {
    this.output = vscode.window.createOutputChannel("Trial");
  }

  get localTrialFolder(): string {
    return path.join(this.extensionPath, "trial-" + Trial.version, "trial");
  }

  get localTrialExecutable(): string {
    var trialPath = path.join(this.extensionPath, "trial-" + Trial.version, "trial");

    if(os.platform().indexOf("win32") != -1) {
      trialPath += ".exe";
    }

    return trialPath;
  }

  private dubExecute(options, workingDir, resolve, reject) {
    this.output.appendLine("> dub " + options.join(" "));

    var proc = spawn("dub", options, { cwd: workingDir });

    proc.stdout.on('data', (data) => {
      this.output.append(data.toString());
    });

    proc.stderr.on('data', (data) => {
      this.output.append(data.toString());
    });

    proc.on('close', (code) => {
      this.output.appendLine(`dub process exited with code ${code}\n\n`);

      if (code != 0) {
        reject(`dub process exited with code ${code}`);
        return;
      }

      resolve();
    });

    proc.on('disconnect', () => {
      this.output.appendLine(`dub process disconnected\n\n`);
      reject(`dub process disconnected`);
    });

    proc.on('error', (err) => {
      this.output.appendLine(`dub process error: ` + err + `\n\n`);
      reject(`dub error: ` + err);
    });
  }

  checkLocalTrial(): Thenable<void> {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(this.localTrialFolder)) {
        this.output.appendLine("Trial v" + Trial.version + " is already downloaded.");
        resolve();
        return;
      }

      let dubOptions = ["fetch", "-v", "trial", "--version", Trial.version, "--cache=local"];
      this.output.appendLine("Downloading Trial v" + Trial.version + " in `" + this.extensionPath + "`");

      this.dubExecute(dubOptions, this.extensionPath, resolve, reject);
    });
  }

  checkLocalExecutable(): Thenable<void> {
    return new Promise((resolve, reject) => {
      var exec = this.localTrialExecutable;

      if (fs.existsSync(exec)) {
        this.output.appendLine("Trial v" + Trial.version + " is already compiled.");
        resolve();
        return;
      }

      let dubOptions = ["build", ":runner"];
      this.output.appendLine("Building Trial v" + Trial.version + " in `" + this.localTrialFolder + "`");

      this.dubExecute(dubOptions, this.localTrialFolder, resolve, reject);
    });
  }

  waitToBeReady(): Thenable<void> {
    return new Promise((resolve, reject) => {
      this.checkLocalTrial().then(() => {
        this.checkLocalExecutable().then(() => {
          resolve();
        }, reject);
      }, reject);
    });
  }

  getSubpackages(callback) : SubpackagesAction {
    let action = new SubpackagesAction("trial", this.projectRoot, callback);

    action.onOutput((text) => {
      this.output.append(text);
    });

    return action;
  }

  getTests(subpackage: string, callback) : GetTestsAction {
    let action = new GetTestsAction("trial", this.projectRoot, subpackage, callback);

    action.onOutput((text) => {
      this.output.append(text);
    });

    return action;
  }

  start(options: Array<string>, done) : ChildProcess {
    this.output.appendLine("> trial " + options.join(' '));
    var proc = spawn("trial", options, { cwd: this.projectRoot });

    proc.stdout.on('data', (data) => {
        this.output.append(data.toString());
    });

    proc.stderr.on('data', (data) => {
        this.output.append(data.toString());
    });

    proc.on('close', (code) => {
        this.output.appendLine(`\ntrial process exited with code ${code}\n\n`);
        if(code != 0) {
            vscode.window.showErrorMessage(`trial process exited with code ${code}`);
        }

        if(done) {
            done();
        }
    });

    proc.on('disconnect', () => {
        this.output.appendLine(`\ntrial process disconnected\n\n`);
        vscode.window.showErrorMessage(`trial process disconnected`);

        if(done) {
            done();
        }
    });

    proc.on('error', (err) => {
        this.output.appendLine(`\ntrial process error: ` + err + `\n\n`);
        vscode.window.showErrorMessage(`trial process error: ` + err);

        if(done) {
            done();
        }
    });

    return proc;
  }

  runTest(subpackage: string, testName: string, callback) : RunTestAction {
    let action = new RunTestAction("trial", this.projectRoot, subpackage, testName, callback);

    action.onOutput((text) => {
      this.output.append(text);
    });

    return action;
  }

  runAllTests(subpackage: string, callback) : RunTestAction {
    let action = new RunAllTestsAction("trial", this.projectRoot, subpackage, callback);

    action.onOutput((text) => {
      this.output.append(text);
    });

    return action;
  }
}