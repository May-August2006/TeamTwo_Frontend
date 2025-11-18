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
    API.get<Tenant[]>(BASE_URL).then(response => {
      console.log('Tenants Raw Response:', response);
      return handleApiResponse(response.data);
    }),

  getById: (id: number): Promise<Tenant> => 
    API.get<Tenant>(`${BASE_URL}/${id}`).then(response => response.data),

  create: (tenant: CreateTenantRequest): Promise<Tenant> => 
    API.post<Tenant>(BASE_URL, tenant).then(response => response.data),

  update: (id: number, tenant: UpdateTenantRequest): Promise<Tenant> => 
    API.put<Tenant>(`${BASE_URL}/${id}`, tenant).then(response => response.data),

  delete: (id: number): Promise<void> => 
    API.delete<void>(`${BASE_URL}/${id}`).then(response => response.data),

  search: (params: TenantSearchParams): Promise<Tenant[]> => 
    API.get<Tenant[]>(`${BASE_URL}/search`, { params }).then(response => {
      return handleApiResponse(response.data);
    }),

  // Category endpoints
  category: {
    getAll: (): Promise<TenantCategory[]> => 
      API.get<TenantCategory[]>(CATEGORY_BASE_URL).then(response => {
        console.log('Categories Raw Response:', response);
        return handleApiResponse(response.data);
      }),

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

// Helper function to handle different API response structures
const handleApiResponse = (data: any): any[] => {
  if (data && data.content) {
    // Spring Pageable response
    console.log('Spring Pageable structure detected');
    return data.content;
  } else if (data && Array.isArray(data.data)) {
    // Custom wrapper response
    console.log('Custom wrapper structure detected');
    return data.data;
  } else if (data && Array.isArray(data)) {
    // Direct array response
    console.log('Direct array structure detected');
    return data;
  } else {
    // Fallback - try to extract array from response
    console.warn('Unexpected response structure, attempting to find array...', data);
    
    const findArray = (obj: any): any[] | null => {
      if (Array.isArray(obj)) return obj;
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const result = findArray(obj[key]);
          if (result) return result;
        }
      }
      return null;
    };
    
    const foundArray = findArray(data);
    if (foundArray) {
      console.log('Found array in nested structure:', foundArray);
      return foundArray;
    }
    
    console.error('No array found in response, returning empty array');
    return [];
  }
};

// Legacy functions for backward compatibility
export const getAllTenants = tenantApi.getAll;
export const getTenantById = tenantApi.getById;
export const createTenant = tenantApi.create;
export const updateTenant = tenantApi.update;
export const deleteTenant = tenantApi.delete;
export const getAllCategories = tenantApi.category.getAll;
export const searchTenants = tenantApi.search;