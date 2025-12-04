import API from "./api";

export const reportApi = {
  // Generate Daily Collection Report (MMS-24)
  async generateDailyCollectionReport(reportDate: string): Promise<Blob> {
    const response = await API.get(`/api/reports/daily-collection`, {
      params: { reportDate },
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate Contract History Report
  async generateContractHistoryReport(params: {
    tenantId?: number;
    contractId?: number;
    actionType?: string;
  }): Promise<Blob> {
    const response = await API.get(`/api/reports/contract-history`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  async getRentalRevenueByBusinessType(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const response = await API.get(`/api/reports/rental-revenue-by-business-type`, {
      params
    });
    return response.data;
  },

  async exportRentalRevenueByBusinessTypeReport(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await API.get(`/api/reports/rental-revenue-by-business-type/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};