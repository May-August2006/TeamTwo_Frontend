import API from "./api";
import type { Building, BuildingRequest, Level, Tenant } from "../types";
import type { Unit } from "../types/unit";
import type { Contract } from "../types/contract";

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
  API.get<CAMDistribution[]>(`/api/buildings/${buildingId}/cam-distribution`),

  checkExists: (buildingName: string, branchId: number) => 
    API.get<boolean>(`/api/buildings/exists?buildingName=${encodeURIComponent(buildingName)}&branchId=${branchId}`),

  assignAccountant: (buildingId: number, accountantId: number) => 
    API.post<Building>(`/api/buildings/${buildingId}/assign-accountant/${accountantId}`, {}),
    
  removeAccountant: (buildingId: number) => 
    API.post<void>(`/api/buildings/${buildingId}/remove-accountant`, {}),
    
  // Update getAvailableBuildings to filter for accountants too
  getAvailableBuildingsForAccountants: () => 
    API.get<Building[]>('/api/buildings/available-for-accountants'),

  // Add these methods to buildingApi object:

  // getMyAssignedBuilding: () => 
  //   API.get<{success: boolean, data: Building, message?: string}>('/api/buildings/my-assigned-building'),
 getMyAssignedBuilding: () => API.get<Building>('/api/buildings/my-assigned-building'),
getOccupiedUnitsByBuilding: (buildingId: number) => 
    API.get<Unit[]>(`/api/units/occupied/by-building/${buildingId}`),

// Add these new methods
  getTenantsByBuilding: (buildingId: number) => 
    API.get<Tenant[]>(`/api/buildings/${buildingId}/tenants`),
    
  getContractsByBuilding: (buildingId: number) => 
    API.get<Contract[]>(`/api/buildings/${buildingId}/contracts`),
    
  getAvailableUnitsByBuilding: (buildingId: number) => 
    API.get<Unit[]>(`/api/buildings/${buildingId}/available-units`),
    
  getLevelsByBuilding: (buildingId: number) => 
    API.get<Level[]>(`/api/buildings/${buildingId}/levels`),
    
  // Get building ID for current manager
  getMyBuildingId: () => 
    API.get<{ buildingId: number }>('/api/buildings/my-building-id'),
  
    
  getBuildingInfo: (buildingId: number) => 
    API.get<{ id: number; buildingName: string; branchName: string }>(`/api/buildings/${buildingId}/info`),

  // Get all data for manager's dashboard
  getManagerDashboardData: (buildingId: number) => 
    API.get<{
      building: Building;
      tenants: Tenant[];
      contracts: Contract[];
      availableUnits: Unit[];
      levels: Level[];
      stats: {
        totalTenants: number;
        activeContracts: number;
        expiringContracts: number;
        vacantUnits: number;
        occupiedUnits: number;
      };
    }>(`/api/buildings/${buildingId}/manager-dashboard`),

};
