
import type { OutstandingBalanceReportDTO } from "../types/outstanding-balances";
import type {  UtilityConsumptionReportDTO, 
  UtilityConsumptionFilters } from "../types/utility-consumption-types";
import API from "./api";


export interface FinancialSummaryRequest {
  periodType?: string;
  year?: number;
  quarter?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  buildingId?: number;
}

export interface FinancialSummaryDTO {
  totalRentalIncome: number;
  totalUtilityIncome: number;
  totalCAMCollection: number;
  totalOtherIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  occupancyRate: number;
  collectionEfficiency: number;
  
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  activeContracts: number;
  expiringContracts: number;
  
  revenueByCategory: Array<{
    categoryName: string;
    amount: number;
    percentage: number;
    color?: string;
  }>;
  
  expenseByCategory: Array<{
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  
  monthlyTrend: Record<string, number>;
}

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
    year: number;
    month: number;
    buildingId?: number;
    unitId?: number;
  }): Promise<UtilityConsumptionReportDTO> {
    const response = await API.get('/api/reports/utility-consumption/data', {
      params
    });
    return response.data;
  },

  async generateUtilityConsumptionPDF(params: {
    year: number;
    month: number;
    buildingId?: number;
    unitId?: number;
  }): Promise<Blob> {
    const response = await API.get('/api/reports/utility-consumption/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  async generateUtilityConsumptionExcel(params: {
    year: number;
    month: number;
    buildingId?: number;
    unitId?: number;
  }): Promise<Blob> {
    const response = await API.get('/api/reports/utility-consumption/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  async generateUtilityConsumption(params: {
    year: number;
    month: number;
    buildingId?: number;
    unitId?: number;
    format?: 'pdf' | 'excel';
  }): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    
    if (format === 'excel') {
      return this.generateUtilityConsumptionExcel(queryParams);
    } else {
      return this.generateUtilityConsumptionPDF(queryParams);
    }
  },
  
 async getFinancialSummaryData(params: FinancialSummaryRequest): Promise<FinancialSummaryDTO> {
    const response = await API.get('/api/reports/financial-summary/data', {
      params
    });
    return response.data;
  },

  // Export Financial Summary as PDF
  async exportFinancialSummaryPdf(params: FinancialSummaryRequest): Promise<Blob> {
    const response = await API.get('/api/reports/financial-summary/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Export Financial Summary as Excel
  async exportFinancialSummaryExcel(params: FinancialSummaryRequest): Promise<Blob> {
    const response = await API.get('/api/reports/financial-summary/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Combined export
  async exportFinancialSummary(params: FinancialSummaryRequest & { format?: 'pdf' | 'excel' }): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    
    if (format === 'excel') {
      return this.exportFinancialSummaryExcel(queryParams);
    } else {
      return this.exportFinancialSummaryPdf(queryParams);
    }
  }
};
