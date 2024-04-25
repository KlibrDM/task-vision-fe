import { ProjectRole } from "./project";

export interface ICollabDoc {
  _id: string;
  ownerId: string;
  projectId: string;
  name: string;
  structure_path: string;
  content: string;
  is_folder: boolean;
  roles?: ProjectRole[];
  users?: string[];
  edit_roles?: ProjectRole[];
  edit_users?: string[];
  is_edited_by?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
