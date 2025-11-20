// types/billing.ts
export interface BillingFee {
  id: number;
  feeName: string;
  feeType: 'RENT' | 'ELECTRICITY' | 'WATER' | 'CAM' | 'TRANSFORMER' | 'GENERATOR' | 'MAINTENANCE' | 'OTHER';
  calculationBase: 'FIXED' | 'PERCENTAGE' | 'PER_SQ_FT' | 'PER_UNIT';
  rate: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  userId: number;
}

export interface BillingFeeRequest {
  feeName: string;
  feeType: string;
  calculationBase: string;
  rate: number;
  description: string;
  isActive: boolean;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  invoiceStatus: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
  contractId: number;
  tenantName: string;
  roomNumber: string;
  invoiceItems: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: number;
  itemType: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface MeterReading {
  id: number;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  roomId: number;
  utilityTypeId: number;
  utilityName: string;
  roomNumber: string;
  createdAt: string;
}

export interface MeterReadingRequest {
  roomId: number;
  utilityTypeId: number;
  currentReading: number;
  readingDate: string;
  previousReading?: number;
  consumption?: number;
}