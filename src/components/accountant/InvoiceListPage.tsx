/** @format */

import React, { useState, useEffect } from "react";
import { invoiceApi } from "../../api/InvoiceAPI";
import type { Invoice } from "../../types/billing";

export const InvoiceListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = filterStatus === "ALL" 
        ? await invoiceApi.getAll()
        : await invoiceApi.getByStatus(filterStatus);
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const generateRentInvoices = async () => {
    try {
      setGenerating(true);
      const response = await invoiceApi.generateRentInvoices();
      alert("Rent invoices generated successfully!");
      fetchInvoices();
    } catch (error: any) {
      console.error("Error generating rent invoices:", error);
      alert(error.response?.data?.message || "Failed to generate rent invoices");
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: "bg-stone-100 text-stone-800",
      ISSUED: "bg-red-100 text-red-800",
      PAID: "bg-green-100 text-green-800",
      OVERDUE: "bg-red-100 text-red-800",
      PARTIAL: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-stone-100 text-stone-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusClasses[status as keyof typeof statusClasses] || "bg-stone-100 text-stone-800"
      }`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Invoices</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">Manage and generate tenant invoices</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PARTIAL">Partial</option>
          </select>
          <button
            onClick={generateRentInvoices}
            disabled={generating}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition duration-150 font-semibold"
          >
            {generating ? "Generating..." : "Generate Rent Invoices"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-red-50/50 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {invoice.tenantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {invoice.roomNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    ${invoice.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    ${invoice.balanceAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.invoiceStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-red-600 hover:text-red-700 mr-3 transition duration-150">
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-700 transition duration-150">
                      Calculate Utilities
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-b-xl">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-xl font-semibold text-stone-700">No Invoices Found</div>
            <p className="text-sm mt-1">Generate rent invoices to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};