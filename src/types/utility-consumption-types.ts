export interface UtilityConsumptionReportDTO {
  year: number;
  month: number;
  reportDate: string;
  
  // Summary totals
  totalElectricityConsumption: number;
  totalElectricityCost: number;
  totalWaterConsumption: number;
  totalWaterCost: number;
  totalTransformerFee: number;
  totalCAMCost: number;
  totalUtilityCost: number;
  
  tenantDetails: TenantConsumptionDetail[];
}

export interface TenantConsumptionDetail {
  tenantId: number;
  tenantName: string;
  unitId: number;
  unitNumber: string;
  
  // Electricity
  electricityConsumption: number;
  electricityRate: number;
  electricityCost: number;
  transformerFee: number;
  
  // Water
  waterConsumption: number;
  waterRate: number;
  waterCost: number;
  
  // CAM
  camShare: number;
  
  // Total for this tenant
  totalUtilityCharges: number;
}

export interface UtilityConsumptionFilters {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  buildingId?: number;
  utilityTypeId?: number;
  unitId?: number;
}

export interface MonthlyOption {
  year: number;
  month: number;
  label: string;
}

export interface SummaryStats {
  totalElectricityConsumption: number;
  totalElectricityCost: number;
  totalWaterConsumption: number;
  totalWaterCost: number;
  totalTransformerFee: number;
  totalCAMCost: number;
  grandTotal: number;
  totalTenants: number;
}