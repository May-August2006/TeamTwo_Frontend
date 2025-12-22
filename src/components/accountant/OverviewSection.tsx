/** @format */

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  CreditCard,
  FileText,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Plus,
  Download,
  Eye,
  MoreVertical,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../api/accdashboardApi";
import type { AccountantDashboard } from "../../types/accountantDashboard";

interface OverviewSectionProps {
  onRecordPayment?: () => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  onRecordPayment,
}) => {
  const [dashboardData, setDashboardData] = useState<AccountantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError("Failed to load dashboard data");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickActions = [
    {
      id: 1,
      title: "Record Payment",
      icon: <Plus className="w-5 h-5" />,
      color: "blue",
      action: "record",
    },
    {
      id: 2,
      title: "Generate Reports",
      icon: <Download className="w-5 h-5" />,
      color: "green",
      action: "reports",
    },
    {
      id: 3,
      title: "View All Invoices",
      icon: <FileText className="w-5 h-5" />,
      color: "purple",
      action: "invoices",
    },
    {
      id: 4,
      title: "Manage Late Fees",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "orange",
      action: "late-fees",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || "Failed to load dashboard"}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Mock trend data (you would need to calculate this from backend)
  const kpiData = [
    {
      id: 1,
      title: "Total Rent Collected (Today)",
      value: formatCurrency(dashboardData.totalRentCollectedToday || 0),
      currency: "MMK",
      subtitle: "Today's collection",
      trend: "up" as const,
      trendValue: "+12%",
      icon: <DollarSign className="w-5 h-5" />,
      color: "green",
    },
    {
      id: 2,
      title: "Total Outstanding Invoices",
      value: dashboardData.totalOutstandingInvoicesCount?.toString() || "0",
      subtitle: `${formatCurrency(dashboardData.totalOutstandingInvoicesAmount || 0)} MMK total`,
      trend: "down" as const,
      trendValue: "-5%",
      icon: <FileText className="w-5 h-5" />,
      color: "orange",
    },
    {
      id: 3,
      title: "Payments Recorded (Today)",
      value: dashboardData.paymentsRecordedToday?.toString() || "0",
      subtitle: `${dashboardData.successfulPaymentsToday || 0} successful, ${dashboardData.pendingPaymentsToday || 0} pending`,
      trend: "up" as const,
      trendValue: "+8%",
      icon: <CreditCard className="w-5 h-5" />,
      color: "blue",
    },
    {
      id: 4,
      title: "Collection Efficiency",
      value: `${dashboardData.collectionEfficiency?.toFixed(1) || "0"}%`,
      subtitle: "This month average",
      trend: "up" as const,
      trendValue: "+3%",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "purple",
    },
    {
      id: 5,
      title: "Average Payment Time",
      value: dashboardData.averagePaymentTime?.toString() || "0",
      unit: "days",
      subtitle: "From due date",
      trend: "down" as const,
      trendValue: "-0.5 days",
      icon: <Clock className="w-5 h-5" />,
      color: "indigo",
    },
    {
      id: 6,
      title: "Disputed Payments",
      value: dashboardData.disputedPayments?.toString() || "0",
      subtitle: "Requiring attention",
      trend: "down" as const,
      trendValue: "-2",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "red",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, Accountant!
              </h1>
              <p className="text-blue-100 mb-4">{formattedDate}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-100">Payments Today</div>
                    <div className="text-lg font-bold">
                      {dashboardData.paymentsRecordedToday || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-100">Collected Today</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(dashboardData.totalRentCollectedToday || 0)} MMK
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-100">Pending</div>
                    <div className="text-lg font-bold">
                      {dashboardData.pendingPaymentsToday || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={onRecordPayment}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition duration-200 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
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

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">{kpi.subtitle}</span>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {kpi.trendValue}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Payments & Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Payments
                  </h3>
                  <p className="text-sm text-gray-500">
                    Payments recorded today
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={fetchDashboardData}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <Link
                    to="/accountant/payment"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    View all
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant & Room
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.recentPayments?.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {payment.tenant}
                        </div>
                        <div className="text-sm text-gray-500">
                          Room {payment.room}
                        </div>
                        <div className="text-xs text-gray-400">
                          {payment.invoice}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(payment.amount || 0)} MMK
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
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden p-4 space-y-4">
              {dashboardData.recentPayments?.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">
                        {payment.tenant}
                      </div>
                      <div className="text-sm text-gray-500">
                        Room {payment.room}
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
                      {payment.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <div className="font-bold">
                        {formatCurrency(payment.amount || 0)} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Method:</span>
                      <div className="font-medium">{payment.method}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <div>{payment.time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        </div>
      </div>
  );
};

export default OverviewSection;