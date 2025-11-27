// api/ContractHistoryAPI.ts - UPDATED
import API from './api';
import type { ContractHistoryDTO } from '../types/contractHistory';

const BASE_URL = '/api/contract-history';

export const contractHistoryApi = {
  // Get contract history by tenant
  getByTenant: (tenantId: number): Promise<ContractHistoryDTO[]> => 
    API.get<ContractHistoryDTO[]>(`${BASE_URL}/tenant/${tenantId}`).then(response => response.data),

  // Get contract history by contract
  getByContract: (contractId: number): Promise<ContractHistoryDTO[]> => 
    API.get<ContractHistoryDTO[]>(`${BASE_URL}/contract/${contractId}`).then(response => response.data),

  getByActionType: (actionType: string): Promise<ContractHistoryDTO[]> => 
    API.get<ContractHistoryDTO[]>(`${BASE_URL}/action-type`, {
      params: { actionType }
    }).then(response => response.data),

  // Get all contract history
  getAll: (): Promise<ContractHistoryDTO[]> => 
    API.get<ContractHistoryDTO[]>(BASE_URL).then(response => response.data),

  // Generate PDF report - UPDATED: removed date range, added actionType
  generateReport: async (params: {
    tenantId?: number;
    contractId?: number;
    actionType?: string;
  }): Promise<Blob> => {
    const response = await API.get('/api/reports/contract-history', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};