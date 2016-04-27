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

var CURRENT_PATH = [];
var MAX_LEVEL = false;

@Injectable()
export class VaultService {
  constructor (private http: Http) {}

  getItems (token): Observable<any> {

    var headers = new Headers();
    headers.append('X-Vault-Token', token);

    return this.http.get('http://127.0.0.1:8200/v1/secret' + (CURRENT_PATH ? '/' + CURRENT_PATH.join('/') : '') + '/?list=true', {headers: headers})
                    .map(this.extractData)
                    .catch(this.handleError);
  }
  getItem (token, fullpath): Observable<any> {

    var headers = new Headers();
    headers.append('X-Vault-Token', token);

    return this.http.get('http://127.0.0.1:8200/v1/secret' + (fullpath ? '/' + fullpath.join('/') : '') + '', {headers: headers})
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
  private extractDataSingle(res: Response) {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    let body = res.json();
    let r = [];

    for (let i in body.data) {
      r.push({key: i, data: body.data[i]});
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

@Component({
  selector: 'app',
  template: `

  <form action="#">
    <div class="mdl-textfield mdl-js-textfield">
      <input [(ngModel)]="token" (keyup)="validate()" class="mdl-textfield__input" type="text" id="sample1">
      <label class="mdl-textfield__label" for="sample1">Token...</label>
    </div>
  </form>

  <table class="mdl-data-table">
    <thead>
      <tr>
        <th>Sökväg</th>
      </tr>
    </thead>
    <tbody *ngIf="data">
      <tr *ngFor="#item of data.keys">
        <td style="cursor:pointer;"><span *ngFor="#folder of folders" (click)="goToPath(item)">{{folder}}/</span><span (click)="goToPath(item)">{{item}}</span></td>
      </tr>
    </tbody>
  </table>

  <div class="demo-card-wide mdl-card mdl-shadow--2dp" *ngIf="singleData">
    <div class="mdl-card__title">
      <h2 class="mdl-card__title-text">Data</h2>
    </div>
    <div class="mdl-card__supporting-text">
      <table class="mdl-data-table">
        <thead>
          <tr>
            <th>Nyckel</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody *ngIf="data">
          <tr *ngFor="#item of singleData">
            <td>{{item.key}}</td>
            <td>{{item.data}}</td>
          </tr>
        </tbody>
      </table>
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
  data:any;
  singleData:any;
  errorMessage:any = '';
  folders:any[] = [];
  token: string;
  logs: any;
  ngOnInit() { this.loadToken(); this.getItems(); this.getLog(); }

  getLog() {
    var data = require('fs').readFileSync('~/vault/audit.log', {encoding: 'utf8'});
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

  getItems(saveToken:boolean = false) {
    this.folders = CURRENT_PATH;

    this._vaultService.getItems(this.token)
                     .subscribe(
                       data => {
                         this.data = data ;
                         require('fs').writeFileSync('~/vault/.vault-manager-token', this.token);
                       },
                       error =>  this.errorMessage = <any>error);
  }

  getItem(fullpath) {
    this.folders = CURRENT_PATH;

    MAX_LEVEL = true;

    this._vaultService.getItem(this.token, fullpath)
                     .subscribe(
                       data => this.singleData = data,
                       error =>  this.errorMessage = <any>error);
  }

  goToPath(path) {

    if (path.indexOf('/') !== -1) {
      CURRENT_PATH.push(path.replace('/', ''));
      this.getItems();
    } else {
      if (!MAX_LEVEL) {
        let fullpath = CURRENT_PATH;
        fullpath.push(path.replace('/', ''));

        this.getItem(fullpath);
      }
    }

  }

  validate() {
    this.getItems(true);
  }

  loadToken() {
    if (!require('fs').existsSync('~/vault/.vault-manager-token')) {
      require('fs').writeFileSync('~/vault/.vault-manager-token', '');
    }
    this.token = require('fs').readFileSync('~/vault/.vault-manager-token', {encoding: 'utf8'});
  }

}


bootstrap(App, [ROUTER_PROVIDERS, HTTP_PROVIDERS/*, provide(LocationStrategy,
         {useClass: HashLocationStrategy})*/]);
