/** @format */

// types/utility.ts
export interface UtilityCalculationDTO {
  contractId: number | null;
  unitId: number;
  periodStart: string;
  periodEnd: string;
  utilityCharges: UtilityChargeDTO[];
  totalUtilityAmount: number;
  // Add these new properties for comprehensive billing
  unitNumber?: string;
  unitSpace?: number;
  tenantName?: string;
  buildingName?: string;
  totalLeasableArea?: number;
  totalCAMCosts?: number;
}

export interface UtilityChargeDTO {
  utilityTypeId: number;
  utilityName: string;
  calculationMethod: string;
  ratePerUnit: number | null;
  quantity: number | null;
  amount: number;
  description: string;
  // Add these for better display
  unit?: string;
  calculationFormula?: string;
}

export interface UtilityInvoiceRequest {
  contractId: number;
  periodStart: string;
  periodEnd: string;
  utilityCharges: {
    utilityTypeId: number;
    quantity: number | null;
    notes: string;
  }[];
}

// NEW: Add comprehensive utility billing DTO
export interface UtilityBillingDTO {
  taxAmount: number;
  grandTotal: number;
  unitId: number;
  unitNumber: string;
  unitSpace: number;
  unitType: string;

  contractId?: number;
  contractNumber?: string;
  tenantName?: string;

  buildingId?: number;
  buildingName?: string;
  totalLeasableArea?: number;
  totalCAMCosts?: number;

  periodStart: string;
  periodEnd: string;

  utilityFees: UtilityFeeDetail[];
  totalAmount: number;
}

export interface UtilityFeeDetail {
  utilityTypeId?: number;
  utilityName: string;
  calculationMethod: string;
  ratePerUnit: number | null;
  quantity: number | null;
  amount: number;
  unit?: string;
  calculationFormula: string;
}

// NEW: For unit-based billing request
export interface UtilityBillRequest {
  unitId: number;
  periodStart: string;
  periodEnd: string;
  dueDate?: string;
  notes?: string;
  utilityFees?: UtilityFeeDetail[]; // <-- required for backend calculation
  taxAmount?: number; // optional, but recommended
  grandTotal?: number; // optional, but recommended
}
