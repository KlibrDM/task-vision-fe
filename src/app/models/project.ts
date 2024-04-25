export enum ProjectRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  BOARDMASTER = "BOARDMASTER",
  QA = "QA",
  MEMBER = "MEMBER",
}

export enum OwnerTypes {
  USER = "USER",
  ORGANIZATION = "ORGANIZATION",
}

export interface IProjectSettings {
  use_sprints: boolean;
  sprint_length: number;
  force_epic_link: boolean;
  auto_show_linked_requirements: boolean;
  enable_multi_sprint_items: boolean;
  enable_hour_tracking: boolean;
  enable_reactivity: boolean;
  auto_move_to_qa: boolean;
}

export interface IProjectUser {
  userId: string;
  role: ProjectRole;
  is_active: boolean;
}

export interface IProject {
  _id: string;
  ownerId: string;
  users: IProjectUser[];
  currentSprintId?: string;
  name: string;
  code: string;
  description: string;
  owner_type: OwnerTypes;
  board_columns: string[];
  qa_column?: string;
  blocked_column?: string;
  done_column?: string;
  settings: IProjectSettings;
  start_date: Date;
  end_date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProjectPayload {
  name: string;
  code: string;
  description: string;
  owner_type: OwnerTypes;
  board_columns: string[];
  qa_column?: string;
  blocked_column?: string;
  done_column?: string;
  settings: IProjectSettings;
  start_date: Date;
  end_date: Date;
}
