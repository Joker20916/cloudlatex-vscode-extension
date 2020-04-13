import * as fs from 'fs';
import * as vscode from 'vscode';
import { resolve } from 'dns';

type ConfigObj = {
  projectId: string;
  initialized: boolean;
};

export default class Config {

  private filePath: string;
  public obj: ConfigObj;
  constructor() {
    this.filePath = vscode.workspace.rootPath + '/.vswpp.json';
    this.obj = {projectId: '', initialized: false};
  }

  public load() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf-8', (err, content) => {
        if(err) {
          return reject(err);
        }
        try {
          const obj = JSON.parse(content);
          this.obj = obj;
          resolve(obj);
        } catch(err) {
          return reject(err);
        }
      });
    });
  }

  public save() {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.filePath, JSON.stringify(this.obj), (err) => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}