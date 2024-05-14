export enum EventType {
  SPRINT_START = "SPRINT_START",
  SPRINT_END = "SPRINT_END",
  ADDED_TO_SPRINT = "ADDED_TO_SPRINT",
  REMOVED_FROM_SPRINT = "REMOVED_FROM_SPRINT",
  ESTIMATE_UPDATED = "ESTIMATE_UPDATED",
  COMPLEXITY_UPDATED = "COMPLEXITY_UPDATED",
  ITEM_COMPLETED = "ITEM_COMPLETED",
}

export interface IChartDataItem {
  itemId: string;
  complexity?: number;
  old_complexity?: number;
  estimate?: number;
  old_estimate?: number;
}

export interface IChartData {
  _id: string;
  projectId: string;
  items: IChartDataItem[];
  sprintId?: string[];
  event_type: EventType;
  createdAt?: Date;
  updatedAt?: Date;
}
