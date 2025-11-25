/** @format */

// api/InvoiceAPI.ts
import API from "./api";
import type { InvoiceDTO } from "../types";

export const invoiceApi = {
  // Get all invoices
  getAll: () => API.get<InvoiceDTO[]>("/api/invoices"),

  // Get invoice by ID
  getById: (id: number) => API.get<InvoiceDTO>(`/api/invoices/${id}`),

  // Get invoices by contract ID
  getByContract: (contractId: number) =>
    API.get<InvoiceDTO[]>(`/api/invoices/contract/${contractId}`),

  // Get invoices by status
  getByStatus: (status: string) =>
    API.get<InvoiceDTO[]>(`/api/invoices/status/${status}`),

  
  // Generate rent invoices
  generateRentInvoices: () =>
    API.post<InvoiceDTO[]>("/api/invoices/generate-rent"),

  // Calculate utility charges for an invoice
  calculateUtilityCharges: (
    id: number,
    periodStart: string,
    periodEnd: string
  ) =>
    API.post<InvoiceDTO>(
      `/api/invoices/${id}/calculate-utilities?periodStart=${periodStart}&periodEnd=${periodEnd}`
    ),

  // Update invoice status
  updateStatus: (id: number, status: string) =>
    API.put<InvoiceDTO>(`/api/invoices/${id}/status?status=${status}`),

  // Download invoice PDF
  downloadPDF: (invoiceId: number) =>
    API.get(`/api/invoices/download/${invoiceId}`, {
      responseType: "blob", // important for binary files
    }),
};
