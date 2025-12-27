/** @format */

import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  CreditCard,
  FileText,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Eye,
} from "lucide-react";
import { dashboardApi } from "../../api/accdashboardApi";
import type { AccountantDashboard } from "../../types/accountantDashboard";

interface OverviewSectionProps {
  onRecordPayment?: () => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<AccountantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getAccountantDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(t('overview.error'));
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get first 4 recent payments or all if showAllPayments is true
  const displayedPayments = dashboardData?.recentPayments?.slice(0, showAllPayments ? dashboardData.recentPayments.length : 4) || [];
  const hasMorePayments = (dashboardData?.recentPayments?.length || 0) > 4;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('overview.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || t('overview.error')}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('overview.retry')}
          </button>
        </div>
      </div>
    );
  }

  // KPI data with i18n
  const kpiData = [
    {
      id: 1,
      title: t('overview.kpis.totalRentToday'),
      value: formatCurrency(dashboardData.totalRentCollectedToday || 0),
      currency: t('overview.currency.mmk'),
      subtitle: t('overview.kpiSubtitles.todayCollection'),
      icon: <DollarSign className="w-5 h-5" />,
      color: "green",
    },
    {
      id: 2,
      title: t('overview.kpis.outstandingInvoices'),
      value: dashboardData.totalOutstandingInvoicesCount?.toString() || "0",
      subtitle: t('overview.kpiSubtitles.totalAmount', { 
        amount: formatCurrency(dashboardData.totalOutstandingInvoicesAmount || 0) 
      }),
      icon: <FileText className="w-5 h-5" />,
      color: "orange",
    },
    {
      id: 3,
      title: t('overview.kpis.paymentsRecordedToday'),
      value: dashboardData.paymentsRecordedToday?.toString() || "0",
      subtitle: t('overview.kpiSubtitles.successPending', { 
        success: dashboardData.successfulPaymentsToday || 0, 
        pending: dashboardData.pendingPaymentsToday || 0 
      }),
      icon: <CreditCard className="w-5 h-5" />,
      color: "blue",
    },
    {
      id: 4,
      title: t('overview.kpis.collectionEfficiency'),
      value: `${dashboardData.collectionEfficiency?.toFixed(1) || "0"}%`,
      subtitle: t('overview.kpiSubtitles.monthAverage'),
      icon: <BarChart3 className="w-5 h-5" />,
      color: "purple",
    },
    {
      id: 5,
      title: t('overview.kpis.avgPaymentTime'),
      value: dashboardData.averagePaymentTime?.toString() || "0",
      unit: t('overview.currency.days'),
      subtitle: t('overview.kpiSubtitles.fromDueDate'),
      icon: <Clock className="w-5 h-5" />,
      color: "indigo",
    },
    {
      id: 6,
      title: t('overview.kpis.disputedPayments'),
      value: dashboardData.disputedPayments?.toString() || "0",
      subtitle: t('overview.kpiSubtitles.requireAttention'),
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "red",
    },
  ];

  // Function to get translated status
  const getTranslatedStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return t('overview.recentPayments.status.completed');
      case "PENDING":
        return t('overview.recentPayments.status.pending');
      case "FAILED":
        return t('overview.recentPayments.status.failed');
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {t('overview.title')}
              </h1>
              <p className="text-blue-100 mb-4">{formattedDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-200 relative"
            style={{
              border: '1px solid #E5E7EB',
              borderLeft: '6px solid #1E40AF'
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {kpi.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.value}
                    {kpi.unit && (
                      <span className="text-lg ml-1">{kpi.unit}</span>
                    )}
                  </span>
                  {kpi.currency && (
                    <span className="text-sm text-gray-500">
                      {kpi.currency}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  kpi.color === "green"
                    ? "bg-green-50"
                    : kpi.color === "blue"
                    ? "bg-blue-50"
                    : kpi.color === "orange"
                    ? "bg-orange-50"
                    : kpi.color === "purple"
                    ? "bg-purple-50"
                    : kpi.color === "indigo"
                    ? "bg-indigo-50"
                    : "bg-red-50"
                }`}
              >
                {React.cloneElement(kpi.icon, {
                  className: `w-5 h-5 ${
                    kpi.color === "green"
                      ? "text-green-600"
                      : kpi.color === "blue"
                      ? "text-blue-600"
                      : kpi.color === "orange"
                      ? "text-orange-600"
                      : kpi.color === "purple"
                      ? "text-purple-600"
                      : kpi.color === "indigo"
                      ? "text-indigo-600"
                      : "text-red-600"
                  }`,
                })}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {kpi.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Payments - Full Width */}
      <div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('overview.recentPayments.title')}
                </h3>
                <p className="text-sm text-gray-500">
                  {showAllPayments 
                    ? t('overview.recentPayments.subtitleAll') 
                    : t('overview.recentPayments.subtitleLatest')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchDashboardData}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('overview.actions.refresh')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {hasMorePayments && (
                  <button
                    onClick={() => setShowAllPayments(!showAllPayments)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    {showAllPayments 
                      ? t('overview.recentPayments.showLess') 
                      : t('overview.recentPayments.viewAll', { 
                          count: dashboardData.recentPayments?.length || 0 
                        })}
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      showAllPayments ? 'rotate-90' : ''
                    }`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('overview.recentPayments.tableHeaders.tenantRoom')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('overview.recentPayments.tableHeaders.amount')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('overview.recentPayments.tableHeaders.method')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('overview.recentPayments.tableHeaders.time')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('overview.recentPayments.tableHeaders.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedPayments.length > 0 ? (
                  displayedPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {payment.tenant}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t('overview.recentPayments.roomLabel', { room: payment.room })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {payment.invoice}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">
                          {t('overview.recentPayments.amountLabel', { 
                            amount: formatCurrency(payment.amount || 0) 
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                          <CreditCard className="w-3 h-3" />
                          {payment.method}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {payment.time}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            payment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status === "COMPLETED" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : payment.status === "PENDING" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {getTranslatedStatus(payment.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      {t('overview.recentPayments.noPayments')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden p-4 space-y-4">
            {displayedPayments.length > 0 ? (
              displayedPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">
                        {payment.tenant}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('overview.recentPayments.roomLabel', { room: payment.room })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.invoice}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status === "COMPLETED" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : payment.status === "PENDING" ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {getTranslatedStatus(payment.status)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">
                        {t('overview.recentPayments.tableHeaders.amount')}:
                      </span>
                      <div className="font-bold">
                        {t('overview.recentPayments.amountLabel', { 
                          amount: formatCurrency(payment.amount || 0) 
                        })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t('overview.recentPayments.tableHeaders.method')}:
                      </span>
                      <div className="font-medium">{payment.method}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t('overview.recentPayments.tableHeaders.time')}:
                      </span>
                      <div>{payment.time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title={t('overview.actions.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('overview.recentPayments.noPayments')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;