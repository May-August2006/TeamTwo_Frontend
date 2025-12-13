export interface UtilityConsumptionReportDTO {
  tenantName: string;
  roomNumber: string;
  electricityConsumption: number;
  electricityRate: number;
  transformerFee: number;
  waterCharges: number;
  totalUtilityCharges: number;
  periodStart?: string;
  periodEnd?: string;
  waterConsumption?: number;
  waterRate?: number;
}

export interface UtilityConsumptionFilters {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  buildingId?: number;
  utilityTypeId?: number;
}

export interface SummaryStats {
  totalElectricityConsumption: number;
  totalElectricityCost: number;
  totalTransformerFee: number;
  totalWaterCharges: number;
  grandTotal: number;
  totalTenants: number;
}

export interface MonthlyOption {
  year: number;
  month: number;
  label: string;
}