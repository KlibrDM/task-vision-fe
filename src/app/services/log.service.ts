import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { ILogData, LogEntities } from '../models/log';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  GET_LOGS_ENDPOINT = '/logs';
  GET_PROJECT_LOGS_ENDPOINT = '/logs/project';

  constructor(
    private http: HttpClient
  ) { }

  getLogs(token: string, entityId: string, offset?: number, limit?: number, field?: string): Observable<ILogData> {
    const params = {}
    if (offset !== undefined) {
      Object.assign(params, { offset });
    }
    if (limit !== undefined) {
      Object.assign(params, { limit });
    }
    if (field) {
      Object.assign(params, { changedField: field });
    }

    return this.http.get<ILogData>(`${environment.api}${this.GET_LOGS_ENDPOINT}/${entityId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
  }

  getProjectLogs(token: string, projectId: string, offset?: number, limit?: number, entities?: LogEntities[]): Observable<ILogData> {
    const params = {}
    if (offset !== undefined) {
      Object.assign(params, { offset });
    }
    if (limit !== undefined) {
      Object.assign(params, { limit });
    }
    if (entities) {
      Object.assign(params, { entities });
    }

    return this.http.get<ILogData>(`${environment.api}${this.GET_PROJECT_LOGS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
  }
}
