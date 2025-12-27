/** @format */
import React, { useState, useEffect, useCallback, type JSX } from "react";
import { useTranslation } from 'react-i18next';
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PaymentListPageProps {
  showAddButton?: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const PaymentListPage: React.FC<PaymentListPageProps> = ({
  showAddButton = true,
}) => {
  const { t } = useTranslation();
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

  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const loadPayments = useCallback(
    async (page: number = 0) => {
      try {
        setLoading(true);

        // Build filters object
        const filters: any = {};

        if (searchTerm) {
          filters.tenantName = searchTerm;
        }
        if (filterStatus) {
          filters.paymentStatus = filterStatus;
        }
        if (filterMethod) {
          filters.paymentMethod = filterMethod;
        }
        if (filterDate) {
          filters.startDate = filterDate;
          const nextDay = new Date(filterDate);
          nextDay.setDate(nextDay.getDate() + 1);
          filters.endDate = nextDay.toISOString().split("T")[0];
        }

        // Check if we have any filters
        const hasFilters = Object.keys(filters).length > 0;

        let response;

        if (hasFilters) {
          response = await paymentApi.getFilteredPayments(
            filters,
            page,
            paginationInfo.pageSize,
            sortConfig.sortBy,
            sortConfig.sortDirection
          );
        } else {
          response = await paymentApi.getPaymentsPaginated(
            page,
            paginationInfo.pageSize,
            sortConfig.sortBy,
            sortConfig.sortDirection
          );
        }

        setPayments(response.payments);
        setPaginationInfo({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
          pageSize: response.pageSize,
          hasNext: response.hasNext,
          hasPrevious: response.hasPrevious,
        });

        setCurrentPage(response.currentPage);

        // Calculate statistics for current page
        const completedPayments = response.payments.filter(
          (p: Payment) => p.paymentStatus === "COMPLETED"
        );
        const voidedPayments = response.payments.filter(
          (p: Payment) => p.paymentStatus === "VOIDED"
        );
        const totalAmount = completedPayments.reduce(
          (sum: number, p: Payment) => sum + (p.amount || 0),
          0
        );

        // Note: For accurate total stats, you might need a separate API endpoint
        // These are just stats for the current page
        setStats({
          total: response.totalItems,
          completed: completedPayments.length,
          voided: voidedPayments.length,
          totalAmount,
        });

        setError("");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(t('paymentList.error.failedToLoad'));
        } else {
          setError(t('paymentList.error.unexpected'));
        }
      } finally {
        setLoading(false);
      }
    },
    [filterDate, filterStatus, filterMethod, searchTerm, sortConfig, t, paginationInfo.pageSize]
  );

  useEffect(() => {
    loadPayments(0);
  }, [filterDate, filterStatus, filterMethod, searchTerm, sortConfig]);

  const handleVoidPayment = async (paymentId: number) => {
    if (
      !window.confirm(t('paymentList.confirm.void'))
    )
      return;

    try {
      await paymentApi.voidPayment(paymentId, "Voided by user");
      loadPayments(currentPage);
    } catch (error) {
      setError(t('paymentList.error.voidFailed'));
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
      setError(t('paymentList.error.receiptFailed'));
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
      CASH: t('paymentList.methods.cash'),
      CHECK: t('paymentList.methods.check'),
      BANK_TRANSFER: t('paymentList.methods.bankTransfer'),
      CREDIT_CARD: t('paymentList.methods.creditCard'),
      DEBIT_CARD: t('paymentList.methods.debitCard'),
      MOBILE_PAYMENT: t('paymentList.methods.mobilePayment'),
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
    setCurrentPage(0);
  };

  const togglePaymentDetails = (paymentId: number) => {
    setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < paginationInfo.totalPages) {
      loadPayments(newPage);
    }
  };

  const handleSort = (field: string) => {
    const newSortDirection =
      sortConfig.sortBy === field && sortConfig.sortDirection === "ASC"
        ? "DESC"
        : "ASC";

    setSortConfig({
      sortBy: field,
      sortDirection: newSortDirection,
    });
  };

  const getSortIndicator = (field: string) => {
    if (sortConfig.sortBy === field) {
      return sortConfig.sortDirection === "ASC" ? "↑" : "↓";
    }
    return "";
  };

  const getTranslatedStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return t('paymentList.status.completed');
      case "PENDING":
        return t('paymentList.status.pending');
      case "VOIDED":
        return t('paymentList.status.voided');
      case "FAILED":
        return t('paymentList.status.failed');
      default:
        return status;
    }
  };

  if (showPaymentForm) {
    return (
      <div className="animate-fadeIn">
        <PaymentForm
          onPaymentRecorded={() => {
            setShowPaymentForm(false);
            loadPayments(currentPage);
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
        <div className="text-lg text-gray-600">{t('paymentList.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Sticky header that stays at the top of its container */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('paymentList.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('paymentList.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {showAddButton && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200 font-semibold shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  {t('paymentList.actions.recordPayment')}
                </button>
              )}
              <button
                onClick={() => loadPayments(currentPage)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
                {t('paymentList.actions.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area - Everything below the main header scrolls */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Cards - Now scrolls with content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
              style={{
                borderLeftColor: "#1E40AF",
                borderLeftWidth: "6px",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{t('paymentList.stats.totalPayments')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <CreditCard className="w-6 h-6 text-blue-800" />
                </div>
              </div>
            </div>

            <div
              className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
              style={{
                borderLeftColor: "#1E40AF",
                borderLeftWidth: "6px",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{t('paymentList.stats.completed')}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div
              className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
              style={{
                borderLeftColor: "#1E40AF",
                borderLeftWidth: "6px",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{t('paymentList.stats.voided')}</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {stats.voided}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div
              className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
              style={{
                borderLeftColor: "#1E40AF",
                borderLeftWidth: "6px",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{t('paymentList.stats.totalCollected')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalAmount.toLocaleString()} {t('paymentList.currency.mmk')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card - Scrolls with content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{t('paymentList.filters.title')}</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? t('paymentList.filters.hideFilters') : t('paymentList.filters.showFilters')}
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
                      {t('paymentList.filters.search')}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('paymentList.filters.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('paymentList.filters.paymentDate')}
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
                      {t('paymentList.filters.status')}
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('paymentList.filters.allStatus')}</option>
                      <option value="COMPLETED">{t('paymentList.status.completed')}</option>
                      <option value="PENDING">{t('paymentList.status.pending')}</option>
                      <option value="VOIDED">{t('paymentList.status.voided')}</option>
                      <option value="FAILED">{t('paymentList.status.failed')}</option>
                    </select>
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('paymentList.filters.paymentMethod')}
                    </label>
                    <select
                      value={filterMethod}
                      onChange={(e) => setFilterMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('paymentList.filters.allMethods')}</option>
                      <option value="CASH">{t('paymentList.methods.cash')}</option>
                      <option value="CHECK">{t('paymentList.methods.check')}</option>
                      <option value="BANK_TRANSFER">{t('paymentList.methods.bankTransfer')}</option>
                      <option value="CREDIT_CARD">{t('paymentList.methods.creditCard')}</option>
                      <option value="DEBIT_CARD">{t('paymentList.methods.debitCard')}</option>
                      <option value="MOBILE_PAYMENT">{t('paymentList.methods.mobilePayment')}</option>
                    </select>
                  </div>
                </div>

                {(filterDate || filterStatus || filterMethod || searchTerm) && (
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-600">
                      {t('paymentList.filters.paymentsFound', { count: paginationInfo.totalItems })}
                    </span>
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                      {t('paymentList.filters.clearFilters')}
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
                {t('paymentList.filters.noPayments.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterDate || filterStatus || filterMethod || searchTerm
                  ? t('paymentList.filters.noPayments.filterMessage')
                  : t('paymentList.filters.noPayments.defaultMessage')}
              </p>
              {(filterDate || filterStatus || filterMethod || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200"
                >
                  {t('paymentList.actions.clearFilters')}
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
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("paymentNumber")}
                        >
                          {t('paymentList.table.paymentDetails')} {getSortIndicator("paymentNumber")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('paymentList.table.tenantInvoice')}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("amount")}
                        >
                          {t('paymentList.table.amount')} {getSortIndicator("amount")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('paymentList.table.methodStatus')}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("createdAt")}
                        >
                          {t('paymentList.table.created')} {getSortIndicator("createdAt")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('paymentList.table.actions')}
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
                                      {t('paymentList.table.ref', { ref: payment.referenceNumber })}
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
                                {t('paymentList.table.room', { room: payment.roomNumber })}
                              </div>
                              <div className="text-sm text-gray-400">
                                {payment.invoiceNumber}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-lg font-bold text-gray-900">
                                {payment.amount?.toLocaleString()} {t('paymentList.currency.mmk')}
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
                                  label={getTranslatedStatus(payment.paymentStatus)}
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
                                  {t('paymentList.actions.receipt')}
                                </button>
                                <button
                                  onClick={() => togglePaymentDetails(payment.id!)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  {t('paymentList.actions.details')}
                                </button>
                                {payment.paymentStatus === "COMPLETED" && (
                                  <button
                                    onClick={() => handleVoidPayment(payment.id!)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                    {t('paymentList.actions.void')}
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
                                      {t('paymentList.table.paymentInformation')}
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.paymentId')}
                                        </span>
                                        <span className="font-medium">
                                          {payment.id}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.date')}
                                        </span>
                                        <span className="font-medium">
                                          {formatDate(payment.paymentDate)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.method')}
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
                                            {t('paymentList.table.referenceNumber')}
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
                                      {t('paymentList.table.tenantInformation')}
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.tenantName')}
                                        </span>
                                        <span className="font-medium">
                                          {payment.tenantName}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.roomNumber')}
                                        </span>
                                        <span className="font-medium">
                                          {payment.roomNumber}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.invoice')}
                                        </span>
                                        <span className="font-medium">
                                          {payment.invoiceNumber}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">
                                      {t('paymentList.table.transactionDetails')}
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.amount')}
                                        </span>
                                        <span className="font-bold text-green-600">
                                          {payment.amount?.toLocaleString()} {t('paymentList.currency.mmk')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.status')}
                                        </span>
                                        <StatusChip
                                          status={payment.paymentStatus?.toLowerCase()}
                                          label={getTranslatedStatus(payment.paymentStatus)}
                                        />
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          {t('paymentList.table.receivedBy')}
                                        </span>
                                        <span className="font-medium">
                                          User #{payment.receivedById}
                                        </span>
                                      </div>
                                      {payment.notes && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                          <span className="text-gray-500">
                                            {t('paymentList.table.notes')}
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
                            label={getTranslatedStatus(payment.paymentStatus)}
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {payment.amount?.toLocaleString()} {t('paymentList.currency.mmk')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">{t('paymentList.table.tenantName')}</span>
                            <div className="font-medium">{payment.tenantName}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">{t('paymentList.table.roomNumber')}</span>
                            <div className="font-medium">{payment.roomNumber}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">{t('paymentList.table.invoice')}</span>
                            <div className="font-medium">
                              {payment.invoiceNumber}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">{t('paymentList.table.date')}</span>
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
                          {t('paymentList.actions.downloadReceipt')}
                        </button>
                        {payment.paymentStatus === "COMPLETED" && (
                          <button
                            onClick={() => handleVoidPayment(payment.id!)}
                            className="flex items-center justify-center gap-2 py-2.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                          >
                            <X className="w-4 h-4" />
                            {t('paymentList.actions.voidPayment')}
                          </button>
                        )}
                      </div>

                      {expandedPayment === payment.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t('paymentList.table.referenceNumber')}
                              </span>
                              <span className="font-medium">
                                {payment.referenceNumber || t('paymentList.table.notAvailable')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('paymentList.table.created')}</span>
                              <span className="font-medium">
                                {formatDateTime(
                                  payment.createdAt || payment.paymentDate
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t('paymentList.table.receivedBy')}</span>
                              <span className="font-medium">
                                User #{payment.receivedById}
                              </span>
                            </div>
                            {payment.notes && (
                              <div>
                                <span className="text-gray-500">{t('paymentList.table.notes')}</span>
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
                            {t('paymentList.table.hideDetails')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            {t('paymentList.table.showDetails')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
{payments.length > 0 && paginationInfo.totalPages > 1 && (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="text-sm text-gray-600">
      {t('paymentList.pagination.showing', {
        from: paginationInfo.currentPage * paginationInfo.pageSize + 1,
        to: Math.min(
          (paginationInfo.currentPage + 1) * paginationInfo.pageSize,
          paginationInfo.totalItems
        ),
        total: paginationInfo.totalItems
      })}
    </div>

    <div className="flex items-center gap-2">
      {/* Start/First Page Button */}
      <button
        onClick={() => handlePageChange(0)}
        disabled={!paginationInfo.hasPrevious}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasPrevious
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        title={t('paymentList.actions.firstPage')}
      >
        <ChevronLeft className="w-4 h-4" />
        <ChevronLeft className="w-4 h-4 -ml-3" />
      </button>

      {/* Previous Page Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!paginationInfo.hasPrevious}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasPrevious
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        <ChevronLeft className="w-4 h-4" />
        {t('paymentList.actions.previous')}
      </button>

      <div className="flex items-center gap-1">
        {Array.from(
          { length: Math.min(5, paginationInfo.totalPages) },
          (_, i) => {
            // Show page numbers around current page
            let pageNum;
            if (paginationInfo.totalPages <= 5) {
              pageNum = i;
            } else if (currentPage <= 2) {
              pageNum = i;
            } else if (currentPage >= paginationInfo.totalPages - 3) {
              pageNum = paginationInfo.totalPages - 5 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === pageNum
                    ? "bg-blue-800 text-white"
                    : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
              >
                {pageNum + 1}
              </button>
            );
          }
        )}
      </div>

      {/* Next Page Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!paginationInfo.hasNext}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasNext
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        {t('paymentList.actions.next')}
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* End/Last Page Button */}
      <button
        onClick={() => handlePageChange(paginationInfo.totalPages - 1)}
        disabled={!paginationInfo.hasNext}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasNext
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        title={t('paymentList.actions.lastPage')}
      >
        <ChevronRight className="w-4 h-4" />
        <ChevronRight className="w-4 h-4 -ml-3" />
      </button>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{t('paymentList.pagination.itemsPerPage')}</span>
      <select
        value={paginationInfo.pageSize}
        onChange={(e) => {
          const newPageSize = parseInt(e.target.value);
          setPaginationInfo((prev) => ({
            ...prev,
            pageSize: newPageSize,
          }));
          setCurrentPage(0);
          // Reload payments with new page size
          loadPayments(0);
        }}
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </select>
    </div>
  </div>
)}

          {/* Refresh and Info */}
          {payments.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">
                {t('paymentList.pagination.page', {
                  current: currentPage + 1,
                  total: paginationInfo.totalPages
                })}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => loadPayments(currentPage)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('paymentList.actions.refreshList')}
                </button>
                <div className="text-sm text-gray-500">
                  {t('paymentList.pagination.lastUpdated', {
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentListPage;