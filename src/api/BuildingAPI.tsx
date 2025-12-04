import API from "./api";
import type { Building, BuildingRequest } from "../types";

// Define BuildingUtilityConfig interface locally
export interface BuildingUtilityConfig {
  buildingId: number;
  totalCAMCosts?: number;
  totalLeasableArea?: number;
  generatorCost?: number;
  transformerCost?: number;
  otherCAMCosts?: number;
  calculatedDate?: string;
  notes?: string;
}

export interface BuildingUtilityConfig {
  buildingId: number;
  buildingName?: string;
  totalCAMCosts?: number;
  totalLeasableArea?: number;
  generatorCost?: number;
  transformerCost?: number;
  otherCAMCosts?: number;
  calculatedDate?: string;
  notes?: string;
}

export interface CAMDistribution {
  unitId: number;
  unitNumber: string;
  unitSpace: number;
  tenantName: string;
  proportion: number; // percentage
  camShare: number;
}

export const buildingApi = {
  getAll: () => API.get<Building[]>('/api/buildings'),
  getById: (id: number) => API.get<Building>(`/api/buildings/${id}`),
  getByBranchId: (branchId: number) => API.get<Building[]>(`/api/buildings/branch/${branchId}`),
  create: (building: BuildingRequest) => API.post<Building>('/api/buildings', building),
  update: (id: number, building: BuildingRequest) => API.put<Building>(`/api/buildings/${id}`, building),
  delete: (id: number) => API.delete<void>(`/api/buildings/${id}`),
  search: (branchId: number, name: string) => API.get<Building[]>(`/api/buildings/search?branchId=${branchId}&name=${name}`),
  getBuildingsByBranch: (branchId: number) => API.get<Building[]>(`/api/buildings/branch/${branchId}`),
  
  // New methods for assignment
  getAvailableBuildings: () => API.get<Building[]>('/api/buildings/available'),
  assignManager: (buildingId: number, managerId: number) => 
    API.post<Building>(`/api/buildings/${buildingId}/assign-manager/${managerId}`, {}),
  removeManager: (buildingId: number) => 
    API.post<void>(`/api/buildings/${buildingId}/remove-manager`, {}),

  getWithUtilities: (id: number) => 
    API.get<Building>(`/api/buildings/${id}/with-utilities`),
    
  // Get buildings by manager
  getByManager: (managerId: number) => 
    API.get<Building[]>(`/api/buildings/manager/${managerId}`),
 
    
  // Get units by building
  getUnitsByBuilding: (buildingId: number) => 
    API.get<any[]>(`/api/buildings/${buildingId}/units`),
    
  // Get building statistics
  getStatistics: (buildingId: number) => 
    API.get<any>(`/api/buildings/${buildingId}/statistics`),

  getCAMSettings: (buildingId: number) => 
  API.get<BuildingUtilityConfig>(`/api/buildings/${buildingId}/cam-settings`),
  
updateCAMSettings: (buildingId: number, settings: BuildingUtilityConfig) => 
  API.put<BuildingUtilityConfig>(`/api/buildings/${buildingId}/cam-settings`, settings),
  
calculateCAMDistribution: (buildingId: number) => 
  API.get<CAMDistribution[]>(`/api/buildings/${buildingId}/cam-distribution`)
};