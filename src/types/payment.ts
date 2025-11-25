export interface Payment {
  id: number;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER';
  amount: number;
  referenceNumber?: string;
  notes?: string;
  receivedById: number;
  receivedBy: string;
  paymentStatus: 'COMPLETED' | 'PENDING' | 'VOIDED';
  createdAt: string;
  updatedAt: string;
  tenantName: string;
  roomNumber: string;
}

export interface PaymentRequest {
  invoiceId: number;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  receivedById: number;
}

export interface PaymentAuditLog {
  id: number;
  paymentId: number;
  paymentNumber: string;
  actionType: 'CREATED' | 'EDITED' | 'VOIDED';
  changedById: number;
  changedBy: string;
  changeReason?: string;
  createdAt: string;
  amount?: number; 
  tenantName?: string;
  invoiceNumber?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  voidedPayments: number;
  pendingPayments: number;
  todayPayments: number;
  todayAmount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  contractId: number;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  invoiceStatus: 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  tenantName: string;
  roomNumber: string;
  contractNumber: string;
  tenantId: number;
}