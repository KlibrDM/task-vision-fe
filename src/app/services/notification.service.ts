import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { BehaviorSubject, Observable } from 'rxjs';
import { INotification, INotificationUnreadCount } from '../models/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  GET_NOTIFICATIONS_ENDPOINT = '/notifications';
  GET_NOTIFICATIONS_UNREAD_COUNT_ENDPOINT = '/notifications/unread-count';
  MARK_NOTIFICATIONS_AS_READ_ENDPOINT = '/notifications/mark-as-read';

  unreadCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
  ) { }

  getNotifications(token: string, projectId: string): Observable<INotification[]> {
    return this.http.get<INotification[]>(`${environment.api}${this.GET_NOTIFICATIONS_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getUnreadCount(token: string, projectId: string): Observable<INotificationUnreadCount> {
    return this.http.get<INotificationUnreadCount>(`${environment.api}${this.GET_NOTIFICATIONS_UNREAD_COUNT_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  markNotificationsAsRead(token: string, projectId: string): Observable<INotification[]> {
    return this.http.put<INotification[]>(`${environment.api}${this.MARK_NOTIFICATIONS_AS_READ_ENDPOINT}/${projectId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateUnreadCountOnProjectChange(token: string, projectId: string) {
    this.getUnreadCount(token, projectId).subscribe((res) => {
      this.unreadCount.next(res.count);
    });
  }

  increaseUnreadCount() {
    this.unreadCount.next(this.unreadCount.value + 1);
  }

  resetUnreadCount() {
    this.unreadCount.next(0);
  }
}
