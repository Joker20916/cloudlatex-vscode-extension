import * as whichChrome from 'which-chrome';
import * as fs from 'fs';
import * as vscode from 'vscode';
import Setting from './setting';
import fetch from 'node-fetch';
import {ProjectsUrl, editPageUrlMatch, WebAppApi, LoginSessionKey} from './webAppApi';
import * as puppeteer from 'puppeteer-core';

export default class Browser {
  public browser: any;
  public page: any;
  private remoteDebugPort = 9222;
  private setting: Setting;
  // private CookieFilePath: string;
  constructor(setting: Setting) {
    //this.CookieFilePath = vscode.workspace.rootPath + '/cookie.json';
    this.setting = setting;
  }

  public async launch() {
    let chromePath = whichChrome.Chrome || whichChrome.Chromium;
    console.log(chromePath);
    let chromeArgs = [];
    chromeArgs.push(`--remote-debugging-port=${this.remoteDebugPort}`);
    // chromeArgs.push(`--user-data-dir=/Users/morita/Library/Application\ Support/Google/Chrome/`);
    chromeArgs.push(`--user-data-dir=${vscode.workspace.rootPath}/.vswpp/`);

    const headless = false; //this.setting.obj.initialized;
    console.log('setting', this.setting.obj);

    this.browser = await puppeteer.launch({
      executablePath: chromePath,
      args: chromeArgs,
      headless
    });
    this.page = await this.browser.newPage();

    if(!this.setting.obj.initialized) {
      await this.initialize();
    }

    return await this.getCreditials();

    // set cookie
    /* const cookies = this.loadCookies();
    if(cookies) {
      for (let cookie of cookies) {
        await this.page.setCookie(cookie);
      }
    }*/


    // await this.browser.close();
  }

  private async initialize() {
    await this.page.goto(ProjectsUrl);

    // await until achieve at project page
    while(!this.page.url().match(editPageUrlMatch)) {
      await this.page.waitForNavigation({
        timeout: 0
      });
    }

    // cookies
    // await this.saveCookies();
    /*
    let response = await this.page.evaluate(`
    async () => {
      document.body.style.width = '0';
      return await fetch('https://cloudlatex.io/api/projects/217756/files', {
          method: 'GET',
          credentials: "include"
      });
    };
    `);
    console.log('response1', response);
    console.log('response', response && response.json());
    */
    await new Promise(resolve => setTimeout(resolve, 2000));

    const url = this.page.url();
    const matched = url.match(/projects\/\d+/);
    if(!matched) {
      throw new Error(`Invalid url. Current page is not project url ${url}`);
    }
    this.setting.obj.projectId = matched[0].replace('projects/', '');
    this.setting.save().then(() => {
      console.log('save setting file successfully');
    }).catch(err => {
      console.error(err);
    });
  }

  private async getCreditials() {
    await this.page.goto(ProjectsUrl);
    //await this.page.waitForNavigation({
    //  timeout: 0
    //});
    const csrf: string = await this.page.evaluate(`
      document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    `);
    if(!csrf || typeof csrf !== 'string') {
      throw new Error('csrf can not be got');
    }

    const cookies: Array<{name: string, value: string}> = await this.page.cookies();
    const loginSessionCookies = cookies.filter(cookie => cookie.name === LoginSessionKey);
    if(!loginSessionCookies.length) {
      throw new Error('Login session cookie is not found');
    }
    const loginSession = loginSessionCookies[0].value;
    return {csrf, loginSession};
  }

/*
  private async saveCookies() {
    const cookies = await this.page.cookies();
    fs.writeFileSync(this.CookieFilePath, JSON.stringify(cookies));
  }

  private loadCookies() {
    try {
      const cookieJson = fs.readFileSync(this.CookieFilePath, 'utf-8');
      return JSON.parse(cookieJson);
    } catch(err) {
      return null;
    }
  }
  */
}
