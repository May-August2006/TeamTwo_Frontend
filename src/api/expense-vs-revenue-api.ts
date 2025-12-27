// src/api/expense-vs-revenue-api.ts

import API from './api';

export interface ExpenseRevenueFilterParams {
  periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  year?: number;
  month?: number;
  quarter?: number;
  buildingId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseVsRevenueDTO {
  period: string;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  buildingName?: string;
}

export const expenseVsRevenueApi = {
  // Get data for display
  async getExpenseVsRevenueData(params: ExpenseRevenueFilterParams): Promise<ExpenseVsRevenueDTO[]> {
    const response = await API.get('/api/reports/expense-vs-revenue/data', {
      params
    });
    return response.data;
  },

  // Generate PDF report
  async generatePdfReport(params: ExpenseRevenueFilterParams): Promise<Blob> {
    const response = await API.get('/api/reports/expense-vs-revenue/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate Excel report
  async generateExcelReport(params: ExpenseRevenueFilterParams): Promise<Blob> {
    const response = await API.get('/api/reports/expense-vs-revenue/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Combined endpoint
  async generateReport(params: ExpenseRevenueFilterParams & { format?: 'pdf' | 'excel' }): Promise<Blob> {
    const { format = 'pdf', ...queryParams } = params;
    
    const endpoint = format === 'excel' 
      ? '/api/reports/expense-vs-revenue/excel'
      : '/api/reports/expense-vs-revenue/pdf';
    
    const response = await API.get(endpoint, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  }
};