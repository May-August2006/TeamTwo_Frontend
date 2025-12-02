/** @format */
import React, { useState, useEffect, useCallback } from "react";
import type { Payment } from "../../types/";
import { paymentApi } from "../../api/paymentApi";
import StatusChip from "./StatusChip";
import axios from "axios";
import { generatePaymentReceipt } from "../../utils/pdfGenerator";

const PaymentListPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      let paymentsData: Payment[];

      if (filterDate) {
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        paymentsData = await paymentApi.getPayments(
          filterDate,
          nextDay.toISOString().split("T")[0]
        );
      } else {
        paymentsData = await paymentApi.getPayments();
      }

      let filteredPayments = paymentsData;

      if (filterStatus) {
        filteredPayments = filteredPayments.filter(
          (p) => p.paymentStatus === filterStatus
        );
      }

      if (filterMethod) {
        filteredPayments = filteredPayments.filter(
          (p) => p.paymentMethod === filterMethod
        );
      }

      if (searchTerm) {
        filteredPayments = filteredPayments.filter(
          (p) =>
            p.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setPayments(filteredPayments);
      setError("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to load payments");
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, filterMethod, searchTerm]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleVoidPayment = async (paymentId: number) => {
    if (!window.confirm("Are you sure you want to void this payment?")) return;

    try {
      await paymentApi.voidPayment(paymentId, "Voided by user");
      loadPayments();
    } catch (error) {
      setError("Failed to void payment");
    }
  };

  const handleGenerateReceipt = async (payment: Payment) => {
    try {
      const pdfBlob = await generatePaymentReceipt(payment);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${payment.paymentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to generate receipt");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "CHECK":
        return "Check";
      case "BANK_TRANSFER":
        return "Bank Transfer";
      default:
        return method;
    }
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterStatus("");
    setFilterMethod("");
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Payment Management
        </h1>

        <button
          onClick={loadPayments}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tenant/payment #..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500"
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500"
            >
              <option value="">All</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>

        {(filterDate || filterStatus || filterMethod || searchTerm) && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Tenant & Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{payment.paymentNumber}</div>
                    <div className="text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </div>
                    {payment.referenceNumber && (
                      <div className="text-gray-500">
                        Ref: {payment.referenceNumber}
                      </div>
                    )}
                    <div className="text-gray-500">
                      Invoice: {payment.invoiceNumber}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium">{payment.tenantName}</div>
                    <div className="text-gray-500">{payment.roomNumber}</div>
                    <div className="text-gray-500">
                      Received by: {payment.receivedBy}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {payment.amount.toLocaleString()} MMK
                  </td>

                  <td className="px-6 py-4">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusChip status={payment.paymentStatus.toLowerCase()} />
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {formatDateTime(payment.createdAt)}
                  </td>

                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleGenerateReceipt(payment)}
                      className="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50"
                    >
                      Receipt
                    </button>

                    {payment.paymentStatus === "COMPLETED" && (
                      <button
                        onClick={() => handleVoidPayment(payment.id)}
                        className="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50"
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

        {/* Mobile Card Layout */}
        <div className="md:hidden p-4 space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-lg">
                    {payment.paymentNumber}
                  </div>
                  <div className="text-gray-500">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>

                <StatusChip status={payment.paymentStatus.toLowerCase()} />
              </div>

              <div className="mt-3 text-sm">
                <p>
                  <span className="font-semibold">Tenant:</span>{" "}
                  {payment.tenantName}
                </p>
                <p>
                  <span className="font-semibold">Room:</span>{" "}
                  {payment.roomNumber}
                </p>
                <p>
                  <span className="font-semibold">Amount:</span>{" "}
                  {payment.amount.toLocaleString()} MMK
                </p>
                <p>
                  <span className="font-semibold">Method:</span>{" "}
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </p>
                <p className="text-gray-500">
                  <span className="font-semibold">Created:</span>{" "}
                  {formatDateTime(payment.createdAt)}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => handleGenerateReceipt(payment)}
                  className="w-full text-red-600 border border-red-600 py-2 rounded-md font-medium"
                >
                  Download Receipt
                </button>

                {payment.paymentStatus === "COMPLETED" && (
                  <button
                    onClick={() => handleVoidPayment(payment.id)}
                    className="w-full text-red-600 border border-red-600 py-2 rounded-md font-medium"
                  >
                    Void Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {payments.length}
              </div>
              <div className="text-gray-600">Total Payments</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {payments.filter((p) => p.paymentStatus === "COMPLETED").length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {payments.filter((p) => p.paymentStatus === "VOIDED").length}
              </div>
              <div className="text-gray-600">Voided</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">
                {payments
                  .reduce(
                    (sum, p) =>
                      sum + (p.paymentStatus === "COMPLETED" ? p.amount : 0),
                    0
                  )
                  .toLocaleString()}{" "}
                MMK
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
