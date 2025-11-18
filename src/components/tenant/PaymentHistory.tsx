/** @format */

import React from "react";
import {
  CreditCard,
  CheckCircle,
  Calendar,
  DollarSign,
  Download,
} from "lucide-react";

const PaymentHistory: React.FC = () => {
  const payments = [
    {
      id: "PMT-001",
      invoiceId: "INV-2023-012",
      date: "Dec 14, 2023",
      amount: "$2,500.00",
      method: "Bank Transfer",
      status: "completed",
      reference: "TRX-789012",
    },
    {
      id: "PMT-002",
      invoiceId: "INV-2023-011",
      date: "Nov 12, 2023",
      amount: "$2,450.00",
      method: "Credit Card",
      status: "completed",
      reference: "TRX-789011",
    },
    {
      id: "PMT-003",
      invoiceId: "INV-2023-010",
      date: "Oct 15, 2023",
      amount: "$2,450.00",
      method: "Bank Transfer",
      status: "completed",
      reference: "TRX-789010",
    },
    {
      id: "PMT-004",
      invoiceId: "INV-2023-009",
      date: "Sep 13, 2023",
      amount: "$2,450.00",
      method: "Credit Card",
      status: "completed",
      reference: "TRX-789009",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
          <p className="text-gray-600 mt-1">
            Track all your payment transactions and receipts
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-4 sm:mt-0">
          <Download className="w-4 h-4" />
          <span>Export History</span>
        </button>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">4</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-green-600 mt-1">$9,850.00</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">On-time Payments</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">100%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">Preferred Method</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            Bank Transfer
          </p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        For {payment.invoiceId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{payment.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{payment.amount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span>{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Bank Transfer</h4>
            <p className="text-sm text-gray-600 mb-2">
              Sein Gay Har Management
            </p>
            <p className="text-sm font-mono text-gray-900">
              Account: 1234 5678 9012 3456
            </p>
            <p className="text-sm font-mono text-gray-900">
              Routing: 021000021
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">
              Credit/Debit Card
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Visa, MasterCard, American Express
            </p>
            <p className="text-sm text-gray-900">
              Processed securely through our payment gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
