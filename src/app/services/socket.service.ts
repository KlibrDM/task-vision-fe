import { Injectable } from '@angular/core';
import { environment } from "src/environments/environment";
import { Subject } from 'rxjs';
import { IWSData, WS_SERVER_EVENTS } from '../models/ws';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: WebSocket;
  serverMessage: Subject<IWSData> = new Subject<IWSData>();

  constructor() {
    this.socket = new WebSocket(environment.wss);

    // Connection opened
    this.socket.addEventListener('open', () => {
      // eslint-disable-next-line no-console
      console.log('Connected to socket server');
    });

    // Listen for messages
    this.socket.addEventListener('message', (event) => {
      this.serverMessage.next(JSON.parse(event.data));
    });
  }

  private triggerServerEvent(event: string, userId: string, payload: any) {
    this.socket.send(JSON.stringify({
      event,
      userId,
      payload
    }));
  }

  changeActiveProject(userId: string, projectId: string) {
    this.triggerServerEvent(WS_SERVER_EVENTS.ACTIVE_PROJECT_CHANGED, userId, projectId);
  }

  changeActiveCollabDoc(userId: string, docId: string) {
    this.triggerServerEvent(WS_SERVER_EVENTS.ACTIVE_COLLAB_DOC_CHANGED, userId, docId);
  }

  unsetActiveCollabDoc(userId: string) {
    this.triggerServerEvent(WS_SERVER_EVENTS.ACTIVE_COLLAB_DOC_UNSET, userId, '');
  }

  setCollabDocEditedBy(userId: string, docId: string) {
    this.triggerServerEvent(WS_SERVER_EVENTS.ACTIVE_COLLAB_DOC_EDITED_BY, userId, docId);
  }
}
