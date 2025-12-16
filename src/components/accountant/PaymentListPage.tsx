/** @format */
import React, { useState, useEffect, useCallback, type JSX } from "react";
import type { Payment } from "../../types/";
import { paymentApi } from "../../api/paymentApi";

import StatusChip from "./StatusChip";
import axios from "axios";
import { generatePaymentReceipt } from "../../utils/pdfGenerator";
import PaymentForm from "./PaymentForm";
import {
  Search,
  Filter,
  Download,
  X,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  DollarSign,
  Building,
} from "lucide-react";

interface PaymentListPageProps {
  showAddButton?: boolean;
}

const PaymentListPage: React.FC<PaymentListPageProps> = ({
  showAddButton = true,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    voided: 0,
    totalAmount: 0,
  });

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
            p.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setPayments(filteredPayments);

      // Calculate statistics
      const completedPayments = filteredPayments.filter(
        (p) => p.paymentStatus === "COMPLETED"
      );
      const voidedPayments = filteredPayments.filter(
        (p) => p.paymentStatus === "VOIDED"
      );
      const totalAmount = completedPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      setStats({
        total: filteredPayments.length,
        completed: completedPayments.length,
        voided: voidedPayments.length,
        totalAmount,
      });

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
    if (
      !window.confirm(
        "Are you sure you want to void this payment? This action cannot be undone."
      )
    )
      return;

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
    const methods: Record<string, string> = {
      CASH: "Cash",
      CHECK: "Check",
      BANK_TRANSFER: "Bank Transfer",
      CREDIT_CARD: "Credit Card",
      DEBIT_CARD: "Debit Card",
      MOBILE_PAYMENT: "Mobile Payment",
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, JSX.Element> = {
      CASH: <DollarSign className="w-4 h-4" />,
      CHECK: <FileText className="w-4 h-4" />,
      BANK_TRANSFER: <Building className="w-4 h-4" />,
      CREDIT_CARD: <CreditCard className="w-4 h-4" />,
      DEBIT_CARD: <CreditCard className="w-4 h-4" />,
      MOBILE_PAYMENT: <CreditCard className="w-4 h-4" />,
    };
    return icons[method] || <CreditCard className="w-4 h-4" />;
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterStatus("");
    setFilterMethod("");
    setSearchTerm("");
  };

  const togglePaymentDetails = (paymentId: number) => {
    setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
  };

  if (showPaymentForm) {
    return (
      <div className="animate-fadeIn">
        <PaymentForm
          onPaymentRecorded={() => {
            setShowPaymentForm(false);
            loadPayments();
          }}
          onCancel={() => setShowPaymentForm(false)}
        />
      </div>
    );
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
        <div className="text-lg text-gray-600">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all payment transactions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {showAddButton && (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200 font-semibold shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Record Payment
            </button>
          )}
          <button
            onClick={loadPayments}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <CreditCard className="w-6 h-6 text-blue-800" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Voided</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.voided}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalAmount.toLocaleString()} MMK
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search payments..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="VOIDED">Voided</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="MOBILE_PAYMENT">Mobile Payment</option>
                </select>
              </div>
            </div>

            {(filterDate || filterStatus || filterMethod || searchTerm) && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">
                  {payments.length} payments found
                </span>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No payments found
          </h3>
          <p className="text-gray-600 mb-6">
            {filterDate || filterStatus || filterMethod || searchTerm
              ? "Try adjusting your filters"
              : "No payments have been recorded yet"}
          </p>
          {(filterDate || filterStatus || filterMethod || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant & Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method & Status
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
                    <React.Fragment key={payment.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-50">
                              <CreditCard className="w-5 h-5 text-blue-800" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {payment.paymentNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(payment.paymentDate)}
                              </div>
                              {payment.referenceNumber && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Ref: {payment.referenceNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {payment.tenantName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Room {payment.roomNumber}
                          </div>
                          <div className="text-sm text-gray-400">
                            {payment.invoiceNumber}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-gray-900">
                            {payment.amount?.toLocaleString()} MMK
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              <span>
                                {getPaymentMethodLabel(payment.paymentMethod)}
                              </span>
                            </div>
                            <span className="mx-2">•</span>
                            <StatusChip
                              status={payment.paymentStatus?.toLowerCase()}
                            />
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(
                            payment.createdAt || payment.paymentDate
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleGenerateReceipt(payment)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Receipt
                            </button>
                            <button
                              onClick={() => togglePaymentDetails(payment.id!)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Details
                            </button>
                            {payment.paymentStatus === "COMPLETED" && (
                              <button
                                onClick={() => handleVoidPayment(payment.id!)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedPayment === payment.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">
                                  Payment Information
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Payment ID:
                                    </span>
                                    <span className="font-medium">
                                      {payment.id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="font-medium">
                                      {formatDate(payment.paymentDate)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Method:
                                    </span>
                                    <span className="font-medium">
                                      {getPaymentMethodLabel(
                                        payment.paymentMethod
                                      )}
                                    </span>
                                  </div>
                                  {payment.referenceNumber && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Reference:
                                      </span>
                                      <span className="font-medium">
                                        {payment.referenceNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">
                                  Tenant Information
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Tenant Name:
                                    </span>
                                    <span className="font-medium">
                                      {payment.tenantName}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Room Number:
                                    </span>
                                    <span className="font-medium">
                                      {payment.roomNumber}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Invoice:
                                    </span>
                                    <span className="font-medium">
                                      {payment.invoiceNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">
                                  Transaction Details
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Amount:
                                    </span>
                                    <span className="font-bold text-green-600">
                                      {payment.amount?.toLocaleString()} MMK
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Status:
                                    </span>
                                    <StatusChip
                                      status={payment.paymentStatus?.toLowerCase()}
                                    />
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Received By:
                                    </span>
                                    <span className="font-medium">
                                      User #{payment.receivedById}
                                    </span>
                                  </div>
                                  {payment.notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <span className="text-gray-500">
                                        Notes:
                                      </span>
                                      <p className="text-gray-700 mt-1">
                                        {payment.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <CreditCard className="w-5 h-5 text-blue-800" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {payment.paymentNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(payment.paymentDate)}
                          </div>
                        </div>
                      </div>
                      <StatusChip
                        status={payment.paymentStatus?.toLowerCase()}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {payment.amount?.toLocaleString()} MMK
                      </div>
                      <div className="text-sm text-gray-500">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Tenant:</span>
                        <div className="font-medium">{payment.tenantName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Room:</span>
                        <div className="font-medium">{payment.roomNumber}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Invoice:</span>
                        <div className="font-medium">
                          {payment.invoiceNumber}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <div className="font-medium">
                          {formatDate(payment.paymentDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleGenerateReceipt(payment)}
                      className="flex items-center justify-center gap-2 py-2.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Receipt
                    </button>
                    {payment.paymentStatus === "COMPLETED" && (
                      <button
                        onClick={() => handleVoidPayment(payment.id!)}
                        className="flex items-center justify-center gap-2 py-2.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        Void Payment
                      </button>
                    )}
                  </div>

                  {expandedPayment === payment.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Reference Number:
                          </span>
                          <span className="font-medium">
                            {payment.referenceNumber || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span className="font-medium">
                            {formatDateTime(
                              payment.createdAt || payment.paymentDate
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Received By:</span>
                          <span className="font-medium">
                            User #{payment.receivedById}
                          </span>
                        </div>
                        {payment.notes && (
                          <div>
                            <span className="text-gray-500">Notes:</span>
                            <p className="text-gray-700 mt-1">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => togglePaymentDetails(payment.id!)}
                    className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    {expandedPayment === payment.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination/Info */}
      {payments.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{payments.length}</span>{" "}
            payments
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadPayments}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh List
            </button>
            <div className="text-sm text-gray-500">
              Last updated:{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentListPage;
