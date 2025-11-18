/** @format */

export interface Branch {
  id: number;
  branchName: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchRequest {
  branchName: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
}

export interface Building {
  id: number;
  branchId: number;
  branchName: string;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  totalLeasableArea: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingRequest {
  branchId: number;
  buildingName: string;
  buildingCode?: string;
  totalFloors?: number;
  totalLeasableArea?: number;
}

export interface Level {
  id: number;
  buildingId: number;
  buildingName: string;
  levelName: string;
  levelNumber: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface LevelRequest {
  buildingId: number;
  levelName: string;
  levelNumber: number;
  totalRooms: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: Role[];
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  roleName: string;
  description: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Auth Types
export interface AuthUser {
  username: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
}

export interface LoginResponse {
  username: string;
  token: string;
  refreshToken: string;
  roles: string[];
}

export interface RegisterResponse {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

export interface Tenant {
  id: string;
  name: string;
  roomNumber: string;
  businessType: string;
  contractStatus: 'active' | 'expiring' | 'terminated';
  monthlyRent: number;
  paymentStatus: 'paid' | 'overdue' | 'pending';
  email?: string;
  phone?: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'terminated';
  rentAmount: number;
  securityDeposit: number;
}


export interface Alert {
  id: string;
  type: 'overdue' | 'expiry' | 'maintenance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
}

export interface KPI {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface Report {
  id: string;
  name: string;
  generatedDate: string;
  period: string;
  format: string;
  size?: string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  invoiceId: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER';
  amount: number;
  referenceNumber?: string;
  notes?: string;
  receivedById: number;
  paymentStatus: 'COMPLETED' | 'PENDING' | 'VOIDED';
  tenantName: string;
  roomNumber: string;
  invoiceNumber: string;
}

export interface PaymentRequest {
  invoiceId: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER';
  amount: number;
  referenceNumber?: string;
  notes?: string;
  receivedById: number;
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
  items?: InvoiceItem[];
  lateFees?: LateFee[];
  tenantName: string;
  roomNumber: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  itemDescription: string;
  itemType: 'RENT' | 'ELECTRICITY' | 'WATER' | 'CAM' | 'MAINTENANCE' | 'TRANSFORMER' | 'GENERATOR' | 'ADJUSTMENT' | 'OTHER';
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface LateFee {
  id: number;
  invoiceId: number;
  appliedDate: string;
  lateDays: number;
  appliedAmount: number;
  reason: string;
  appliedById: number;
}

export interface PaymentAuditLog {
  id: number;
  paymentId: number;
  actionType: 'CREATED' | 'EDITED' | 'VOIDED';
  changedById: number;
  changedByName?: string;
  changeReason: string;
  createdAt: string;
  paymentNumber?: string;
  amount?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}