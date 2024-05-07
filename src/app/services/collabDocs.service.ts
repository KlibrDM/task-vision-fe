import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { ProjectRole } from '../models/project';
import { IAIDocSummary, IAIDocSummaryPayload, ICollabDoc } from '../models/collabDocs';

@Injectable({
  providedIn: 'root',
})
export class CollabDocsService {
  GET_DOCS_ENDPOINT = '/collab-docs';
  GET_DOC_ENDPOINT = '/collab-doc';
  CREATE_DOC_ENDPOINT = '/collab-docs';
  CREATE_FOLDER_ENDPOINT = '/collab-docs/folder';
  UPDATE_DOC_ACCESS_ENDPOINT = '/collab-doc/access';
  DELETE_DOC_ENDPOINT = '/collab-doc';
  UPDATE_DOC_ENDPOINT = '/collab-doc';
  GET_DOC_AI_SUMMARY_ENDPOINT = '/collab-doc/ai-summary';

  constructor(
    private http: HttpClient
  ) { }

  getCollabDocs(token: string, projectId: string, path: string): Observable<ICollabDoc[]> {
    return this.http.get<ICollabDoc[]>(`${environment.api}${this.GET_DOCS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        structurePath: path
      }
    });
  }

  getCollabDoc(token: string, projectId: string, docId: string): Observable<ICollabDoc> {
    return this.http.get<ICollabDoc>(`${environment.api}${this.GET_DOC_ENDPOINT}/${projectId}/${docId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createFolder(token: string, projectId: string, path: string, folderName: string): Observable<ICollabDoc> {
    return this.http.post<ICollabDoc>(`${environment.api}${this.CREATE_FOLDER_ENDPOINT}/${projectId}`, {
      structurePath: path,
      folderName
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createDoc(token: string, projectId: string, path: string, docName: string): Observable<ICollabDoc> {
    return this.http.post<ICollabDoc>(`${environment.api}${this.CREATE_DOC_ENDPOINT}/${projectId}`, {
      structurePath: path,
      docName
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    });
  }

  updateDocAccess(token: string, projectId: string, docId: string, roles: ProjectRole[], users: string[], editRoles: ProjectRole[], editUsers: string[]): Observable<ICollabDoc> {
    return this.http.put<ICollabDoc>(`${environment.api}${this.UPDATE_DOC_ACCESS_ENDPOINT}/${projectId}/${docId}`, {
      users,
      roles,
      editUsers,
      editRoles,
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteDoc(token: string, projectId: string, docId: string): Observable<ICollabDoc> {
    return this.http.delete<ICollabDoc>(`${environment.api}${this.DELETE_DOC_ENDPOINT}/${projectId}/${docId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateDoc(token: string, projectId: string, docId: string, name: string, content: string, aiSummary?: string): Observable<ICollabDoc> {
    return this.http.put<ICollabDoc>(`${environment.api}${this.UPDATE_DOC_ENDPOINT}/${projectId}/${docId}`, {
      name,
      content,
      aiSummary
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getDocAISummary(token: string, data: IAIDocSummaryPayload): Observable<IAIDocSummary> {
    return this.http.post<IAIDocSummary>(`${environment.api}${this.GET_DOC_AI_SUMMARY_ENDPOINT}`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
