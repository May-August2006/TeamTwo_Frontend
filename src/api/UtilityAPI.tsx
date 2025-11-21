// api/UtilityAPI.ts
import API from "./api";
import type { UtilityType, UtilityTypeRequest } from "../types/room";
import axios from "axios";

export const utilityApi = {
  // Get all utility types
  getAll: () => API.get<UtilityType[]>('/api/utility-types'),
  
  // Get active utility types only
  getActive: () => API.get<UtilityType[]>('/api/utility-types/active'),
  
  // Get utility type by ID
  getById: (id: number) => API.get<UtilityType>(`/api/utility-types/${id}`),
  
  // Create new utility type
  create: (data: UtilityTypeRequest) => API.post<UtilityType>('/api/utility-types', data),
  
  // Update utility type
  update: (id: number, data: UtilityTypeRequest) => API.put<UtilityType>(`/api/utility-types/${id}`, data),
  
  // Delete utility type
  delete: (id: number) => API.delete<void>(`/api/utility-types/${id}`),

  getByCalculationMethod: (method: string) => 
    axios.get<UtilityType[]>(`/api/utility-types/calculation-method/${method}`),
};