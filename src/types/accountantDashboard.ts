export interface AccountantDashboard {
  totalRentCollectedToday: number;
  totalOutstandingInvoicesAmount: number;
  totalOutstandingInvoicesCount: number;
  paymentsRecordedToday: number;
  collectionEfficiency: number;
  averagePaymentTime: number;
  disputedPayments: number;
  recentPayments: RecentPayment[];
  overdueInvoices: OverdueInvoice[];
  date: string;
  successfulPaymentsToday: number;
  pendingPaymentsToday: number;
  currency: string;
}

export interface RecentPayment {
  id: string;
  tenant: string;
  room: string;
  amount: number;
  method: string;
  paymentDate: string;
  time: string;
  status: string;
  invoice: string;
}

export interface OverdueInvoice {
  id: string;
  tenant: string;
  room: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  status: string;
}