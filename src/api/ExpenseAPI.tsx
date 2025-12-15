import API from "./api";

// Add to your existing BuildingAPI.tsx or create new ExpenseAPI.tsx
export interface MallOwnerExpense {
  id: number;
  buildingId: number;
  buildingName: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  generatorShare: number;
  transformerShare: number;
  otherCAMShare: number;
  description: string;
  dateRecorded: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'APPROVED';
  totalVacantArea: number;
  totalUnallocatedArea: number;
  totalLeasableArea: number;
  totalCAMCosts: number;
  occupiedArea: number;
  occupiedUnitsCount: number;
  vacantUnitsCount: number;
}

export interface CreateExpenseRequest {
  buildingId: number;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  generatorShare: number;
  transformerShare: number;
  otherCAMShare: number;
  description: string;
  otherCAMCosts: number;
  totalVacantArea: number;
  totalUnallocatedArea: number;
  totalLeasableArea: number;
  totalCAMCosts: number;
  occupiedArea: number;
  occupiedUnitsCount: number;
  vacantUnitsCount: number;
}

export interface CAMCalculation {
  buildingId: number;
  buildingName: string;
  totalLeasableArea: number;
  totalOccupiedArea: number;
  totalVacantArea: number;
  unallocatedArea: number;
  occupiedPercentage: number;
  vacantPercentage: number;
  unallocatedPercentage: number;
  generatorFee: number;
  transformerFee: number;
  otherCAMCosts: number;
  totalCAMCosts: number;
  tenantsCAM: number;
  mallOwnerCAM: number;
  costPerSqFt: number;
  occupiedUnitsCount: number;
  vacantUnitsCount: number;
  unitDetails: UnitCAMDetail[];
}

export interface UnitCAMDetail {
  unitId: number;
  unitNumber: string;
  unitSpace: number;
  tenantName: string;
  isOccupied: boolean;
  percentage: number;
  camShare: number;
  generatorShare: number;
  transformerShare: number;
  otherCAMShare: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  cancelledCount: number;
  pendingAmount: number;
  paidAmount: number;
  cancelledAmount: number;
  currentMonthTotal: number;
  previousMonthTotal: number;
  yearToDateTotal: number;
}

// API methods for expenses
export const expenseApi = {
  // Create expense
  createExpense: (request: CreateExpenseRequest) =>
    API.post<MallOwnerExpense>('/api/mall-owner-expenses', request),

  // Get all expenses
  getAllExpenses: () => API.get<MallOwnerExpense[]>('/api/mall-owner-expenses'),

  // Get expense by ID
  getExpenseById: (id: number) => API.get<MallOwnerExpense>(`/api/mall-owner-expenses/${id}`),

  // Get expenses by building
  getExpensesByBuilding: (buildingId: number) =>
    API.get<MallOwnerExpense[]>(`/api/mall-owner-expenses/building/${buildingId}`),

  // Get expenses by status
  getExpensesByStatus: (status: string) =>
    API.get<MallOwnerExpense[]>(`/api/mall-owner-expenses/status/${status}`),

  // Update expense status
  updateExpenseStatus: (id: number, status: string) =>
    API.patch<MallOwnerExpense>(`/api/mall-owner-expenses/${id}/status`, { status }),

  // Delete expense
  deleteExpense: (id: number) => API.delete<void>(`/api/mall-owner-expenses/${id}`),

  // Get expense summary
  getExpenseSummary: () => API.get<ExpenseSummary>('/api/mall-owner-expenses/summary'),

  // Get expense summary by building
  getExpenseSummaryByBuilding: (buildingId: number) =>
    API.get<ExpenseSummary>(`/api/mall-owner-expenses/summary/building/${buildingId}`),

  // Calculate CAM distribution
  calculateCAM: (buildingId: number, periodStart: string, periodEnd: string, otherCAMCosts: number) =>
    API.get<CAMCalculation>(`/api/mall-owner-expenses/calculate?buildingId=${buildingId}&periodStart=${periodStart}&periodEnd=${periodEnd}&otherCAMCosts=${otherCAMCosts}`),

  // Check duplicate expense
  checkDuplicate: (buildingId: number, periodStart: string, periodEnd: string) =>
    API.get<boolean>(`/api/mall-owner-expenses/check-duplicate?buildingId=${buildingId}&periodStart=${periodStart}&periodEnd=${periodEnd}`),

  // Search expenses
  searchExpenses: (params: {
    buildingId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.buildingId) queryParams.append('buildingId', params.buildingId.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    
    return API.get<MallOwnerExpense[]>(`/api/mall-owner-expenses/search?${queryParams.toString()}`);
  },

  // Export to CSV
  exportToCSV: () =>
    API.get<Blob>('/api/mall-owner-expenses/export/csv', {
      responseType: 'blob',
    }),

  // Export to PDF
  exportToPDF: () =>
    API.get<Blob>('/api/mall-owner-expenses/export/pdf', {
      responseType: 'blob',
    }),
};