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
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

      // Apply additional filters
      let filteredPayments = paymentsData;

      if (filterStatus) {
        filteredPayments = filteredPayments.filter(
          payment => payment.paymentStatus === filterStatus
        );
      }

      if (filterMethod) {
        filteredPayments = filteredPayments.filter(
          payment => payment.paymentMethod === filterMethod
        );
      }

      if (searchTerm) {
        filteredPayments = filteredPayments.filter(
          payment =>
            payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setPayments(filteredPayments);
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
  }, [filterDate, filterStatus, filterMethod, searchTerm]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

const handleVoidPayment = async (paymentId: number) => {
  if (!window.confirm('Are you sure you want to void this payment? This action cannot be undone.')) return;

  try {
    // Remove the hardcoded user ID parameter
    await paymentApi.voidPayment(paymentId, 'Voided by user');
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Axios error:', err.response?.data || err.message);
        setError('Failed to generate receipt: ' + (err.response?.data?.message || err.message));
      } else {
        console.error('Unexpected error:', err);
        setError('Failed to generate receipt');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const clearFilters = () => {
    setFilterDate('');
    setFilterStatus('');
    setFilterMethod('');
    setSearchTerm('');
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
        <button
          onClick={loadPayments}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by tenant, payment #, invoice #..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filterDate || filterStatus || filterMethod || searchTerm) && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All Filters
            </button>
          </div>
        )}
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
                  Created
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
                    <div className="text-sm text-gray-500">
                      Invoice: {payment.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.tenantName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.roomNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      Received by: {payment.receivedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-gray-900">
                      {payment.amount.toLocaleString()} MMK
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusChip status={payment.paymentStatus.toLowerCase()} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleGenerateReceipt(payment)}
                      className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50"
                    >
                      Receipt
                    </button>
                    {payment.paymentStatus === 'COMPLETED' && (
                      <button
                        onClick={() => handleVoidPayment(payment.id)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded border border-red-600 hover:bg-red-50"
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
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterDate || filterStatus || filterMethod || searchTerm 
                ? 'Try adjusting your filters' 
                : 'No payments have been recorded yet'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
              <div className="text-gray-600">Total Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {payments.filter(p => p.paymentStatus === 'COMPLETED').length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {payments.filter(p => p.paymentStatus === 'VOIDED').length}
              </div>
              <div className="text-gray-600">Voided</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {payments.reduce((sum, p) => sum + (p.paymentStatus === 'COMPLETED' ? p.amount : 0), 0).toLocaleString()} MMK
              </div>
              <div className="text-gray-600">Total Collected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentListPage;