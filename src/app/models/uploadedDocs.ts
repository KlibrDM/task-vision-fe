import { ProjectRole } from "./project";

export interface IUploadedDoc {
  _id: string;
  ownerId: string;
  projectId: string;
  name: string;
  structure_path: string;
  file_path: string;
  size: number;
  type: string;
  roles?: ProjectRole[];
  users?: string[];
  is_project_storage_folder?: boolean;
  is_project_storage_file?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
