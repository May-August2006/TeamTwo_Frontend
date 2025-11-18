/** @format */

import React from "react";
import { FileText, Download, Eye, Calendar, DollarSign } from "lucide-react";

const MyInvoices: React.FC = () => {
  const invoices = [
    {
      id: "INV-2024-001",
      period: "January 2024",
      dueDate: "Jan 15, 2024",
      amount: "$2,500.00",
      status: "unpaid",
      type: "Rent",
      generatedDate: "Dec 15, 2023",
    },
    {
      id: "INV-2023-012",
      period: "December 2023",
      dueDate: "Dec 15, 2023",
      amount: "$2,500.00",
      status: "paid",
      type: "Rent",
      generatedDate: "Nov 15, 2023",
    },
    {
      id: "INV-2023-011",
      period: "November 2023",
      dueDate: "Nov 15, 2023",
      amount: "$2,450.00",
      status: "paid",
      type: "Rent",
      generatedDate: "Oct 15, 2023",
    },
    {
      id: "INV-2023-010",
      period: "October 2023",
      dueDate: "Oct 15, 2023",
      amount: "$2,450.00",
      status: "paid",
      type: "Rent",
      generatedDate: "Sep 15, 2023",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Paid
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Unpaid
        </span>
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Invoices</h2>
          <p className="text-gray-600 mt-1">
            View and download your rent and utility invoices
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.id}
                      </p>
                      <p className="text-sm text-gray-500">{invoice.type}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{invoice.dueDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{invoice.amount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1">
                        <Download className="w-4 h-4" />
                      </button>
                      {invoice.status === "unpaid" && (
                        <button className="text-green-600 hover:text-green-900 p-1 font-medium">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State (commented out for demo) */}
      {/* <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
        <p className="text-gray-500">Your invoices will appear here once they are generated.</p>
      </div> */}

      {/* Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">4</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">Paid Invoices</p>
          <p className="text-2xl font-bold text-green-600 mt-1">3</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600 mt-1">$2,500.00</p>
        </div>
      </div>
    </div>
  );
};

export default MyInvoices;
