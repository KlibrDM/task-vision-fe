import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { ProjectRole } from '../models/project';
import { IUploadedDoc } from '../models/uploadedDocs';

@Injectable({
  providedIn: 'root',
})
export class DocsService {
  GET_DOCS_ENDPOINT = '/docs';
  UPLOAD_DOCS_ENDPOINT = '/docs';
  CREATE_FOLDER_ENDPOINT = '/docs/folder';
  DOWNLOAD_DOC_ENDPOINT = '/doc/download';
  VIEW_DOC_ENDPOINT = '/doc/view';
  UPDATE_DOC_ACCESS_ENDPOINT = '/doc/access';
  DELETE_DOC_ENDPOINT = '/doc';
  UPLOAD_ITEM_ATTACHMENTS_ENDPOINT = '/item/attachments';
  UPLOAD_ITEM_ATTACHMENTS_BY_CODE_ENDPOINT = '/item/attachments-by-code';
  GET_ITEM_ATTACHMENTS_ENDPOINT = '/item/attachments';

  constructor(
    private http: HttpClient
  ) { }

  getUploadedDocs(token: string, projectId: string, path: string): Observable<IUploadedDoc[]> {
    return this.http.get<IUploadedDoc[]>(`${environment.api}${this.GET_DOCS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        structurePath: path
      }
    });
  }

  createFolder(token: string, projectId: string, path: string, folderName: string): Observable<IUploadedDoc> {
    return this.http.post<IUploadedDoc>(`${environment.api}${this.CREATE_FOLDER_ENDPOINT}/${projectId}`, {
      structurePath: path,
      folderName
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  uploadDocs(token: string, projectId: string, formData: FormData, path: string): Observable<IUploadedDoc[]> {
    return this.http.post<IUploadedDoc[]>(`${environment.api}${this.UPLOAD_DOCS_ENDPOINT}/${projectId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        structurePath: path
      }
    });
  }

  downloadDoc(token: string, projectId: string, docId: string): Observable<Blob> {
    return this.http.get(`${environment.api}${this.DOWNLOAD_DOC_ENDPOINT}/${projectId}/${docId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    });
  }

  viewDoc(projectId: string, docId: string, docName: string): Observable<Blob> {
    return this.http.get(`${environment.api}${this.VIEW_DOC_ENDPOINT}/${projectId}/${docId}/${docName}`, {
      responseType: 'blob'
    });
  }

  updateDocAccess(token: string, projectId: string, docId: string, roles: ProjectRole[], users: string[]): Observable<IUploadedDoc> {
    return this.http.put<IUploadedDoc>(`${environment.api}${this.UPDATE_DOC_ACCESS_ENDPOINT}/${projectId}/${docId}`, {
      roles,
      users
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteDoc(token: string, projectId: string, docId: string): Observable<IUploadedDoc> {
    return this.http.delete<IUploadedDoc>(`${environment.api}${this.DELETE_DOC_ENDPOINT}/${projectId}/${docId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  uploadItemAttachments(token: string, projectId: string, itemId: string, formData: FormData): Observable<IUploadedDoc[]> {
    return this.http.post<IUploadedDoc[]>(`${environment.api}${this.UPLOAD_ITEM_ATTACHMENTS_ENDPOINT}/${projectId}/${itemId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  uploadItemAttachmentsByCode(token: string, projectId: string, itemCode: string, formData: FormData): Observable<IUploadedDoc[]> {
    return this.http.post<IUploadedDoc[]>(`${environment.api}${this.UPLOAD_ITEM_ATTACHMENTS_BY_CODE_ENDPOINT}/${projectId}/${itemCode}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getItemAttachments(token: string, projectId: string, itemId: string): Observable<IUploadedDoc[]> {
    return this.http.get<IUploadedDoc[]>(`${environment.api}${this.GET_ITEM_ATTACHMENTS_ENDPOINT}/${projectId}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
