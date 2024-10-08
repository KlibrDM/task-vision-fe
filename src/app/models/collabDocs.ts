import { ProjectRole } from "./project";

export interface ICollabDoc {
  _id: string;
  ownerId: string;
  projectId: string;
  name: string;
  structure_path: string;
  content?: string;
  ai_summary?: string;
  is_folder: boolean;
  roles?: ProjectRole[];
  users?: string[];
  edit_roles?: ProjectRole[];
  edit_users?: string[];
  is_edited_by?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAIDocSummary {
  summary: string;
}

export interface IAIDocSummaryPayload {
  name: string;
  content: string;
  language: string;
}
