// api/UtilityAPI.ts
import API from "./api";
import type { UtilityType, UtilityTypeRequest } from "../types/unit";
import type { 
  UtilityCalculationDTO, 
  UtilityInvoiceRequest,
  UtilityBillingDTO,
  UtilityBillRequest 
} from "../types/utility";
import type { InvoiceDTO } from "../types/index";

export const utilityApi = {
  // Get all utility types
  getAll: () => API.get<UtilityType[]>('/api/utility-types'),
  
  // Get active utility types only
  getActive: () => API.get<UtilityType[]>('/api/utility-types/active'),
  
  // Get utility type by ID
  getById: (id: number) => API.get<UtilityType>(`/api/utility-types/${id}`),
  
  // Create new utility type
  create: (data: UtilityTypeRequest) => API.post<UtilityType>('/api/utility-types', data),
  
  // Update utility type
  update: (id: number, data: UtilityTypeRequest) => API.put<UtilityType>(`/api/utility-types/${id}`, data),
  
  // Delete utility type
  delete: (id: number) => API.delete<void>(`/api/utility-types/${id}`),

  // Get by calculation method
  getByCalculationMethod: (method: string) => 
    API.get<UtilityType[]>(`/api/utility-types/calculation-method/${method}`),

  // ===== UTILITY BILLING ENDPOINTS =====
  
  // NEW: Comprehensive utility billing calculation for a unit
  calculateUtilityBill: (
    unitId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<UtilityBillingDTO> =>
    API.get<UtilityBillingDTO>('/api/utility-billing/calculate', {
      params: { unitId, periodStart, periodEnd }
    }).then(response => response.data),

  // NEW: Generate utility bill/invoice
  generateUtilityBill: (request: UtilityBillRequest): Promise<InvoiceDTO> =>
    API.post<InvoiceDTO>('/api/utility-billing/generate-bill', request)
      .then(response => response.data),

  // ===== EXISTING ENDPOINTS (keep these) =====
  
  // Calculate utilities for a contract
  calculateUtilities: (
    contractId: number,
    periodStart: string,
    periodEnd: string
  ) => API.get<UtilityCalculationDTO>('/api/utilities/calculate', {
    params: { contractId, periodStart, periodEnd }
  }),

  // Calculate utilities for a unit
  calculateUtilitiesForUnit: (
    unitId: number,
    periodStart: string,
    periodEnd: string
  ) => API.get<UtilityCalculationDTO>(`/api/utilities/unit/${unitId}/calculate`, {
    params: { periodStart, periodEnd }
  }),

  // Generate utility invoice
  generateUtilityInvoice: (request: UtilityInvoiceRequest) => 
    API.post<InvoiceDTO>('/api/utilities/generate-invoice', request),

  // Generate utility invoice from calculation result
  generateUtilityInvoiceFromCalculation: (
    calculation: UtilityCalculationDTO,
    periodStart: string,
    periodEnd: string
  ) => {
    if (!calculation.contractId) {
      throw new Error('No contract ID found in calculation');
    }
    
    const request: UtilityInvoiceRequest = {
      contractId: calculation.contractId,
      periodStart,
      periodEnd,
      utilityCharges: calculation.utilityCharges.map(charge => ({
        utilityTypeId: charge.utilityTypeId,
        quantity: charge.quantity || 0,
        notes: `Generated from calculation - ${charge.utilityName}`
      }))
    };
    
    return API.post<InvoiceDTO>('/api/utilities/generate-invoice', request);
  },

  // Get utility consumption summary for a period
  getUtilitySummary: (
    buildingId?: number,
    periodStart?: string,
    periodEnd?: string
  ) => API.get<any>('/api/utilities/summary', {
    params: { buildingId, periodStart, periodEnd }
  }),

  // Get CAM calculation details for a building
  getCAMDetails: (buildingId: number) => 
    API.get<any>(`/api/utilities/cam/${buildingId}`),

  // Batch calculate utilities for multiple units
  batchCalculateUtilities: (
    unitIds: number[],
    periodStart: string,
    periodEnd: string
  ) => API.post<UtilityCalculationDTO[]>('/api/utilities/batch-calculate', {
    unitIds,
    periodStart,
    periodEnd
  })
};