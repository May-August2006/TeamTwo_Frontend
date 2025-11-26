import React, { useState, useEffect } from 'react';
import type { PaymentRequest, Invoice } from '../../types/payment';
import { paymentApi } from '../../api/paymentApi';
import { invoiceApi } from '../../api/InvoiceAPI';
import { useAuth } from '../../context/AuthContext';

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
  const { userId, username, loading: authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<PaymentRequest>({
    invoiceId: initialInvoiceId || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    amount: 0,
    referenceNumber: '',
    notes: '',
    receivedById: userId || 0
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update formData when userId becomes available
  useEffect(() => {
    if (userId) {
      setFormData(prev => ({
        ...prev,
        receivedById: userId
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadUnpaidInvoices();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (formData.invoiceId > 0) {
      loadInvoiceDetails();
    }
  }, [formData.invoiceId]);

  const loadUnpaidInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setError('');
      
      // Check if user is authenticated
      if (!isAuthenticated || !userId) {
        setError('User not authenticated. Please log in again.');
        setLoadingInvoices(false);
        return;
      }

      const response = await invoiceApi.getUnpaidInvoices();
      
      // Handle different response structures
      let unpaidInvoices: Invoice[] = [];
      
      if (Array.isArray(response)) {
        unpaidInvoices = response;
      } else if (response && Array.isArray(response.data)) {
        unpaidInvoices = response.data;
      } else if (response && response.data) {
        unpaidInvoices = [response.data];
      }
      
      console.log('Loaded invoices:', unpaidInvoices);
      setInvoices(unpaidInvoices);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Please try again.');
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadInvoiceDetails = async () => {
    try {
      setError('');
      const response = await invoiceApi.getById(formData.invoiceId);
      
      const invoice = response.data || response;
      
      if (invoice) {
        setSelectedInvoice(invoice);
        setFormData(prev => ({
          ...prev,
          amount: invoice.balanceAmount || invoice.totalAmount || 0
        }));
      }
    } catch (err: any) {
      console.error('Error loading invoice details:', err);
      if (err.response?.status === 401) {
        setError('Unauthorized: You do not have permission to view invoice details');
      } else {
        setError('Failed to load invoice details');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = (): boolean => {
    if (formData.invoiceId === 0) {
      setError('Please select an invoice');
      return false;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (!formData.paymentDate) {
      setError('Payment date is required');
      return false;
    }

    // Validate amount doesn't exceed invoice balance
    if (selectedInvoice && formData.amount > (selectedInvoice.balanceAmount || selectedInvoice.totalAmount)) {
      setError('Payment amount cannot exceed the invoice balance');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    // Check if user exists before proceeding
    if (!isAuthenticated || !userId) {
      setError('User information not available. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const paymentData: PaymentRequest = {
        ...formData,
        receivedById: userId
      };

      const result = await paymentApi.recordPayment(paymentData);
      
      setSuccess(`Payment recorded successfully! Payment Number: ${result.paymentNumber}`);
      
      // Reset form
      setFormData({
        invoiceId: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        amount: 0,
        referenceNumber: '',
        notes: '',
        receivedById: userId
      });
      setSelectedInvoice(null);

      // Refresh invoices list
      loadUnpaidInvoices();

      // Notify parent component
      setTimeout(() => {
        onPaymentRecorded();
      }, 2000);

    } catch (err: any) {
      console.error('Payment error details:', err);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to record payment';
      if (err.response?.data) {
        // Try to get error message from response
        errorMessage = err.response.data.message || err.response.data || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CHECK', label: 'Check' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'MOBILE_PAYMENT', label: 'Mobile Payment' }
  ];

  // Add loading state for authentication
  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading authentication...</span>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">You need to be logged in to record payments.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Record New Payment</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Invoice *
            </label>
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading invoices...</span>
              </div>
            ) : (
              <>
                <select
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Select an invoice</option>
                  {invoices.map(invoice => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.tenantName} - {(invoice.balanceAmount || invoice.totalAmount)?.toLocaleString()} MMK
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {invoices.length === 0 ? 'No unpaid invoices found' : 'Only unpaid and partially paid invoices are shown'}
                </p>
              </>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              max={selectedInvoice ? (selectedInvoice.balanceAmount || selectedInvoice.totalAmount) : undefined}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {selectedInvoice && (
              <p className="text-sm text-gray-500 mt-1">
                Maximum allowed: {(selectedInvoice.balanceAmount || selectedInvoice.totalAmount)?.toLocaleString()} MMK
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              placeholder="Check number, transaction ID, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Received By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Received By
            </label>
            <input
              type="text"
              value={username || 'Current User'}
              disabled
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600"
            />
            <input type="hidden" name="receivedById" value={userId || 0} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Additional payment details, remarks, or comments..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Invoice Details */}
        {selectedInvoice && (
          <div className="bg-gray-50 p-4 rounded-md border">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Invoice Number:</span>
                <div className="font-semibold">{selectedInvoice.invoiceNumber}</div>
              </div>
              <div>
                <span className="font-medium">Tenant:</span>
                <div className="font-semibold">{selectedInvoice.tenantName}</div>
              </div>
              <div>
                <span className="font-medium">Room:</span>
                <div className="font-semibold">{selectedInvoice.roomNumber}</div>
              </div>
              <div>
                <span className="font-medium">Due Date:</span>
                <div className="font-semibold">
                  {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="font-medium">Total Amount:</span>
                <div className="font-semibold">
                  {selectedInvoice.totalAmount?.toLocaleString()} MMK
                </div>
              </div>
              <div>
                <span className="font-medium">Balance Due:</span>
                <div className="font-semibold text-blue-600">
                  {(selectedInvoice.balanceAmount || selectedInvoice.totalAmount)?.toLocaleString()} MMK
                </div>
              </div>
              <div>
                <span className="font-medium">Invoice Status:</span>
                <div className="font-semibold">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedInvoice.invoiceStatus === 'PAID' 
                      ? 'bg-green-100 text-green-800'
                      : selectedInvoice.invoiceStatus === 'PARTIAL'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedInvoice.invoiceStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        {formData.amount > 0 && selectedInvoice && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-semibold text-lg mb-3 text-blue-800">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Current Balance:</span>
                <div className="font-semibold">
                  {(selectedInvoice.balanceAmount || selectedInvoice.totalAmount)?.toLocaleString()} MMK
                </div>
              </div>
              <div>
                <span className="font-medium">Payment Amount:</span>
                <div className="font-semibold text-green-600">
                  {formData.amount.toLocaleString()} MMK
                </div>
              </div>
              <div>
                <span className="font-medium">Remaining Balance:</span>
                <div className="font-semibold">
                  {((selectedInvoice.balanceAmount || selectedInvoice.totalAmount) - formData.amount).toLocaleString()} MMK
                </div>
              </div>
              <div>
                <span className="font-medium">New Status:</span>
                <div className="font-semibold">
                  {formData.amount >= (selectedInvoice.balanceAmount || selectedInvoice.totalAmount) 
                    ? 'PAID' 
                    : 'PARTIAL'
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingInvoices || formData.invoiceId === 0 || !isAuthenticated || !userId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Record Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;