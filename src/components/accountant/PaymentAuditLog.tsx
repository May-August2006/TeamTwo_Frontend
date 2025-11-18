import React, { useState, useEffect } from 'react';
import type { PaymentAuditLog } from '../../types';
import { paymentApi } from '../../api/paymentApi';
import axios from 'axios';

const PaymentAuditLogComponent: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

const loadAuditLogs = async () => {
  try {
    const logs = await paymentApi.getAllAuditLogs();
    setAuditLogs(logs);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        'Error fetching audit logs:',
        err.response?.data || err.message
      );
    } else {
      console.error('Unknown error:', err);
    }
    setError('Failed to load audit logs');
  } finally {
    setLoading(false);
  }
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

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'CREATED': return 'Payment Recorded';
      case 'EDITED': return 'Payment Edited';
      case 'VOIDED': return 'Payment Voided';
      default: return actionType;
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATED': return 'bg-green-100 text-green-800';
      case 'EDITED': return 'bg-blue-100 text-blue-800';
      case 'VOIDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payment Audit Log</h1>
        <button
          onClick={loadAuditLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
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
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeColor(log.actionType)}`}>
                      {getActionTypeLabel(log.actionType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.paymentNumber}
                    </div>
                    {log.amount && (
                      <div className="text-sm text-gray-500">
                        {log.amount.toLocaleString()} MMK
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    User #{log.changedById}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.changeReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auditLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentAuditLogComponent;