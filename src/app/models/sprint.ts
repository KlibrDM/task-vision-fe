export enum SprintType {
  SPRINT = "SPRINT",
  CONTINUOUS = "CONTINUOUS",
}

export interface ISprint {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  type: SprintType;
  start_date: Date;
  end_date: Date;
  is_completed?: boolean;
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISprintPayload {
  projectId: string;
  name: string;
  description?: string;
  type: SprintType;
  start_date: Date;
  end_date: Date;
}
