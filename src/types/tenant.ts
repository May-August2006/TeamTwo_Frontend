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
  tenantName?: string;
  contactPerson?: string;
  email?: string;
  nrc_no?: string;
  phone?: string;
  address?: string;
  tenantCategoryId?: number;
  username?: string;
  fullName?: string;
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
  username: string;
  fullName?: string;
  tenantCategoryName?: string;
  businessType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantCategory {
  id: number;
  categoryName: string;
  businessType: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TenantSearchParams {
  name?: string;
  categoryId?: number;
  email?: string;
  phone?: string;
}