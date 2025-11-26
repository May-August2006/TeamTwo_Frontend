import API from "./api"; // Use your centralized API instance
import type { Payment, PaymentRequest, PaymentAuditLog } from '../types';

export const paymentApi = {
  // MMS-14: Record a Tenant Payment
  async recordPayment(paymentData: PaymentRequest): Promise<Payment> {
    const response = await API.post<Payment>('/api/payments', paymentData);
    return response.data;
  },

  // Get all payments
  async getPayments(startDate?: string, endDate?: string): Promise<Payment[]> {
    const params: any = {};
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    const response = await API.get<Payment[]>('/api/payments', { params });
    return response.data;
  },

  // Get payments by invoice ID
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    const response = await API.get<Payment[]>(`/api/payments/invoice/${invoiceId}`);
    return response.data;
  },

  // Get payments by tenant ID
  async getPaymentsByTenantId(tenantId: number): Promise<Payment[]> {
    const response = await API.get<Payment[]>(`/api/payments/tenant/${tenantId}`);
    return response.data;
  },

  // MMS-15: Generate Payment Receipt
  async generateReceipt(paymentId: number): Promise<Blob> {
    const response = await API.get(`/api/payments/${paymentId}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  },

voidPayment: async (paymentId: number, reason: string, changedByUserId: number) => {
  const response = await API.put(`/api/payments/${paymentId}/void?reason=${encodeURIComponent(reason)}&changedByUserId=${changedByUserId}`);
  return response.data;
},

  // MMS-43: Get Payment Audit Logs
  async getAllAuditLogs(): Promise<PaymentAuditLog[]> {
    const response = await API.get<PaymentAuditLog[]>('/api/payment-audit-logs');
    return response.data;
  },

  async getAuditLogsByPaymentId(paymentId: number): Promise<PaymentAuditLog[]> {
    const response = await API.get<PaymentAuditLog[]>(`/api/payment-audit-logs/payment/${paymentId}`);
    return response.data;
  },

  async getAuditLogsByUserId(userId: number): Promise<PaymentAuditLog[]> {
    const response = await API.get<PaymentAuditLog[]>(`/api/payment-audit-logs/user/${userId}`);
    return response.data;
  },

  // Search payments
  async searchPaymentsByTenantName(tenantName: string): Promise<Payment[]> {
    const response = await API.get<Payment[]>(`/api/payments/search?tenantName=${encodeURIComponent(tenantName)}`);
    return response.data;
  },

  // Get total paid amount for invoice
  async getTotalPaidAmount(invoiceId: number): Promise<number> {
    const response = await API.get<number>(`/api/payments/invoice/${invoiceId}/total-paid`);
    return response.data;
  }
};
