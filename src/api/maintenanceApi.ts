/** @format */

import API from "./api";
import type {
    MaintenanceRequest,
    CreateMaintenanceRequest,
    UpdateMaintenanceRequestStatus,
    AssignMaintenanceRequest,
    MaintenanceStats,
} from "../types/maintenance";

export const maintenanceApi = {
  // Get all maintenance requests
  getAllRequests: () => API.get<MaintenanceRequest[]>('/api/maintenance-requests'),

   // Get requests by building
  getRequestsByBuilding: (buildingId: number) => 
    API.get<MaintenanceRequest[]>(`/api/maintenance-requests/building/${buildingId}`),
  
  // Get requests by tenant
  getRequestsByTenant: (tenantId: number) => 
    API.get<MaintenanceRequest[]>(`/api/maintenance-requests/tenant/${tenantId}`),
  
  // Get requests by status
  getRequestsByStatus: (status: string) => 
    API.get<MaintenanceRequest[]>(`/api/maintenance-requests/status/${status}`),
  
  // Get request by ID
  getRequestById: (id: number) => 
    API.get<MaintenanceRequest>(`/api/maintenance-requests/${id}`),
  
  // Create new maintenance request
  createRequest: (requestData: CreateMaintenanceRequest) => 
    API.post<MaintenanceRequest>('/api/maintenance-requests', requestData),
  
  // Update request status
  updateRequestStatus: (id: number, statusData: UpdateMaintenanceRequestStatus) => 
    API.put<MaintenanceRequest>(`/api/maintenance-requests/${id}/status`, statusData),
  
  // Assign request to staff
  assignRequest: (id: number, assignData: AssignMaintenanceRequest) => 
    API.put<MaintenanceRequest>(`/api/maintenance-requests/${id}/assign`, assignData),
  
  // Update request
  updateRequest: (id: number, requestData: Partial<MaintenanceRequest>) => 
    API.put<MaintenanceRequest>(`/api/maintenance-requests/${id}`, requestData),
  
  // Delete request
  deleteRequest: (id: number) => 
    API.delete<void>(`/api/maintenance-requests/${id}`),
  
  // Get maintenance statistics
  getRequestStats: () => 
    API.get<MaintenanceStats>('/api/maintenance-requests/stats/count'),

};