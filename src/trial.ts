var fs = require('fs');
var path = require('path');
var os = require('os');

import { ChildProcess, spawn } from "child_process";
import * as vscode from 'vscode';

export default class Trial {
  private output: vscode.OutputChannel;
  private static version = "0.3.0";

  constructor(private extensionPath: string) {
    this.output = vscode.window.createOutputChannel("Trial setup");
  }

  get localTrialFolder(): string {
    return path.join(this.extensionPath, "trial-" + Trial.version, "trial");
  }

  get localTrialExecutable(): string {
    var trialPath = path.join(this.extensionPath, "trial-" + Trial.version, "trial");

    if(os.platform().indexOf("win") != -1) {
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
      if (fs.existsSync(this.localTrialExecutable)) {
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
}