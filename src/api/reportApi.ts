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

  // You can add more report methods here as needed
  // MMS-18: Financial Summary Report
  // MMS-19: Tenant Contract Summary Report
  // MMS-20: Expiring Contracts Report
  // etc.
};