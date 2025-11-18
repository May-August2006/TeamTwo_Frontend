import API from "./api";
import type { Building, BuildingRequest } from "../types";

export const buildingApi = {
  getAll: () => API.get<Building[]>('/api/buildings'),
  getById: (id: number) => API.get<Building>(`/api/buildings/${id}`),
  getByBranchId: (branchId: number) => API.get<Building[]>(`/api/buildings/branch/${branchId}`),
  create: (building: BuildingRequest) => API.post<Building>('/api/buildings', building),
  update: (id: number, building: BuildingRequest) => API.put<Building>(`/api/buildings/${id}`, building),
  delete: (id: number) => API.delete<void>(`/api/buildings/${id}`),
  search: (branchId: number, name: string) => API.get<Building[]>(`/api/buildings/search?branchId=${branchId}&name=${name}`),

   getBuildingsByBranch: (branchId: number) => API.get<Building[]>(`/api/buildings/branch/${branchId}`),
};
