import API from "./api";
import type { Branch, BranchRequest } from "../types";

export const branchApi = {
  getAll: () => API.get<Branch[]>('/api/branches'),
  getById: (id: number) => API.get<Branch>(`/api/branches/${id}`),
  create: (branch: BranchRequest) => API.post<Branch>('/api/branches/create', branch),
  update: (id: number, branch: BranchRequest) => API.put<Branch>(`/api/branches/${id}`, branch),
  delete: (id: number) => API.delete<void>(`/api/branches/${id}`),
  search: (name: string) => API.get<Branch[]>(`/api/branches/search?name=${name}`),
  checkExists: (branchName: string) => API.get<boolean>(`/api/branches/exists?branchName=${branchName}`),
  getAllBranches: () => API.get<Branch[]>('/api/branches'),
  
  // New methods for assignment
  getAvailableBranches: () => API.get<Branch[]>('/api/branches/available'),
  assignAccountant: (branchId: number, accountantId: number) => 
    API.post<Branch>(`/api/branches/${branchId}/assign-accountant/${accountantId}`, {}),
  removeAccountant: (branchId: number) => 
    API.post<void>(`/api/branches/${branchId}/remove-accountant`, {})
};
