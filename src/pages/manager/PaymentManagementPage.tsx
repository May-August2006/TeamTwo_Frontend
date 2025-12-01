/** @format */

import React, { useState, useEffect } from "react";

interface Payment {
  id: string;
  receiptNumber: string;
  tenantName: string;
  roomNumber: string;
  paymentDate: string;
  amount: number;
  method: string;
  invoiceNumber: string;
}

export const PaymentManagementPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const mockPayments: Payment[] = [
      {
        id: "1",
        receiptNumber: "RCP-2024-001",
        tenantName: "ABC Restaurant",
        roomNumber: "F-01",
        paymentDate: "2024-01-10",
        amount: 4200,
        method: "bank_transfer",
        invoiceNumber: "INV-2024-001",
      },
      {
        id: "2",
        receiptNumber: "RCP-2024-002",
        tenantName: "DEF Services",
        roomNumber: "L-08",
        paymentDate: "2024-01-12",
        amount: 2500,
        method: "credit_card",
        invoiceNumber: "INV-2024-003",
      },
      {
        id: "3",
        receiptNumber: "RCP-2024-003",
        tenantName: "GHI Fashion",
        roomNumber: "F-12",
        paymentDate: "2024-01-08",
        amount: 3200,
        method: "cash",
        invoiceNumber: "INV-2024-005",
      },
    ];
    setPayments(mockPayments);
  }, []);

  const outstandingBalances = [
    {
      id: "1",
      tenantName: "XYZ Food",
      roomNumber: "F-05",
      dueDate: "2024-01-10",
      amount: 4100,
      daysOverdue: 5,
    },
    {
      id: "2",
      tenantName: "DEF Services",
      roomNumber: "L-08",
      dueDate: "2024-01-05",
      amount: 2800,
      daysOverdue: 10,
    },
  ];

  const formatPaymentMethod = (method: string) =>
    method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-stone-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
          Payment Management
        </h1>
        <div className="flex flex-wrap gap-2">
          <button className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm sm:text-base transition duration-150">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Record Payment
          </button>
          <button className="border border-stone-300 text-stone-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-stone-50 flex items-center gap-2 text-sm sm:text-base transition duration-150">
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
            Generate Receipt
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            title: "Today's Collection",
            value: "$8,450",
            subtitle: "From 12 tenants",
            color: "text-red-600",
          },
          {
            title: "Monthly Collection",
            value: "$198,750",
            subtitle: "92% of expected",
            color: "text-green-600",
          },
          {
            title: "Outstanding Balance",
            value: "$12,500",
            subtitle: "From 8 tenants",
            color: "text-yellow-600",
          },
          {
            title: "Overdue Payments",
            value: "5",
            subtitle: "Over 30 days",
            color: "text-red-600",
            border: "border-l-4 border-red-500",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border border-stone-200 p-4 shadow-sm ${
              card.border || ""
            }`}
          >
            <h3 className="text-sm text-stone-600 mb-2">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-stone-500 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm mb-6">
        <div className="p-4 sm:p-6 border-b border-stone-200">
          <h2 className="text-lg sm:text-xl font-semibold text-stone-900">
            Recent Payments
          </h2>
        </div>
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                {[
                  "Receipt No.",
                  "Tenant",
                  "Room No.",
                  "Payment Date",
                  "Amount",
                  "Method",
                  "Invoice No.",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-stone-50 transition duration-100">
                  <td className="px-4 sm:px-6 py-3 text-stone-900">{payment.receiptNumber}</td>
                  <td className="px-4 sm:px-6 py-3 text-stone-900">{payment.tenantName}</td>
                  <td className="px-4 sm:px-6 py-3 text-stone-500">{payment.roomNumber}</td>
                  <td className="px-4 sm:px-6 py-3 text-stone-500">{payment.paymentDate}</td>
                  <td className="px-4 sm:px-6 py-3 font-semibold text-stone-900">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs border border-red-200">
                      {formatPaymentMethod(payment.method)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-stone-500">{payment.invoiceNumber}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex gap-3">
                      <button className="text-red-600 hover:text-red-900 transition duration-150">
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button className="text-stone-600 hover:text-stone-900 transition duration-150">
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding Balances */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-stone-200">
          <h2 className="text-lg sm:text-xl font-semibold text-stone-900">
            Outstanding Balances
          </h2>
        </div>
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                {[
                  "Tenant Name",
                  "Room No.",
                  "Invoice Due Date",
                  "Outstanding Amount",
                  "Days Overdue",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {outstandingBalances.map((balance) => (
                <tr key={balance.id} className="hover:bg-stone-50 transition duration-100">
                  <td className="px-4 sm:px-6 py-3 text-stone-900">{balance.tenantName}</td>
                  <td className="px-4 sm:px-6 py-3 text-stone-500">{balance.roomNumber}</td>
                  <td className="px-4 sm:px-6 py-3 text-stone-500">{balance.dueDate}</td>
                  <td className="px-4 sm:px-6 py-3 font-semibold text-stone-900">
                    ${balance.amount.toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      {balance.daysOverdue} days
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <button className="border border-red-300 text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm transition duration-150">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Send Notice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};