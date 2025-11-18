import React from 'react';
import StatusChip from './StatusChip';

interface Payment {
  id: string;
  tenant: string;
  amount: number;
  type: string;
  dateTime: string;
  status: 'completed' | 'pending' | 'failed';
}

interface RecentPaymentsTableProps {
  payments: Payment[];
}

const RecentPaymentsTable: React.FC<RecentPaymentsTableProps> = ({ payments }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Payments</h3>
        <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Tenant</th>
              <th className="py-3 px-4 text-right text-sm font-medium text-gray-700 border-b">Amount (₹)</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Payment Type</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Status</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Date & Time</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b text-sm">{payment.tenant}</td>
                <td className="py-3 px-4 border-b text-sm text-right">{payment.amount.toLocaleString()}</td>
                <td className="py-3 px-4 border-b text-sm">{payment.type}</td>
                <td className="py-3 px-4 border-b">
                  <StatusChip status={payment.status} />
                </td>
                <td className="py-3 px-4 border-b text-sm">{payment.dateTime}</td>
                <td className="py-3 px-4 border-b">
                  <button className="text-blue-600 hover:text-blue-800 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentPaymentsTable;