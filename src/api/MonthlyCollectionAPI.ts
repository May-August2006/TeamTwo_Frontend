// api/MonthlyCollectionAPI.ts
import API from './api';

export const monthlyCollectionApi = {
  async getMonthlySummary(month: string): Promise<any> {
    const response = await API.get(`/api/reports/monthly-collection-summary/data`, {
      params: { month }
    });
    return response.data;
  },

  async getYearlySummary(year: number): Promise<any[]> {
    const response = await API.get(`/api/reports/monthly-collection-summary/yearly/${year}`);
    return response.data;
  },

  async generatePdfReport(month: string): Promise<Blob> {
    const response = await API.get(`/api/reports/monthly-collection-summary/pdf`, {
      params: { month },
      responseType: 'blob'
    });
    return response.data;
  },

  async generateExcelReport(month: string): Promise<Blob> {
    const response = await API.get(`/api/reports/monthly-collection-summary/excel`, {
      params: { month },
      responseType: 'blob'
    });
    return response.data;
  },

  async generateCombinedReport(month: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const response = await API.get(`/api/reports/monthly-collection-summary`, {
      params: { month, format },
      responseType: 'blob'
    });
    return response.data;
  }
};