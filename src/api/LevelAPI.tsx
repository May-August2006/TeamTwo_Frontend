import API from "./api";
import type { Level, LevelRequest } from "../types";

export const levelApi = {
  getAll: () => API.get<Level[]>('/api/levels'),
  getById: (id: number) => API.get<Level>(`/api/levels/${id}`),
  getByBuildingId: (buildingId: number) => API.get<Level[]>(`/api/levels/building/${buildingId}`),

  // ✅ Fix: accept LevelRequest instead of Level
  create: (data: LevelRequest) => API.post<Level>('/api/levels', data),
  update: (id: number, data: LevelRequest) => API.put<Level>(`/api/levels/${id}`, data),

  delete: (id: number) => API.delete<void>(`/api/levels/${id}`),
  search: (buildingId: number, name: string) =>
    API.get<Level[]>(`/api/levels/search?buildingId=${buildingId}&name=${name}`),
  getLevelsByBuilding: (buildingId: number) => API.get<Level[]>(`/api/levels/building/${buildingId}`),
};
