import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { BehaviorSubject, Observable, from } from 'rxjs';
import { StorageService } from './storage.service';
import { IProject, IProjectPayload } from '../models/project';
import { IUserPartner } from '../models/user';
import { SocketService } from './socket.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  GET_PROJECTS_ENDPOINT = '/projects';
  GET_PROJECT_ENDPOINT = '/project';
  GET_PROJECT_USERS_ENDPOINT = '/project/users';
  CREATE_PROJECT_ENDPOINT = '/project';
  UPDATE_PROJECT_ENDPOINT = '/project';
  ADD_USER_TO_PROJECT_ENDPOINT = '/project/add-user';
  REMOVE_USER_FROM_PROJECT_ENDPOINT = '/project/remove-user';
  UPDATE_USER_ROLE_ENDPOINT = '/project/update-user-role';

  activeProjectId: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
  currentProject: BehaviorSubject<IProject | undefined> = new BehaviorSubject<IProject | undefined>(undefined);

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private socketSerive: SocketService,
    private notificationService: NotificationService,
  ) { }

  getProjects(token: string): Observable<IProject[]> {
    return this.http.get<IProject[]>(`${environment.api}${this.GET_PROJECTS_ENDPOINT}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getProject(token: string, projectId: string): Observable<IProject> {
    return this.http.get<IProject>(`${environment.api}${this.GET_PROJECT_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getProjectUsers(token: string, projectId: string): Observable<IUserPartner[]> {
    return this.http.get<IUserPartner[]>(`${environment.api}${this.GET_PROJECT_USERS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createProject(token: string, project: IProjectPayload): Observable<IProject> {
    return this.http.post<IProject>(`${environment.api}${this.CREATE_PROJECT_ENDPOINT}`, project, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateProject(token: string, projectId: string, project: Partial<IProjectPayload>): Observable<IProject> {
    return this.http.put<IProject>(`${environment.api}${this.UPDATE_PROJECT_ENDPOINT}/${projectId}`, project, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  addUserToProject(token: string, projectId: string, email: string): Observable<IProject> {
    return this.http.put<IProject>(`${environment.api}${this.ADD_USER_TO_PROJECT_ENDPOINT}/${projectId}`, { email }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  removeUserFromProject(token: string, projectId: string, userId: string): Observable<IProject> {
    return this.http.delete<IProject>(`${environment.api}${this.REMOVE_USER_FROM_PROJECT_ENDPOINT}/${projectId}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateUserRole(token: string, projectId: string, userId: string, role: string): Observable<IProject> {
    return this.http.put<IProject>(`${environment.api}${this.UPDATE_USER_ROLE_ENDPOINT}/${projectId}/${userId}`, { role }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getActiveProjectId(): Observable<string | undefined> {
    return from(this.storage.get('activeProjectId'));
  }

  setActiveProjectId(token: string, id: string) {
    this.activeProjectId.next(id);
    this.storage.set('activeProjectId', id);

    // Get unread notifications count for the new active project
    this.notificationService.updateUnreadCountOnProjectChange(token, id);
  }

  setCurrentProject(project: IProject, userId: string) {
    this.currentProject.next(project);

    // Send message to server with current active project
    this.socketSerive.changeActiveProject(userId, project._id);
  }
}
