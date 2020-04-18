import AppFileSystem from "./appFileSystem";
import { ClFile } from "./types";
import * as fs from 'fs';
import * as path from 'path';
import WebAppApi from './webAppApi';

export default class ClFileSystem extends AppFileSystem<ClFile> {
  constructor(rootPath: string, private api: WebAppApi, public readonly watcherFileFilter: (relativePath: string) => boolean) {
    super(rootPath);
  }

  protected _download(file: ClFile) {
    if(file.is_folder) {
    } else {
      if(!file.file_url) {
        throw Error(`file irl is not found!! ${file.full_path}`);
      }
      return this.api.downloadFile(file.file_url);
    }
    return Promise.reject();
  }

  protected async _upload(relativePath: string, option?: any): Promise<string>{
    const stream = fs.createReadStream(path.join(this.rootPath, relativePath));
    let relativeDir = path.dirname(relativePath);
    if (relativeDir.length > 1 && relativeDir[0] === '/') {
      relativeDir = relativeDir.slice(1);
    }
    const result = await this.api.uploadFile(stream, relativeDir);
    await this.loadFiles();
    return result.file.id;;
  }

  protected _updateRemote(id: number): Promise<any> {
    const file = this.files[id];
    let content;
    return fs.promises.readFile(
      path.join(this.rootPath, file.full_path), 'utf-8'
    ).catch(err => {
      this.emit('local-reading-error', file.full_path);
      return Promise.reject(file.full_path);
    }).then(content => {
      return this.api.updateFile(id, {
        content,
        revision: file.revision
      });
    }).then(result => {
      file.revision = result.revision;
      return file;
    });
  }

  protected async _deleteRemote(id: number) {
    const result = await this.api.deleteFile(id);
    await this.loadFiles();
    return result;
  }

  public async loadFiles(): Promise<unknown> {
    const res = await this.api?.loadFiles();
    this.files = {};
    const materialFiles: Array<ClFile> = res.material_files;
    console.log(materialFiles, res);

    for (let idx in materialFiles) {
      this.files[materialFiles[idx].id] = materialFiles[idx];
    }
    return;
  }

  protected _getRelativePathFromFile(file: ClFile): string {
    return file.full_path;
  }

}