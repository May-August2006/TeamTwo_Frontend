import API from "./api";
import type { Branch, BranchRequest } from "../types";

// In BranchAPI.tsx
export const branchApi = {
  getAll: () => API.get<Branch[]>('/api/branches'), // Add /api
  getById: (id: number) => API.get<Branch>(`/api/branches/${id}`), // Add /api
  create: (branch: BranchRequest) => API.post<Branch>('/api/branches/create', branch), // Add /api
  update: (id: number, branch: BranchRequest) => API.put<Branch>(`/api/branches/${id}`, branch), // Add /api
  delete: (id: number) => API.delete<void>(`/api/branches/${id}`), // Add /api
  search: (name: string) => API.get<Branch[]>(`/api/branches/search?name=${name}`), // Add /api
  checkExists: (branchName: string) =>
    API.get<boolean>(`/api/branches/exists?branchName=${branchName}`), // Add /api
  getAllBranches: () => API.get<Branch[]>('/api/branches'),
};
