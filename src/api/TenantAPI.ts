import API from './api';
import type { 
  Tenant, 
  TenantCategory, 
  CreateTenantRequest, 
  UpdateTenantRequest,
  TenantSearchParams 
} from '../types/tenant';

const BASE_URL = '/api/tenants';
const CATEGORY_BASE_URL = '/api/tenant-categories';

export const tenantApi = {
  // Tenant endpoints
  getAll: (): Promise<Tenant[]> => 
    API.get<Tenant[]>(BASE_URL).then(response => response.data),

  getById: (id: number): Promise<Tenant> => 
    API.get<Tenant>(`${BASE_URL}/${id}`).then(response => response.data),

  create: (tenant: CreateTenantRequest): Promise<Tenant> => 
    API.post<Tenant>(BASE_URL, tenant).then(response => response.data),

  update: (id: number, tenant: UpdateTenantRequest): Promise<Tenant> => 
    API.put<Tenant>(`${BASE_URL}/${id}`, tenant).then(response => response.data),

  delete: (id: number): Promise<void> => 
    API.delete<void>(`${BASE_URL}/${id}`).then(response => response.data),

  search: (params: TenantSearchParams): Promise<Tenant[]> => 
    API.get<Tenant[]>(`${BASE_URL}/search`, { params }).then(response => response.data),

  // Inactive tenants endpoints
  getInactive: (): Promise<Tenant[]> => 
    API.get<Tenant[]>(`${BASE_URL}/inactive`).then(response => response.data),

  searchInactive: (name: string): Promise<Tenant[]> => 
    API.get<Tenant[]>(`${BASE_URL}/inactive/search`, { params: { name } }).then(response => response.data),

  reactivate: (id: number): Promise<void> => 
    API.put<void>(`${BASE_URL}/${id}/reactivate`).then(response => response.data),

  getAllIncludingInactive: (): Promise<Tenant[]> => 
    API.get<Tenant[]>(`${BASE_URL}/all`).then(response => response.data),

  // Category endpoints
  category: {
    getAll: (): Promise<TenantCategory[]> => 
      API.get<TenantCategory[]>(CATEGORY_BASE_URL).then(response => response.data),

    getById: (id: number): Promise<TenantCategory> => 
      API.get<TenantCategory>(`${CATEGORY_BASE_URL}/${id}`).then(response => response.data),

    create: (category: Omit<TenantCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantCategory> => 
      API.post<TenantCategory>(CATEGORY_BASE_URL, category).then(response => response.data),

    update: (id: number, category: Partial<TenantCategory>): Promise<TenantCategory> => 
      API.put<TenantCategory>(`${CATEGORY_BASE_URL}/${id}`, category).then(response => response.data),

    delete: (id: number): Promise<void> => 
      API.delete<void>(`${CATEGORY_BASE_URL}/${id}`).then(response => response.data),
  }
};