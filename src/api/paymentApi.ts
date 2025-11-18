import type { Payment, PaymentRequest, Invoice, PaymentAuditLog } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

export const paymentApi = {
  // Record Payment
  recordPayment: async (paymentData: PaymentRequest): Promise<Payment> => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to record payment');
    }
    
    return response.json();
  },

  // Get Payments by Invoice
  getPaymentsByInvoice: async (invoiceId: number): Promise<Payment[]> => {
    const response = await fetch(`${API_BASE_URL}/payments/invoice/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    
    const data = await response.json();
    return data;
  },

  // Get Payments by Tenant
  getPaymentsByTenant: async (tenantId: number): Promise<Payment[]> => {
    const response = await fetch(`${API_BASE_URL}/payments/tenant/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    
    const data = await response.json();
    return data;
  },

  // Get All Payments with filters
  getPayments: async (startDate?: string, endDate?: string): Promise<Payment[]> => {
    let url = `${API_BASE_URL}/payments`;
    if (startDate && endDate) {
      url += `/date-range?startDate=${startDate}&endDate=${endDate}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    
    const data = await response.json();
    return data;
  },

  // Get Payment by ID
  getPaymentById: async (paymentId: number): Promise<Payment> => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }
    
    return response.json();
  },

  // Void Payment
  voidPayment: async (paymentId: number, reason: string, userId: number): Promise<Payment> => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/void?reason=${encodeURIComponent(reason)}&userId=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to void payment');
    }
    
    return response.json();
  },

  // Generate Receipt
  generateReceipt: async (paymentId: number): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/receipt`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate receipt');
    }
    
    return response.blob();
  },

  // Get Payment Audit Log
  getPaymentAuditLog: async (paymentId: number): Promise<PaymentAuditLog[]> => {
    const response = await fetch(`${API_BASE_URL}/payment-audit-logs/payment/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit log');
    }
    
    const data = await response.json();
    return data;
  },

  // Get All Audit Logs
  getAllAuditLogs: async (): Promise<PaymentAuditLog[]> => {
    const response = await fetch(`${API_BASE_URL}/payment-audit-logs`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    
    const data = await response.json();
    return data;
  }
};

export const invoiceApi = {
  // Get Invoices by Tenant
  getInvoicesByTenant: async (tenantId: number): Promise<Invoice[]> => {
    const response = await fetch(`${API_BASE_URL}/invoices/tenant/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    
    const data = await response.json();
    return data;
  },

  // Get Overdue Invoices
  getOverdueInvoices: async (): Promise<Invoice[]> => {
    const response = await fetch(`${API_BASE_URL}/invoices/overdue`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch overdue invoices');
    }
    
    const data = await response.json();
    return data;
  },

  // Get Invoice by ID
  getInvoiceById: async (invoiceId: number): Promise<Invoice> => {
    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    
    return response.json();
  }
};