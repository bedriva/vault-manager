import {bootstrap} from 'angular2/platform/browser';
import {Component, Pipe, PipeTransform} from 'angular2/core';
import {NgFor} from 'angular2/common';

import {JSONP_PROVIDERS}  from 'angular2/http';

import {Injectable}     from 'angular2/core';
import {Http, Response} from 'angular2/http';
import {Observable}     from 'rxjs/Observable';
import {Headers, RequestOptions, URLSearchParams} from 'angular2/http';

import {Input} from 'angular2/core';

import {ROUTER_PROVIDERS} from 'angular2/router';
import { HTTP_PROVIDERS } from 'angular2/http';
import 'rxjs/Rx';

import {provide}           from 'angular2/core';
import {LocationStrategy,
        HashLocationStrategy} from 'angular2/router';

var PATHS_CACHE = [];
var MAX_LEVEL = false;

function vaultFolder():string {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/vault/';
}

@Injectable()
export class VaultService {
  constructor (private http: Http) {}

  getItems (path, token): Observable<any> {

    var headers = new Headers();
    headers.append('X-Vault-Token', token);

    return this.http.get('http://127.0.0.1:8200/v1/secret' + path + '?list=true', {headers: headers})
                    .map(this.extractData)
                    .catch(this.handleError);
  }
  getItem (path, token): Observable<any> {

    var headers = new Headers();
    headers.append('X-Vault-Token', token);

    return this.http.get('http://127.0.0.1:8200/v1/secret' + path + '', {headers: headers})
                    .map(this.extractDataSingle)
                    .catch(this.handleError);
  }
  private extractData(res: Response) {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    let body = res.json();

    return body.data || { };
  }
  static getIcon(key) {
    var icons = {
      host: 'storage',
      user: 'person',
      pass: 'fingerprint',
      key: 'vpn key',
      port: 'dialpad',
      email: 'email',
      url: 'link',
    };

    if (icons[key]) {
      return icons[key];
    } else {
      return '<i class="material-icons">radio_button_unchecked</i>';
    }
  }
  private extractDataSingle(res: Response) {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    let body = res.json();
    let r = [];

    for (let i in body.data) {
      r.push({key: i, data: body.data[i], icon: VaultService.getIcon(i)});
    }

    return r || { };
  }
  private handleError (error: any) {
    // In a real world app, we might send the error to remote logging infrastructure
    let errMsg = error.message || 'Server error';
    console.error(errMsg); // log to console instead
    return Observable.throw(errMsg);
  }

}

export class VaultFolder {
  path = '';
  name = '';
  folder:boolean = true;
  children = [];

  constructor (pathAsString:string)  {
    this.setPath(pathAsString);
    this.setName(pathAsString);
    this.setFolder(pathAsString);
  }

  // Returns full path (except for last element)
  private dirname(pathAsString) {
    return require('path').dirname(pathAsString);
  }

  // Returns last element in path
  private basename(pathAsString) {
    return require('path').basename(pathAsString);
  }

  private normalize(pathAsString) {
    return require('path').normalize(pathAsString);
  }

  private isFolder(pathAsString) {
    return pathAsString.endsWith('/');
  }

  private setPath (pathAsString:string)  {
    this.path = this.dirname(pathAsString);
  }

  private setName (pathAsString:string)  {
    this.name = this.basename(pathAsString);
  }

  private setFolder (pathAsString:string)  {
    this.folder = this.isFolder(pathAsString);
  }

  setChildren(data:any) {
    this.children = [];

     if (data.length) {
       for (let i in data) {
         this.children.push(new VaultFolder( this.normalize(this.path + '/' + this.name + '/' + data[i]) ));
       }
     }
  }

  fullPath() {
    return this.normalize(this.path + '/' + this.name);
  }

}

@Component({
  selector: 'app',
  template: `

  <form action="#">
    <div class="mdl-textfield mdl-js-textfield">
      <b class="mdl" for="sample">Token:</b>
      <input [(ngModel)]="token" (keyup)="validate()" class="mdl-textfield__input" type="text" id="sample1">
    </div>
  </form>

  <div *ngIf="tree" class="path-col path-col-root">
    <span (click)="loadChildren(tree)">{{tree.name}} (root)</span>
    <div class="path-col path-col-1" *ngFor="#child1 of tree.children">
      <i class="material-icons">{{child1.folder ? 'folder' : 'description'}}</i> <span (click)="loadChildren(child1)">{{child1.name}}</span>
      <div class="path-col path-col-2" *ngFor="#child2 of child1.children">
        <i class="material-icons">{{child2.folder ? 'folder' : 'description'}}</i> <span (click)="loadChildren(child2)">{{child2.name}}</span>
        <div class="path-col path-col-3" *ngFor="#child3 of child2.children">
          <i class="material-icons">{{child3.folder ? 'folder' : 'description'}}</i> <span (click)="loadChildren(child3)">{{child3.name}}</span>
          <div class="path-col path-col-4" *ngFor="#child4 of child3.children">
            <i class="material-icons">{{child4.folder ? 'folder' : 'description'}}</i> <span (click)="loadChildren(child4)">{{child4.name}}</span>
            <div class="path-col path-col-5" *ngFor="#child5 of child4.children">
              <i class="material-icons">{{child5.folder ? 'folder' : 'description'}}</i> <span (click)="loadChildren(child5)">{{child5.name}}</span>
              <div class="path-col path-col-6" *ngFor="#child6 of child5.children">
                <i class="material-icons">{{child6.folder ? 'folder' : 'description'}}</i> <span (click)="loadChildren(child6)">{{child6.name}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="demo-card-wide mdl-card mdl-shadow--2dp" *ngIf="singleData">
    <div class="mdl-card__title">
      <h2 class="mdl-card__title-text">Data</h2>
    </div>
    <div class="mdl-card__supporting-text">

      <ul class="mdl-list">
        <li class="mdl-list__item mdl-list__item--two-line" *ngFor="#item of singleData">
          <span class="mdl-list__item-primary-content">
            <i class="material-icons mdl-list__item-avatar">{{item.icon}}</i>
            <span>{{item.data}}</span>
            <span class="mdl-list__item-sub-title">{{item.key}}</span>
          </span>
        </li>
      </ul>

    </div>
    <div class="mdl-card__actions mdl-card--border">
      <a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">
        Edit
      </a>
      <a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">
        More
      </a>
    </div>
    <div class="mdl-card__menu">
      <button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">
        <i class="material-icons">copy</i>
      </button>
    </div>
  </div>

  <hr />

  <table class="mdl-data-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Namn</th>
        <th>Typ</th>
        <th>Sökväg</th>
      </tr>
    </thead>
    <tbody *ngIf="logs">
      <tr *ngFor="#log of logs">
        <td>{{log.time | date:'d/M H:mm'}}</td>
        <td>{{log.auth.display_name}}</td>
        <td class="op-{{log.request.operation}}">{{log.request.operation}}</td>
        <td>{{log.request.path}}</td>
      </tr>
    </tbody>
  </table>
  `,
  providers:[JSONP_PROVIDERS, VaultService]
})
export class App {

  constructor (private _vaultService: VaultService) {}
  tree:VaultFolder = new VaultFolder('/');
  singleData:any;
  errorMessage:any = '';
  folders:any[] = [];
  token: string;
  logs: any;
  ngOnInit() { this.loadToken(); this.getItems(this.tree); this.getLog(); }

  getLog() {
    var data = require('fs').readFileSync(vaultFolder() + 'audit.log', {encoding: 'utf8'});
    data = '{"data": [' + data.replace(new RegExp("\n", 'g'), ',') + '{}]}';
    data = JSON.parse(data);

    var newLogs = [];
    data.data.forEach(function(entry) {
      if (entry.type === 'request') {
        entry.time = new Date(entry.time);
        newLogs.push(entry);
      }
    });

    this.logs = newLogs;
  }

  getItems(currentFolder:VaultFolder, saveToken:boolean = false) {
    this._vaultService.getItems(currentFolder.fullPath(), this.token)
                     .subscribe(
                       data => {
                         currentFolder.setChildren(data.keys);

                         console.log(this.tree);

                         if (saveToken) {
                           require('fs').writeFileSync(vaultFolder() + '.vault-manager-token', this.token);
                         }

                       },
                       error =>  this.errorMessage = <any>error);
  }

  getItem(currentFolder:VaultFolder) {
    this._vaultService.getItem(currentFolder.fullPath(), this.token)
                     .subscribe(
                       data => {
                         this.singleData = data;
                       },
                       error =>  this.errorMessage = <any>error);
  }

  loadChildren(folder:VaultFolder) {

    if (folder.folder) {
      this.getItems(folder);
    } else {
      this.getItem(folder);
    }

  }

  validate() {
    this.getItems(this.tree, true);
  }

  loadToken() {
    if (!require('fs').existsSync(vaultFolder() + '.vault-manager-token')) {
      require('fs').writeFileSync(vaultFolder() + '.vault-manager-token', '');
    }
    this.token = require('fs').readFileSync(vaultFolder() + '.vault-manager-token', {encoding: 'utf8'});
  }

}


bootstrap(App, [ROUTER_PROVIDERS, HTTP_PROVIDERS/*, provide(LocationStrategy,
         {useClass: HashLocationStrategy})*/]);
