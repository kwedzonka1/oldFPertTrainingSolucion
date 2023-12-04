export interface TestUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  storage: string;
}

export const NormalUser: TestUser = {
  id: "UjV3koUd3RC3sOHspnWnKkZVOPxs",
  email: "fpert.test@future-processing.com",
  name: "Fpert User",
  isAdmin: false,
  storage: "storage/storageState",
};

export const AdminUser: TestUser = {
  id: "iGEmv6Bl9ElGT5nv510yqZRAfXjD",
  email: "fpert.admin.test@future-processing.com",
  name: "Fpert Admin",
  isAdmin: true,
  storage: "storage/storageStateAdmin",
};

export const AllUsers: TestUser[] = [NormalUser, AdminUser];
