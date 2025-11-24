export interface ContractInfo {
  contractNumber: string;
  contractStatus: string;
  roomName: string;
  startDate: string;
  endDate: string;
}

export interface Tenant {
  id: number;
  tenantName: string;
  contactPerson: string;
  email: string;
  nrc_no?: string;
  phone: string;
  address?: string;
  tenantCategoryId: number;
  tenantCategoryName?: string;
  businessType?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  username: string;
  fullName?: string;
  
  // For backward compatibility
  contractNumber?: string;
  contractStatus?: string;
  roomName?: string;
  
  // Multiple contracts
  contracts: ContractInfo[];
}

export interface TenantCategory {
  id: number;
  categoryName: string;
  businessType: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  tenantName: string;
  contactPerson: string;
  email: string;
  nrc_no?: string;
  phone: string;
  address?: string;
  tenantCategoryId: number;
  username: string;
  fullName?: string;
}

export interface UpdateTenantRequest {
  tenantName: string;
  contactPerson: string;
  email: string;
  nrc_no?: string;
  phone: string;
  address?: string;
  tenantCategoryId: number;
  username: string;
  fullName?: string;
}

export interface TenantSearchParams {
  name?: string;
  categoryId?: number;
  email?: string;
  phone?: string;
}