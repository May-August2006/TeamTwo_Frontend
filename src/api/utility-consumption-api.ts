import API from "./api";

export interface UtilityConsumptionFilterParams {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  buildingId?: number;
  utilityTypeId?: number;
}

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

export const utilityConsumptionApi = {
  // Get data for display
  async getUtilityConsumptionData(
    params: UtilityConsumptionFilterParams
  ): Promise<UtilityConsumptionReportDTO[]> {
    const response = await API.get('/api/reports/utility-consumption/data', {
      params
    });
    return response.data;
  },

  // Generate PDF report
  async generatePdfReport(
    params: UtilityConsumptionFilterParams
  ): Promise<Blob> {
    const response = await API.get('/api/reports/utility-consumption/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate Excel report
  async generateExcelReport(
    params: UtilityConsumptionFilterParams
  ): Promise<Blob> {
    const response = await API.get('/api/reports/utility-consumption/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Combined endpoint with format parameter
  async generateReport(
    params: UtilityConsumptionFilterParams & { format?: 'pdf' | 'excel' }
  ): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    const response = await API.get('/api/reports/utility-consumption', {
      params: { ...queryParams, format },
      responseType: 'blob'
    });
    return response.data;
  }
};