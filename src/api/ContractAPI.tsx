// api/ContractAPI.ts
import API from "./api";
import type { Contract, CreateContractRequest, ContractStatus, LeaseTerminationRequest, TerminationResult, TerminationPreview } from "../types/contract";

export const contractApi = {
  // Create new contract with file upload
  create: (formData: FormData) => 
    API.post<Contract>('/api/contracts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Get all contracts
  getAll: () => API.get<Contract[]>('/api/contracts'),

  // Get contract by ID
  getById: (id: number) => API.get<Contract>(`/api/contracts/${id}`),

  // Update contract
  update: (id: number, formData: FormData) => 
    API.put<Contract>(`/api/contracts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Delete contract
  delete: (id: number) => API.delete<void>(`/api/contracts/${id}`),

  // Update contract status
  updateStatus: (id: number, status: ContractStatus) => 
    API.patch<Contract>(`/api/contracts/${id}/status?status=${status}`),

  // Get contracts by status
  getByStatus: (status: ContractStatus) => 
    API.get<Contract[]>(`/api/contracts/status/${status}`),

  // Search contracts
  search: (query: string) => 
    API.get<Contract[]>(`/api/contracts/search?q=${query}`),

  // Check room availability
  checkRoomAvailability: (roomId: number) => 
    API.get<boolean>(`/api/contracts/room/${roomId}/available`),

  // Terminate contract(old method)
  terminate: (id: number) => 
    API.patch<Contract>(`/api/contracts/${id}/terminate`),

  // Renew contract
  renew: (id: number, formData: FormData) => 
    API.post<Contract>(`/api/contracts/${id}/renew`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Check expired contracts
  checkExpired: () => 
    API.post<string>('/api/contracts/check-expired'),

  // Download file
  downloadFile: async (id: number) => {
    const response = await API.get(`/api/contracts/${id}/download`);
    
    if (response.data?.fileUrl) {
      const link = document.createElement('a');
      link.href = response.data.fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      if (response.data.fileName) {
        link.download = response.data.fileName;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    return response;
  },

  // Preview file
  previewFile: async (id: number) => {
    const response = await API.get(`/api/contracts/${id}/preview`);
    
    if (response.data?.fileUrl) {
      window.open(response.data.fileUrl, '_blank', 'noopener,noreferrer');
    }
    
    return response;
  },

  // Upload file to existing contract
  uploadFile: (id: number, formData: FormData) => 
    API.post<Contract>(`/api/contracts/${id}/upload-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Delete file from contract
  deleteFile: (id: number) => 
    API.delete<Contract>(`/api/contracts/${id}/file`),

  terminateWithDetails: (id: number, terminationData: LeaseTerminationRequest) =>
    API.post<TerminationResult>(`/api/contracts/${id}/terminate`, terminationData),

};