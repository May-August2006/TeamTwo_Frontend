/** @format */
import API from './api';
import type { BillingFee, BillingFeeRequest } from '../types/billing';

const API_BASE_URL = 'http://localhost:8080/api';

export const billingFeeApi = {
  getAll: () => API.get<BillingFee[]>(`${API_BASE_URL}/billing-fees`),
  getActive: () => API.get<BillingFee[]>(`${API_BASE_URL}/billing-fees/active`),
  getById: (id: number) => API.get<BillingFee>(`${API_BASE_URL}/billing-fees/${id}`),
  create: (data: BillingFeeRequest) => API.post<BillingFee>(`${API_BASE_URL}/billing-fees`, data),
  update: (id: number, data: BillingFeeRequest) => API.put<BillingFee>(`${API_BASE_URL}/billing-fees/${id}`, data),
  delete: (id: number) => API.delete(`${API_BASE_URL}/billing-fees/${id}`),
  getByUtilityType: (utilityTypeId: number) => API.get<BillingFee[]>(`${API_BASE_URL}/billing-fees/type/${utilityTypeId}`), 
};