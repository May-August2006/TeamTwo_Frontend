/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantName: string;
  roomNumber: string;
  dueDate: string;
  totalAmount: number;
  status: "paid" | "unpaid" | "overdue";
}

export const BillingUtilitiesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: "1",
        invoiceNumber: "INV-2024-001",
        tenantName: "ABC Restaurant",
        roomNumber: "F-01",
        dueDate: "2024-01-15",
        totalAmount: 4200,
        status: "paid",
      },
      {
        id: "2",
        invoiceNumber: "INV-2024-002",
        tenantName: "XYZ Retail",
        roomNumber: "G-05",
        dueDate: "2024-01-10",
        totalAmount: 3100,
        status: "overdue",
      },
      {
        id: "3",
        invoiceNumber: "INV-2024-003",
        tenantName: "DEF Services",
        roomNumber: "L-08",
        dueDate: "2024-01-20",
        totalAmount: 2500,
        status: "unpaid",
      },
    ];
    setInvoices(mockInvoices);
  }, []);

  const getStatusChip = (status: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium inline-block text-center";
    switch (status) {
      case "paid":
        return (
          <span className={`${baseClass} bg-green-100 text-green-800`}>
            Paid
          </span>
        );
      case "unpaid":
        return (
          <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>
            Unpaid
          </span>
        );
      case "overdue":
        return (
          <span className={`${baseClass} bg-red-100 text-red-800`}>
            Overdue
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-stone-100 text-stone-800`}>
            {status}
          </span>
        );
    }
  };

  const handleGenerateInvoices = () => {
    navigate("/manager/billing/invoices");
  };

  const handleUtilityMeterInput = () => {
    navigate("/manager/billing/usage");
  };

  const handleUtilityTypes = () => {
    navigate("/manager/billing/utility-types");
  };

  const handleBillingFees = () => {
    navigate("/manager/billing/fees");
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
          Billing & Utilities
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={handleGenerateInvoices}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm transition duration-150"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Generate Invoices
          </button>
          <button 
            onClick={handleUtilityMeterInput}
            className="border border-stone-300 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-center gap-2 text-sm transition duration-150"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Utility Meter Input
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Invoices Generated",
            value: "98",
            desc: "This Month",
            color: "text-red-600",
          },
          {
            label: "Utility Charges",
            value: "$25,400",
            desc: "Electricity, Water, CAM",
            color: "text-red-600",
          },
          {
            label: "Paid Invoices",
            value: "90",
            desc: "92% Collection Rate",
            color: "text-green-600",
          },
          {
            label: "Unpaid Invoices",
            value: "8",
            desc: "$12,500 Outstanding",
            color: "text-red-600",
            highlight: true,
          },
        ].map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl border border-stone-200 p-4 shadow-sm ${
              card.highlight ? "border-l-4 border-red-500" : ""
            }`}
          >
            <h3 className="text-sm text-stone-600 mb-2">{card.label}</h3>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-stone-500 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm mb-6">
        <div className="p-4 sm:p-6 border-b border-stone-200">
          <h2 className="text-lg sm:text-xl font-semibold text-stone-900">
            Recent Invoices
          </h2>
        </div>
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                {[
                  "Invoice No.",
                  "Tenant",
                  "Room No.",
                  "Due Date",
                  "Total Amount",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-stone-50 transition duration-100">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-stone-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-stone-900">
                    {invoice.tenantName}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-stone-500">
                    {invoice.roomNumber}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-stone-500">
                    {invoice.dueDate}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-stone-900">
                    ${invoice.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusChip(invoice.status)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="text-red-600 hover:text-red-900 transition duration-150">
                        👁️
                      </button>
                      <button className="text-stone-600 hover:text-stone-900 transition duration-150">
                        ⬇️
                      </button>
                      {invoice.status === "overdue" && (
                        <button className="text-red-600 hover:text-red-900 transition duration-150">
                          🔔
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Utility Types",
            desc: "Manage electricity, water, and other utility types",
            color: "bg-red-100 text-red-600",
            btn: "Manage",
            onClick: handleUtilityTypes,
          },
          {
            title: "Billing Fees",
            desc: "Configure rent, CAM, and other billing fees",
            color: "bg-purple-100 text-purple-600",
            btn: "Configure",
            onClick: handleBillingFees,
          },
          {
            title: "Invoice Management",
            desc: "View and manage all invoices",
            color: "bg-green-100 text-green-600",
            btn: "View All",
            onClick: () => navigate("/manager/billing/invoices"),
          },
        ].map((action, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-stone-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div
              className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-4`}
            >
              ⚙️
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">
              {action.title}
            </h3>
            <p className="text-sm text-stone-600 mb-4">{action.desc}</p>
            <button 
              onClick={action.onClick}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm transition duration-150"
            >
              {action.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};