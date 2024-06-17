import { OrganizationRole } from "./organization";
import { ProjectRole } from "./project";

export interface IUserSettings {
  enable_reactivity: boolean;
  mention_notifications: boolean;
  assignment_notifications: boolean;
  sprint_notifications: boolean;
  item_notifications: boolean;
}

export interface IUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_organization_controlled: boolean;
  organizationId?: string;
  active_projectId?: string;
  settings: IUserSettings;
  is_active: boolean;
  access_token?: string;
  refresh_token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserRegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface IUserLoginPayload {
  email: string;
  password: string;
}

export interface IUserPartner {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_organization_controlled: boolean;
  organizationId?: string;
  is_active: boolean;
  role: ProjectRole;
}

export interface IUserOrganizationPartner {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_organization_controlled: boolean;
  organizationId?: string;
  is_active: boolean;
  role: OrganizationRole;
}
