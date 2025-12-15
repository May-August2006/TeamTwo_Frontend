// types/outstanding-balances.ts
export interface OutstandingBalanceReportDTO {
  invoiceId: number;
  invoiceNumber: string;
  tenantName: string;
  roomNumber: string;
  buildingName: string;
  branchName: string;
  businessType: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  daysOverdue: number;
  overdueCategory: string;
  invoiceStatus: string;
}

export interface OutstandingBalanceFilterDTO {
  startDate?: string;
  endDate?: string;
  overdueCategory?: string;
  tenantName?: string;
}