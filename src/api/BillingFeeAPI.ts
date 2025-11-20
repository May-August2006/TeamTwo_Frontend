// api/BillingFeeAPI.ts
import API from "./api";
import type { BillingFee, BillingFeeRequest } from "../types/billing";

export const billingFeeApi = {
  // Get all billing fees
  getAll: () => API.get<BillingFee[]>('/api/billing-fees'),
  
  // Get active billing fees only
  getActive: () => API.get<BillingFee[]>('/api/billing-fees/active'),
  
  // Get billing fee by ID
  getById: (id: number) => API.get<BillingFee>(`/api/billing-fees/${id}`),
  
  // Get billing fees by type
  getByType: (feeType: string) => API.get<BillingFee[]>(`/api/billing-fees/type/${feeType}`),
  
  // Create new billing fee
  create: (data: BillingFeeRequest) => API.post<BillingFee>('/api/billing-fees', data),
  
  // Update billing fee
  update: (id: number, data: BillingFeeRequest) => API.put<BillingFee>(`/api/billing-fees/${id}`, data),
  
  // Delete billing fee
  delete: (id: number) => API.delete<void>(`/api/billing-fees/${id}`),
};