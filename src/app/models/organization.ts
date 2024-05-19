export enum OrganizationRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface IOrganizationUser {
  userId: string;
  role: OrganizationRole;
  is_active: boolean;
}

export interface IOrganization {
  _id: string;
  name: string;
  users: IOrganizationUser[];
  createdAt?: Date;
  updatedAt?: Date;
}
