import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { IUser, IUserLoginPayload, IUserRegisterPayload } from '../models/user';
import { environment } from "src/environments/environment";
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  USER_LOGIN_ENDPOINT = '/user/login';
  USER_LOGOUT_ENDPOINT = '/user/logout';
  USER_REGISTER_ENDPOINT = '/user/register';
  USER_UPDATE_ENDPOINT = '/user';
  USER_CHANGE_PASSWORD_ENDPOINT = '/user/change-password';

  currentUser: BehaviorSubject<IUser | undefined> = new BehaviorSubject<IUser | undefined>(undefined);

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private projectService: ProjectService,
  ) {
    this.storage.get('user').then((user) => {
      if (user) {
        this.currentUser.next(user);
      }
    });
  }

  whoAmI(token: string): Observable<IUser> {
    return this.http.get<IUser>(`${environment.api}/who-am-i`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  loginUser(user: IUserLoginPayload) {
    return this.http.post<IUser>(`${environment.api}${this.USER_LOGIN_ENDPOINT}`, user);
  }

  registerUser(user: IUserRegisterPayload) {
    return this.http.post<IUser>(`${environment.api}${this.USER_REGISTER_ENDPOINT}`, user);
  }

  logout(token: string) {
    this.currentUser.next(undefined);
    this.projectService.unsetActiveProjectId();
    this.storage.remove('user');
    return this.http.post<void>(`${environment.api}${this.USER_LOGOUT_ENDPOINT}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  localLogout() {
    this.currentUser.next(undefined);
    this.projectService.unsetActiveProjectId();
    this.storage.remove('user');
  }

  setCurrentUser(user: IUser) {
    this.storage.set('user', user);
    if (user.active_projectId) {
      this.storage.set('activeProjectId', user.active_projectId);
    }
    this.currentUser.next(user);
  }

  updateUser(token: string, payload: Partial<IUser>) {
    return this.http.put<IUser>(`${environment.api}${this.USER_UPDATE_ENDPOINT}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  changePassword(token: string, payload: { currentPassword: string, newPassword: string }) {
    return this.http.put<IUser>(`${environment.api}${this.USER_CHANGE_PASSWORD_ENDPOINT}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
