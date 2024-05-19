import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { IUser, IUserOrganizationPartner, IUserRegisterPayload } from '../models/user';
import { IOrganization } from '../models/organization';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  ORGANIZATION_REGISTER_ENDPOINT = '/organization/register';
  GET_ORGANIZATION_ENDPOINT = '/organization';
  GET_ORGANIZATION_USERS_ENDPOINT = '/organization/users';
  UPDATE_ORGANIZATION_ENDPOINT = '/organization';
  CREATE_ORGANIZATION_USER_ENDPOINT = '/organization/create-user';
  UPDATE_ORGANIZATION_USER_ROLE_ENDPOINT = '/organization/update-user-role';
  DELETE_ORGANIZATION_USER_ENDPOINT = '/organization/delete-user';

  constructor(
    private http: HttpClient
  ) { }

  registerOrganization(userWithOrg: IUserRegisterPayload & { organization_name: string }): Observable<IUser> {
    return this.http.post<IUser>(`${environment.api}${this.ORGANIZATION_REGISTER_ENDPOINT}`, userWithOrg);
  }

  getOrganization(token: string): Observable<IOrganization> {
    return this.http.get<IOrganization>(`${environment.api}${this.GET_ORGANIZATION_ENDPOINT}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getOrganizationUsers(token: string, orgId: string): Observable<IUserOrganizationPartner[]> {
    return this.http.get<IUserOrganizationPartner[]>(`${environment.api}${this.GET_ORGANIZATION_USERS_ENDPOINT}/${orgId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateOrganization(token: string, orgId: string, org: Partial<IOrganization>): Observable<IOrganization> {
    return this.http.put<IOrganization>(`${environment.api}${this.UPDATE_ORGANIZATION_ENDPOINT}/${orgId}`, org, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createOrgUser(token: string, orgId: string, user: IUserRegisterPayload): Observable<IOrganization> {
    return this.http.post<IOrganization>(`${environment.api}${this.CREATE_ORGANIZATION_USER_ENDPOINT}/${orgId}`, user, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateOrgUserRole(token: string, orgId: string, userId: string, role: string): Observable<IOrganization> {
    return this.http.put<IOrganization>(`${environment.api}${this.UPDATE_ORGANIZATION_USER_ROLE_ENDPOINT}/${orgId}/${userId}`, { role }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteOrgUser(token: string, orgId: string, userId: string): Observable<IOrganization> {
    return this.http.delete<IOrganization>(`${environment.api}${this.DELETE_ORGANIZATION_USER_ENDPOINT}/${orgId}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
