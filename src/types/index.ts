/** @format */

export interface Branch {
  message: string;
  success: any;
  id: number;
  branchName: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
  accountantId?: number;
  accountantName?: string;
}

export interface BranchRequest {
  branchName: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
}

export interface Building {
  buildingId: number;
  success: any;
  branch?: Branch;
  buildingType: string;
  totalUnits: string;
  id: number;
  branchId: number;
  branchName: string;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  totalLeasableArea: number;
  transformerFee: number;
  generatorFee: number;
  createdAt: string;
  updatedAt: string;
  managerId?: number;
  managerName?: string;
}

export interface BuildingRequest {
  branchId: number;
  buildingName: string;
  buildingCode?: string;
  totalFloors?: number;
  totalLeasableArea?: number;
  transformerFee: number;
  generatorFee: number;
}

export interface Level {
  id: number;
  buildingId: number;
  buildingName: string;
  levelName: string;
  levelNumber: number;
  totalUnits: number;
  createdAt: string;
  updatedAt: string;
}

export interface LevelRequest {
  buildingId: number;
  levelName: string;
  levelNumber: number;
  totalUnits: number;
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
  contractStatus: "active" | "expiring" | "terminated";
  monthlyRent: number;
  paymentStatus: "paid" | "overdue" | "pending";
  email?: string;
  phone?: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "terminated";
  rentAmount: number;
  securityDeposit: number;
}

export interface Alert {
  id: string;
  type: "overdue" | "expiry" | "maintenance";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  date: string;
}

export interface KPI {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
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
  paymentMethod: "CASH" | "CHECK" | "BANK_TRANSFER";
  amount: number;
  referenceNumber?: string;
  notes?: string;
  receivedById: number;
  paymentStatus: "COMPLETED" | "PENDING" | "VOIDED";
  tenantName: string;
  roomNumber: string;
  invoiceNumber: string;
}

export interface PaymentRequest {
  invoiceId: number;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  receivedById: number;
  isLateFeePayment?: boolean;
  lateFeeId?: number;
}

export interface InvoiceDTO {
  id: number;
  invoiceNumber: string;
  issueDate: string; // LocalDate → string
  dueDate: string; // LocalDate → string
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  invoiceStatus: string; // could be: DRAFT, ISSUED, PARTIAL, PAID, OVERDUE, CANCELLED, UNPAID
  pdfUrl: string;
  contractId: number;
  tenantName: string;
  roomNumber: string;
  invoiceItems: InvoiceItemDTO[]; // matches "invoiceItems" (not items)
  createdAt: string; // LocalDate → string
  updatedAt: string; // LocalDate → string

  unpaidBalance: string;
  daysOverdue: number;
  maxLateDays: number;

  lateFees?: LateFeeResponseDTO[];
}

export interface InvoiceItemDTO {
  id: number;
  itemType: string; // Java uses string (enum stored as String)
  itemDescription: string;
  quantity: number; // BigDecimal → number
  unitPrice: number; // BigDecimal → number
  amount: number; // BigDecimal → number
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
  actionType: "CREATED" | "EDITED" | "VOIDED";
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

export interface AppointmentRequest {
  roomId: number;
  appointmentDate: string;
  appointmentTime: string;
  purpose: string;
  notes: string;
  guestPhone?: string;
}

export interface AppointmentDTO {
  unitNumber: number;
  levelId: any;
  branchId: any;
  buildingId: any;
  levelName: string;
  buildingName: string;
  branchName: string;
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  purpose: string;
  notes: string;
  roomId: number;
  status: string;
}

export type Announcement = {
  success: any;
  buildingId: any;
  buildingName: any;
  id: number;
  title: string;
  message: string;
  createdAt: string; // ISO datetime
  scheduledAt?: string;
  sent: boolean;
};

export type AnnouncementRequest = {
  title: string;
  message: string;
  scheduledAt?: string;
  buildingId?: number;
};

export interface ContractAlert {
  id: number; // Unique ID of the alert
  message: string; // Alert message content
  read: boolean; // Whether the alert has been read
  createdAt: string; // Timestamp of creation in ISO format
}

export interface ReminderDTO {
  id: number;
  tenantId: number;
  invoiceId: number;
  dueDate: string; // LocalDate → string
  amount: number; // BigDecimal → number
  message: string;
  invoiceNumber: string;
}

export interface PaymentStatusDTO {
  invoiceId: number;
  tenantName: string;
  roomNumber: number;
  dueDate: string;
  outstandingAmount: number;
}

// Late Fee
export interface LateFeeRequest {
  invoiceId: number;
  lateDays: number;
  reason: string;
  appliedBy?: number;
}

export interface LateFeePolicy {
  id?: number;
  amountPerDay: number | string;
  gracePeriodDays: number; // integer
  dailyInterestPercent: string;
}

export interface LateFeeResponseDTO {
  id: number;
  invoiceId: number;
  appliedDate: string;
  lateDays: number;
  appliedAmount: number;
  reason: string;
  appliedByName?: string;
  pdfUrl?: string;
  status?: string;
}

export interface LateFeePolicyDTO {
  id: number; // database ID
  amountPerDay: string; // use string for BigDecimal
  gracePeriodDays: number; // integer
  dailyInterestPercent: string; // use string for BigDecimal
  createdAt?: string; // optional timestamp
  updatedAt?: string; // optional timestamp
}

// Request payload for creating/updating policy
export interface LateFeePolicyRequest {
  amountPerDay: string; // "12.50"
  gracePeriodDays: number;
  dailyInterestPercent: string; // "0.5"
}
