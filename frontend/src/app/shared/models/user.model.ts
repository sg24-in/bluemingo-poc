export interface User {
  userId: number;
  email: string;
  name: string;
  employeeId?: string;
  status: string;
  lastLogin?: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  employeeId?: string;
}

export interface UpdateUserRequest {
  name: string;
  employeeId?: string;
  status?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}
