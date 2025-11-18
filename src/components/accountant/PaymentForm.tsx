import React, { useState, useEffect } from 'react';
import type { PaymentRequest, Invoice } from '../../types';
import { paymentApi, invoiceApi } from '../../api/paymentApi';

interface PaymentFormProps {
  onPaymentRecorded: () => void;
  onCancel: () => void;
  initialInvoiceId?: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  onPaymentRecorded, 
  onCancel,
  initialInvoiceId 
}) => {
  const [formData, setFormData] = useState<PaymentRequest>({
    invoiceId: initialInvoiceId || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    amount: 0,
    referenceNumber: '',
    notes: '',
    receivedById: 1 // Default to current user
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverdueInvoices();
  }, []);

  useEffect(() => {
    if (formData.invoiceId > 0) {
      loadInvoiceDetails();
    }
  }, [formData.invoiceId]);

  const loadOverdueInvoices = async () => {
    try {
      const overdueInvoices = await invoiceApi.getOverdueInvoices();
      setInvoices(overdueInvoices);
    } catch (err) {
      setError('Failed to load invoices');
    }
  };

  const loadInvoiceDetails = async () => {
    try {
      const invoice = await invoiceApi.getInvoiceById(formData.invoiceId);
      setSelectedInvoice(invoice);
      setFormData(prev => ({
        ...prev,
        amount: invoice.balanceAmount
      }));
    } catch (err) {
      setError('Failed to load invoice details');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await paymentApi.recordPayment({
        ...formData,
        amount: Number(formData.amount),
        receivedById: 1 // In real app, get from auth context
      });
      
      onPaymentRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Record New Payment</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Invoice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Invoice *
            </label>
            <select
              name="invoiceId"
              value={formData.invoiceId}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select an invoice</option>
              {invoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {invoice.tenantName} - {invoice.balanceAmount} MMK
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (MMK) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              placeholder="Check number, transaction ID, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Additional payment details..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Invoice Details */}
        {selectedInvoice && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Invoice Details:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Invoice Number: <strong>{selectedInvoice.invoiceNumber}</strong></div>
              <div>Tenant: <strong>{selectedInvoice.tenantName}</strong></div>
              <div>Room: <strong>{selectedInvoice.roomNumber}</strong></div>
              <div>Due Date: <strong>{selectedInvoice.dueDate}</strong></div>
              <div>Total Amount: <strong>{selectedInvoice.totalAmount} MMK</strong></div>
              <div>Balance: <strong>{selectedInvoice.balanceAmount} MMK</strong></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;