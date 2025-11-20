// api/ContractAPI.ts
import API from "./api";
import type { Contract, CreateContractRequest, ContractStatus } from "../types/contract";

export const contractApi = {
  // Create new contract
  create: (contractData: CreateContractRequest) => 
    API.post<Contract>('/api/contracts', contractData),

  // Get all contracts
  getAll: () => API.get<Contract[]>('/api/contracts'),

  // Get contract by ID
  getById: (id: number) => API.get<Contract>(`/api/contracts/${id}`),

  // Update contract
  update: (id: number, contractData: CreateContractRequest) => 
    API.put<Contract>(`/api/contracts/${id}`, contractData),

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
    API.get<boolean>(`/api/contracts/room/${roomId}/available`)
};