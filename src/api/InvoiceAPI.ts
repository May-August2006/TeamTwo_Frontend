// api/InvoiceAPI.ts
import API from "./api";
import type { Invoice } from "../types/payment";

export const invoiceApi = {
  // Get all invoices
  getAll: () => API.get<Invoice[]>('/api/invoices'),
  
  // Get invoice by ID
  getById: (id: number) => API.get<Invoice>(`/api/invoices/${id}`),
  
  // Get invoices by contract ID
  getByContract: (contractId: number) => API.get<Invoice[]>(`/api/invoices/contract/${contractId}`),
  
  // Get invoices by status
  getByStatus: (status: string) => API.get<Invoice[]>(`/api/invoices/status/${status}`),
  
  // Get unpaid and partially paid invoices
  getUnpaidInvoices: () => API.get<Invoice[]>('/api/invoices/unpaid'),
  
  // Generate rent invoices
  generateRentInvoices: () => API.post<Invoice[]>('/api/invoices/generate-rent'),
  
  // Calculate utility charges for an invoice
  calculateUtilityCharges: (id: number, periodStart: string, periodEnd: string) => 
    API.post<Invoice>(`/api/invoices/${id}/calculate-utilities?periodStart=${periodStart}&periodEnd=${periodEnd}`),
  
  // Update invoice status
  updateStatus: (id: number, status: string) => 
    API.put<Invoice>(`/api/invoices/${id}/status?status=${status}`),
};