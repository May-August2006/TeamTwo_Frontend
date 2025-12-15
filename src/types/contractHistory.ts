// types/contractHistory.ts - UPDATED
export interface ContractHistoryDTO {
  id: number;
  contractId: number;
  contractNumber: string;
  actionType: string;
  description: string;
  changedByUsername: string;
  changedByFullName: string;
  createdAt: string;
  tenantName: string;
  unitNumber: string;
  buildingName: string;
  oldValues: string;
  newValues: string;
}

export interface ContractHistoryFilters {
  tenantId?: number;
  contractId?: number;
  actionType?: string;
  searchTerm?: string;
}