export enum LogEntities {
  ITEM = "ITEM",
  PROJECT = "PROJECT",
  SPRINT = "SPRINT",
  USER = "USER",
  ORGANIZATION = "ORGANIZATION",
  UPLOADEDDOCS = "UPLOADEDDOCS",
  COLLABDOCS = "COLLABDOCS",
}

export enum LogAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  PUSHED = "PUSHED",
  PULLED = "PULLED",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
}

export enum LogTrigger {
  SYSTEM = "SYSTEM",
  USER = "USER",
}

export interface ILog {
  _id: string;
  projectId?: string;
  affectedEntity: LogEntities;
  affectedEntityId: string;
  affectedEntityName?: string;
  action: LogAction;
  logTrigger: LogTrigger;
  logTriggerId?: string;
  changedField?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILogData {
  count: number;
  logs: ILog[];
}

export interface ILogAdditionalData {
  oldValueArray?: string[][];
  newValueArray?: string[][];
}
