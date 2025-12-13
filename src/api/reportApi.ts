import type { OutstandingBalanceReportDTO } from "../types/outstanding-balances";
import API from "./api";

export const reportApi = {

  async generateOutstandingBalancesReport(params: {
    startDate?: string;
    endDate?: string;
    overdueCategory?: string;
    tenantName?: string;
    format?: string;
  }): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    
    const endpoint = format === 'excel' 
      ? '/api/reports/outstanding-balances/excel'
      : '/api/reports/outstanding-balances/pdf';

    const response = await API.get(endpoint, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  },
  
async getOutstandingBalancesData(params: {
  startDate?: string;
  endDate?: string;
  overdueCategory?: string;
  tenantName?: string;
}): Promise<OutstandingBalanceReportDTO[]> {
  const response = await API.get('/api/reports/outstanding-balances/data', {
    params
  });
  return response.data;
},

  async exportOutstandingBalancesReport(params: {
    startDate?: string;
    endDate?: string;
    overdueCategory?: string;
    tenantName?: string;
    format?: string;
  }): Promise<Blob> {
    return this.generateOutstandingBalancesReport(params);
  },

   async generateDailyCollectionReport(reportDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const endpoint = format === 'excel' 
      ? '/api/reports/daily-collection/excel'
      : '/api/reports/daily-collection';
    
    const response = await API.get(endpoint, {
      params: { reportDate, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate Contract History Report
  async generateReport(params: {
    tenantId?: number;
    contractId?: number;
    actionType?: string;
    format?: string; // Add format parameter
  }): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    
    const endpoint = format === 'excel' 
      ? '/api/reports/contract-history/excel'
      : '/api/reports/contract-history';
    
    const response = await API.get(endpoint, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  },
  // For data display
  async getRentalRevenueByBusinessType(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const response = await API.get('/api/reports/rental-revenue-by-business-type/data', {
      params
    });
    return response.data;
  },
  
  // For PDF export
  async exportRentalRevenueByBusinessTypeReport(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await API.get('/api/reports/rental-revenue-by-business-type', {
      params: {
        ...params,
        format: 'pdf'
      },
      responseType: 'blob'
    });
    return response.data;
  },
  
 async exportRentalRevenueByBusinessTypeExcel(): Promise<Blob> {
  const response = await API.get('/api/reports/rental-revenue-by-business-type/excel', {
    responseType: 'blob'
  });
  return response.data;
},

async getUtilityConsumptionData(params: {
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
    buildingId?: number;
    utilityTypeId?: number;
  }): Promise<any[]> {
    const response = await API.get('/api/reports/utility-consumption/data', {
      params
    });
    return response.data;
  },

  async generateUtilityConsumptionReport(params: {
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
    format?: 'pdf' | 'excel';
  }): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    const endpoint = format === 'excel' 
      ? '/api/reports/utility-consumption/excel'
      : '/api/reports/utility-consumption/pdf';
    
    const response = await API.get(endpoint, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  }
};
