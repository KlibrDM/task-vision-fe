import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { IAIItemSummary, IAIItemSummaryPayload, IItem, IItemPayload, IItemRelation } from '../models/item';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  GET_ITEMS_ENDPOINT = '/items';
  GET_ITEM_ENDPOINT = '/item';
  CREATE_ITEM_ENDPOINT = '/item';
  UPDATE_ITEM_ENDPOINT = '/item';
  DELETE_ITEM_ENDPOINT = '/item';
  ITEM_LOG_HOURS_ENDPOINT = '/item/log-hours';
  ITEM_ADD_COMMNENT_ENDPOINT = '/item/comment';
  ITEM_DELETE_COMMENT_ENDPOINT = '/item/comment';
  ITEM_ADD_RELATION_ENDPOINT = '/item/relation';
  ITEM_DELETE_RELATION_ENDPOINT = '/item/relation';
  GET_ITEM_AI_SUMMARY_ENDPOINT = '/item/ai-summary';

  constructor(
    private http: HttpClient
  ) { }

  getItems(token: string, projectId: string): Observable<IItem[]> {
    return this.http.get<IItem[]>(`${environment.api}${this.GET_ITEMS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getItem(token: string, projectId: string, itemId: string): Observable<IItem> {
    return this.http.get<IItem>(`${environment.api}${this.GET_ITEM_ENDPOINT}/${projectId}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createItem(token: string, item: IItemPayload): Observable<IItem> {
    return this.http.post<IItem>(`${environment.api}${this.CREATE_ITEM_ENDPOINT}`, item, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateItem(token: string, projectId: string, itemId: string, item: IItemPayload): Observable<IItem> {
    return this.http.put<IItem>(`${environment.api}${this.UPDATE_ITEM_ENDPOINT}/${projectId}/${itemId}`, item, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteItem(token: string, projectId: string, itemId: string): Observable<IItem> {
    return this.http.delete<IItem>(`${environment.api}${this.DELETE_ITEM_ENDPOINT}/${projectId}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  logHours(token: string, projectId: string, itemId: string, hours: number): Observable<IItem> {
    return this.http.post<IItem>(`${environment.api}${this.ITEM_LOG_HOURS_ENDPOINT}/${projectId}/${itemId}`, { hours }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  addComment(token: string, projectId: string, itemId: string, comment: string): Observable<IItem> {
    return this.http.post<IItem>(`${environment.api}${this.ITEM_ADD_COMMNENT_ENDPOINT}/${projectId}/${itemId}`, { comment }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteComment(token: string, projectId: string, itemId: string, commentId: string): Observable<IItem> {
    return this.http.delete<IItem>(`${environment.api}${this.ITEM_DELETE_COMMENT_ENDPOINT}/${projectId}/${itemId}/${commentId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  addRelation(token: string, projectId: string, itemId: string, relation: IItemRelation): Observable<IItem> {
    return this.http.post<IItem>(`${environment.api}${this.ITEM_ADD_RELATION_ENDPOINT}/${projectId}/${itemId}`, relation, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  deleteRelation(token: string, projectId: string, itemId: string, relation: IItemRelation): Observable<IItem> {
    return this.http.delete<IItem>(`${environment.api}${this.ITEM_DELETE_RELATION_ENDPOINT}/${projectId}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: relation
    });
  }

  getItemAISummary(token: string, data: IAIItemSummaryPayload): Observable<IAIItemSummary> {
    return this.http.post<IAIItemSummary>(`${environment.api}${this.GET_ITEM_AI_SUMMARY_ENDPOINT}`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
