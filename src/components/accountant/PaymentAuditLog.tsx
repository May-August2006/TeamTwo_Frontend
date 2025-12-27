/** @format */

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import type { PaymentAuditLog } from "../../types";
import { paymentApi } from "../../api/paymentApi";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  X,
  Download,
  Calendar,
  User,
  FileText,
  Building,
  CreditCard,
   ChevronDown,
  ChevronUp
} from "lucide-react";

const PaymentAuditLogComponent: React.FC = () => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLog[]>([]);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterPaymentNumber, setFilterPaymentNumber] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const loadAuditLogs = useCallback(
    async (page: number = 0) => {
      try {
        setLoading(true);
        setError("");

        // Build filters object
        const filters: any = {};
        if (filterAction) filters.actionType = filterAction;
        if (filterDate) {
          const date = new Date(filterDate);
          date.setHours(0, 0, 0, 0);
          filters.startDate = date.toISOString().split("T")[0];
          
          // For end date, set to end of day
          const endDate = new Date(filterDate);
          endDate.setHours(23, 59, 59, 999);
          filters.endDate = endDate.toISOString().split("T")[0];
        }
        if (filterUser) filters.changedById = parseInt(filterUser);
        if (filterPaymentNumber) filters.paymentNumber = filterPaymentNumber;
        if (filterTenant) filters.tenantName = filterTenant;
        if (searchTerm) {
          // Search in multiple fields
          filters.searchTerm = searchTerm;
        }

        const response = await paymentApi.getAuditLogsPaginated(
          page,
          paginationInfo.pageSize,
          filters,
          sortConfig.sortBy,
          sortConfig.sortDirection
        );

        setAuditLogs(response.items);
        setPaginationInfo({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
          pageSize: response.pageSize,
          hasNext: response.hasNext,
          hasPrevious: response.hasPrevious,
        });

      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(t('auditLog.error'));
        } else {
          setError(t('auditLog.error'));
        }
      } finally {
        setLoading(false);
      }
    },
    [filterAction, filterDate, filterUser, filterPaymentNumber, filterTenant, searchTerm, sortConfig, paginationInfo.pageSize, t]
  );

  useEffect(() => {
    loadAuditLogs(0);
  }, [filterAction, filterDate, filterUser, filterPaymentNumber, filterTenant, searchTerm, sortConfig, paginationInfo.pageSize]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case "CREATED":
        return t('auditLog.actions.CREATED');
      case "EDITED":
        return t('auditLog.actions.EDITED');
      case "VOIDED":
        return t('auditLog.actions.VOIDED');
      default:
        return actionType;
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "CREATED":
        return "bg-green-100 text-green-800 border-green-200";
      case "EDITED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VOIDED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "CREATED":
        return <span className="w-4 h-4">➕</span>;
      case "EDITED":
        return <span className="w-4 h-4">✏️</span>;
      case "VOIDED":
        return <span className="w-4 h-4">❌</span>;
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setFilterAction("");
    setFilterDate("");
    setFilterUser("");
    setFilterPaymentNumber("");
    setFilterTenant("");
    setSearchTerm("");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < paginationInfo.totalPages) {
      loadAuditLogs(newPage);
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
      return sortConfig.sortDirection === "ASC" ? (
        <ChevronUp className="w-3 h-3 ml-1" />
      ) : (
        <ChevronDown className="w-3 h-3 ml-1" />
      );
    }
    return null;
  };


  const hasActiveFilters = filterAction || filterDate || filterUser || filterPaymentNumber || filterTenant || searchTerm;

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
        <div className="text-lg text-gray-600">{t('auditLog.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('auditLog.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('auditLog.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={() => loadAuditLogs(paginationInfo.currentPage)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
                {t('auditLog.refresh')}
              </button>
              
              
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Filters Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{t('auditLog.filters.title')}</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? t('auditLog.filters.hideFilters') : t('auditLog.filters.showFilters')}
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
                      {t('auditLog.filters.search')}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('auditLog.filters.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auditLog.filters.actionType')}
                    </label>
                    <select
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('auditLog.filters.allActions')}</option>
                      <option value="CREATED">{t('auditLog.actions.CREATED')}</option>
                      <option value="EDITED">{t('auditLog.actions.EDITED')}</option>
                      <option value="VOIDED">{t('auditLog.actions.VOIDED')}</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auditLog.filters.date')}
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

                  {/* Payment Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auditLog.filters.paymentNumber')}
                    </label>
                    <input
                      type="text"
                      value={filterPaymentNumber}
                      onChange={(e) => setFilterPaymentNumber(e.target.value)}
                      placeholder={t('auditLog.filters.paymentNumberPlaceholder')}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-600">
                      {t('auditLog.filters.foundLogs', { count: paginationInfo.totalItems })}
                    </span>
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                      {t('auditLog.filters.clearFilters')}
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
                  <span className="w-5 h-5 text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {auditLogs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
                style={{ borderLeftColor: "#1E40AF" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{t('auditLog.stats.totalLogs')}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {paginationInfo.totalItems}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <FileText className="w-6 h-6 text-blue-800" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
                style={{ borderLeftColor: "#10B981" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{t('auditLog.stats.created')}</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {auditLogs.filter((l) => l.actionType === "CREATED").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <span className="w-6 h-6 text-green-600 text-xl">➕</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
                style={{ borderLeftColor: "#3B82F6" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{t('auditLog.stats.edited')}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {auditLogs.filter((l) => l.actionType === "EDITED").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <span className="w-6 h-6 text-blue-600 text-xl">✏️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-t border-r border-b border-gray-200"
                style={{ borderLeftColor: "#EF4444" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{t('auditLog.stats.voided')}</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {auditLogs.filter((l) => l.actionType === "VOIDED").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <span className="w-6 h-6 text-red-600 text-xl">❌</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Wrapper */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { label: t('auditLog.table.timestamp'), field: "createdAt" },
                      { label: t('auditLog.table.action'), field: "actionType" },
                      { label: t('auditLog.table.paymentDetails'), field: "paymentNumber" },
                      { label: t('auditLog.table.tenant'), field: "tenantName" },
                      { label: t('auditLog.table.changedBy'), field: "changedBy" },
                      { label: t('auditLog.table.reason'), field: "changeReason" },
                    ].map(({ label, field }) => (
                      <th
                        key={field}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(field)}
                      >
                        <div className="flex items-center">
                          {label}
                          {getSortIndicator(field)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionTypeColor(
                            log.actionType
                          )}`}
                        >
                          {getActionIcon(log.actionType)}
                          <span className="ml-1.5">
                            {getActionTypeLabel(log.actionType)}
                          </span>
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            {log.paymentNumber}
                          </div>
                        </div>
                        {log.amount && (
                          <div className="text-sm text-gray-500 mt-1">
                            {t('auditLog.table.amount', { amount: log.amount.toLocaleString() })}
                          </div>
                        )}
                        {log.invoiceNumber && (
                          <div className="text-xs text-gray-400 mt-1">
                            {t('auditLog.table.invoice', { invoice: log.invoiceNumber })}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {log.tenantName ? (
                          <>
                            <div className="font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                {log.tenantName}
                              </div>
                            </div>
                            {log.roomNumber && (
                              <div className="text-sm text-gray-500 mt-1">
                                {t('auditLog.table.room', { room: log.roomNumber })}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">{t('auditLog.table.noData')}</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {log.changedByFullName || t('auditLog.table.changedBy', { id: log.changedById })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {t('auditLog.table.userId', { id: log.changedById })}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-600 max-w-xs truncate">
                          {log.changeReason || (
                            <span className="text-gray-400 italic">{t('auditLog.table.noReason')}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-4 p-4">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(log.createdAt)}
                      </div>
                      <div
                        className={`inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionTypeColor(
                          log.actionType
                        )}`}
                      >
                        {getActionIcon(log.actionType)}
                        <span className="ml-1.5">
                          {getActionTypeLabel(log.actionType)}
                        </span>
                      </div>
                    </div>
                    {log.amount && (
                      <div className="text-lg font-bold text-gray-900">
                        {t('auditLog.table.amount', { amount: log.amount.toLocaleString() })}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <div className="font-medium text-gray-900">
                        {log.paymentNumber}
                      </div>
                    </div>

                    {log.tenantName && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{log.tenantName}</div>
                          {log.roomNumber && (
                            <div className="text-sm text-gray-500">{t('auditLog.table.room', { room: log.roomNumber })}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {log.changedByFullName || t('auditLog.table.changedBy', { id: log.changedById })}
                        </div>
                        <div className="text-sm text-gray-500">{t('auditLog.table.userId', { id: log.changedById })}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="font-medium text-gray-900 mb-1">{t('auditLog.table.reason')}:</div>
                      <div className="text-gray-600 text-sm">
                        {log.changeReason || t('auditLog.table.noReason')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

{/* Pagination */}
{auditLogs.length > 0 && paginationInfo.totalPages > 1 && (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200">
    <div className="text-sm text-gray-600">
      {t('auditLog.pagination.showing', {
        from: paginationInfo.currentPage * paginationInfo.pageSize + 1,
        to: Math.min(
          (paginationInfo.currentPage + 1) * paginationInfo.pageSize,
          paginationInfo.totalItems
        ),
        total: paginationInfo.totalItems
      })}
    </div>

    <div className="flex items-center gap-2">
      {/* First Page - Double Chevron Left */}
      <button
        onClick={() => handlePageChange(0)}
        disabled={!paginationInfo.hasPrevious}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasPrevious
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        title={t('auditLog.pagination.firstPage')}
      >
        <ChevronLeft className="w-4 h-4" />
        <ChevronLeft className="w-4 h-4 -ml-3" />
      </button>

      {/* Previous Page */}
      <button
        onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
        disabled={!paginationInfo.hasPrevious}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasPrevious
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        <ChevronLeft className="w-4 h-4" />
        {t('auditLog.pagination.previous')}
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {Array.from(
          { length: Math.min(5, paginationInfo.totalPages) },
          (_, i) => {
            let pageNum;
            if (paginationInfo.totalPages <= 5) {
              pageNum = i;
            } else if (paginationInfo.currentPage <= 2) {
              pageNum = i;
            } else if (paginationInfo.currentPage >= paginationInfo.totalPages - 3) {
              pageNum = paginationInfo.totalPages - 5 + i;
            } else {
              pageNum = paginationInfo.currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${paginationInfo.currentPage === pageNum
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

      {/* Next Page */}
      <button
        onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
        disabled={!paginationInfo.hasNext}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasNext
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        {t('auditLog.pagination.next')}
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last Page - Double Chevron Right */}
      <button
        onClick={() => handlePageChange(paginationInfo.totalPages - 1)}
        disabled={!paginationInfo.hasNext}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${paginationInfo.hasNext
            ? "border-gray-300 hover:bg-gray-50 text-gray-700"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        title={t('auditLog.pagination.lastPage')}
      >
        <ChevronRight className="w-4 h-4" />
        <ChevronRight className="w-4 h-4 -ml-3" />
      </button>
    </div>

    {/* Page Size Selector */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{t('auditLog.pagination.itemsPerPage')}</span>
      <select
        value={paginationInfo.pageSize}
        onChange={(e) => {
          const newPageSize = parseInt(e.target.value);
          setPaginationInfo((prev) => ({
            ...prev,
            pageSize: newPageSize,
          }));
          loadAuditLogs(0); // Reset to first page when changing page size
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
          </div>

          {/* Empty State */}
          {auditLogs.length === 0 && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('auditLog.emptyState.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? t('auditLog.emptyState.filterMessage')
                  : t('auditLog.emptyState.defaultMessage')}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200"
                >
                  {t('auditLog.emptyState.clearFilters')}
                </button>
              )}
            </div>
          )}

          {/* Refresh Info */}
          {auditLogs.length > 0 && (
            <div className="flex justify-end p-4">
              <button
                onClick={() => loadAuditLogs(paginationInfo.currentPage)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-4 h-4" />
                {t('auditLog.pagination.lastUpdated', {
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                })}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentAuditLogComponent;