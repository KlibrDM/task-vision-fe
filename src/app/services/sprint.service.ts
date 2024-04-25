import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { ISprint, ISprintPayload } from '../models/sprint';
import { IProject } from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class SprintService {
  GET_SPRINTS_ENDPOINT = '/sprints';
  CREATE_SPRINT_ENDPOINT = '/sprint';
  UPDATE_SPRINT_ENDPOINT = '/sprint';
  DELETE_SPRINT_ENDPOINT = '/sprint';
  COMPLETE_SPRINT_ENDPOINT = '/sprint/complete';
  ACTIVATE_SPRINT_ENDPOINT = '/sprint/activate';

  constructor(
    private http: HttpClient
  ) { }

  getSprints(token: string, projectId: string): Observable<ISprint[]> {
    return this.http.get<ISprint[]>(`${environment.api}${this.GET_SPRINTS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createSprint(token: string, sprint: ISprintPayload): Observable<ISprint> {
    return this.http.post<ISprint>(`${environment.api}${this.CREATE_SPRINT_ENDPOINT}`, sprint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateSprint(token: string, projectId: string, sprintId: string, sprint: ISprintPayload): Observable<ISprint> {
    return this.http.put<ISprint>(`${environment.api}${this.UPDATE_SPRINT_ENDPOINT}/${projectId}/${sprintId}`, sprint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  completeSprint(token: string, projectId: string, sprintId: string): Observable<IProject> {
    return this.http.post<IProject>(`${environment.api}${this.COMPLETE_SPRINT_ENDPOINT}/${projectId}/${sprintId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  activateSprint(token: string, projectId: string, sprintId: string): Observable<IProject> {
    return this.http.post<IProject>(`${environment.api}${this.ACTIVATE_SPRINT_ENDPOINT}/${projectId}/${sprintId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteSprint(token: string, projectId: string, sprintId: string): Observable<ISprint> {
    return this.http.delete<ISprint>(`${environment.api}${this.DELETE_SPRINT_ENDPOINT}/${projectId}/${sprintId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
