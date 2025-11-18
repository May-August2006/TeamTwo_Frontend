import React, { useState, useEffect, useCallback } from 'react';
import type { Payment } from '../../types';
import { paymentApi } from '../../api/paymentApi';
import StatusChip from './StatusChip';
import axios from 'axios';

const PaymentListPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment] = useState<Payment | null>(null);

   const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      let paymentsData: Payment[];

      if (filterDate) {
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        paymentsData = await paymentApi.getPayments(
          filterDate,
          nextDay.toISOString().split('T')[0]
        );
      } else {
        paymentsData = await paymentApi.getPayments();
      }

      setPayments(paymentsData);
      setError('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to load payments');
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  
const handleVoidPayment = async (paymentId: number) => {
  if (!window.confirm('Are you sure you want to void this payment?')) return;

  try {
    await paymentApi.voidPayment(paymentId, 'Voided by user', 1);
    loadPayments();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Void payment failed:', error.response?.data || error.message);
    }
    setError('Failed to void payment');
  }
};


  const handleGenerateReceipt = async (payment: Payment) => {
    try {
      const blob = await paymentApi.generateReceipt(payment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.paymentNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
  if (axios.isAxiosError(err)) {
    console.error('Axios error:', err.response?.data || err.message);
  } else {
    console.error('Unexpected error:', err);
  }
  setError('Failed to generate receipt');
}
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Cash';
      case 'CHECK': return 'Check';
      case 'BANK_TRANSFER': return 'Bank Transfer';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
        <div className="flex space-x-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="mt-6 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant & Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.paymentNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </div>
                    {payment.referenceNumber && (
                      <div className="text-sm text-gray-500">
                        Ref: {payment.referenceNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.tenantName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.roomNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      Invoice: {payment.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.amount.toLocaleString()} MMK
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusChip status={payment.paymentStatus.toLowerCase()} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleGenerateReceipt(payment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Receipt
                    </button>
                    {payment.paymentStatus === 'COMPLETED' && (
                      <button
                        onClick={() => handleVoidPayment(payment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payments found
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Receipt</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {/* Receipt content would be displayed here */}
            <div className="text-center py-8">
              <p>Receipt preview for {selectedPayment.paymentNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentListPage;