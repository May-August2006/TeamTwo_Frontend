/** @format */

import API from "./api";
import type { User, UserRequest } from "../types/type";

export const userApi = {
  getAll: () => API.get<User[]>("/api/users"),
  getById: (id: number) => API.get<User>(`/api/guests/${id}`),
  create: (user: UserRequest) => {
    console.log("API - Creating user:", user); // Debug log
    return API.post<User>("/api/users", user);
  },
  update: (id: number, user: UserRequest) =>
    API.put<User>(`/api/users/${id}`, user),

  updateApprovalStatus: (userId: number, data: { approvalStatus: string }) =>
    API.put(`/api/users/${userId}/approval-status`, data),

  delete: (id: number) => API.delete<void>(`/api/users/${id}`),
  getByRole: (roleName: string) =>
    API.get<User[]>(`/api/users/role/${roleName}`),
  getByRoles: (roleNames: string[]) =>
    API.get<User[]>(`/api/users/by-roles?roleNames=${roleNames.join(",")}`),
  assignManagerToBuilding: (userId: number, buildingId: number) =>
    API.post<User>(`/api/users/${userId}/assign-building/${buildingId}`, {}),
  assignAccountantToBranch: (userId: number, branchId: number) =>
    API.post<User>(`/api/users/${userId}/assign-branch/${branchId}`, {}),
  getAvailableManagers: () => API.get<User[]>("/api/users/managers/available"),
  getAvailableAccountants: () =>
    API.get<User[]>("/api/users/accountants/available"),
  checkUsername: (username: string) =>
    API.get<{ available: boolean }>(`/api/users/check-username/${username}`),
  checkEmail: (email: string) =>
    API.get<{ available: boolean }>(`/api/users/check-email/${email}`),
};
