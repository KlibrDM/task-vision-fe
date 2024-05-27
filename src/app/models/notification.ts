export enum NotificationType {
  MENTION = "MENTION",
  COMMENT = "COMMENT",
  ASSIGNMENT = "ASSIGNMENT",
  SPRINT_START = "SPRINT_START",
  SPRINT_COMPLETE = "SPRINT_COMPLETE",
  ITEM = "ITEM",
}

export interface INotification {
  _id: string;
  projectId: string;
  userId: string;
  triggerId?: string;
  entityId?: string;
  entity_name?: string;
  notification_type: NotificationType;
  is_read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationUnreadCount {
  count: number;
}
