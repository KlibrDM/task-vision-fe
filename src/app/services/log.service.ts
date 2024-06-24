import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { ILog, ILogData, LogAction, LogEntities } from '../models/log';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  GET_LOGS_ENDPOINT = '/logs';
  GET_PROJECT_LOGS_ENDPOINT = '/logs/project';
  GET_USER_LOGS_ENDPOINT = '/logs/user';
  GET_FILTERED_LOGS_ENDPOINT = '/logs/filtered';

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

  getUserLogs(token: string, userId: string, offset?: number, limit?: number, entities?: LogEntities[]): Observable<ILogData> {
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

    return this.http.get<ILogData>(`${environment.api}${this.GET_USER_LOGS_ENDPOINT}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
  }

  getFilteredLogs(
    token: string,
    projectId: string,
    affectedEntities?: LogEntities[],
    fields?: [string],
    actions?: LogAction[],
    startDate?: string,
    endDate?: string
  ): Observable<ILog[]> {
    const params = {}
    if (affectedEntities?.length) {
      Object.assign(params, { affectedEntities });
    }
    if (fields?.length) {
      Object.assign(params, { changedFields: fields });
    }
    if (actions?.length) {
      Object.assign(params, { actions });
    }
    if (startDate) {
      Object.assign(params, { startDate });
    }
    if (endDate) {
      Object.assign(params, { endDate });
    }

    return this.http.get<ILog[]>(`${environment.api}${this.GET_FILTERED_LOGS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
  }
}
