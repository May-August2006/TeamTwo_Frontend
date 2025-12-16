/** @format */

import React from "react";
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

// Mock data
const kpiData = [
  {
    id: 1,
    title: "Total Rent Collected (Today)",
    value: "45,820,000",
    currency: "MMK",
    subtitle: "+12% from yesterday",
    trend: "up" as const,
    trendValue: "12%",
    icon: <DollarSign className="w-5 h-5" />,
    color: "green",
  },
  {
    id: 2,
    title: "Total Outstanding Invoices",
    value: "24",
    subtitle: "184,500,000 MMK total",
    trend: "down" as const,
    trendValue: "5%",
    icon: <FileText className="w-5 h-5" />,
    color: "orange",
  },
  {
    id: 3,
    title: "Payments Recorded (Today)",
    value: "18",
    subtitle: "15 successful, 3 pending",
    trend: "up" as const,
    trendValue: "8%",
    icon: <CreditCard className="w-5 h-5" />,
    color: "blue",
  },
  {
    id: 4,
    title: "Collection Efficiency",
    value: "92%",
    subtitle: "This month average",
    trend: "up" as const,
    trendValue: "3%",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "purple",
  },
  {
    id: 5,
    title: "Average Payment Time",
    value: "2.3",
    unit: "days",
    subtitle: "From due date",
    trend: "down" as const,
    trendValue: "0.5 days",
    icon: <Clock className="w-5 h-5" />,
    color: "indigo",
  },
  {
    id: 6,
    title: "Disputed Payments",
    value: "3",
    subtitle: "Requiring attention",
    trend: "down" as const,
    trendValue: "2",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "red",
  },
];

const recentPayments = [
  {
    id: "1",
    tenant: "Fashion Store A",
    room: "A-101",
    amount: 2500000,
    method: "Bank Transfer",
    dateTime: "2024-01-15 14:30",
    status: "completed" as const,
    invoice: "INV-2024-001",
  },
  {
    id: "2",
    tenant: "Electronics World",
    room: "A-102",
    amount: 3200000,
    method: "Cash",
    dateTime: "2024-01-15 11:15",
    status: "completed" as const,
    invoice: "INV-2024-002",
  },
  {
    id: "3",
    tenant: "Food Court Stall 5",
    room: "B-201",
    amount: 1500000,
    method: "UPI",
    dateTime: "2024-01-15 10:45",
    status: "pending" as const,
    invoice: "INV-2024-003",
  },
  {
    id: "4",
    tenant: "Book Store Plus",
    room: "C-103",
    amount: 1800000,
    method: "Bank Transfer",
    dateTime: "2024-01-15 09:20",
    status: "completed" as const,
    invoice: "INV-2024-004",
  },
  {
    id: "5",
    tenant: "Jewelry Gallery",
    room: "D-105",
    amount: 4200000,
    method: "Bank Transfer",
    dateTime: "2024-01-15 08:15",
    status: "completed" as const,
    invoice: "INV-2024-005",
  },
];

const overdueInvoices = [
  {
    id: "INV-001",
    tenant: "Sports Gear Hub",
    room: "E-201",
    amount: 2850000,
    dueDate: "2024-01-10",
    overdueDays: 5,
    status: "overdue" as const,
  },
  {
    id: "INV-002",
    tenant: "Beauty Salon Spa",
    room: "F-102",
    amount: 1670000,
    dueDate: "2024-01-12",
    overdueDays: 3,
    status: "overdue" as const,
  },
  {
    id: "INV-003",
    tenant: "Coffee Corner",
    room: "G-103",
    amount: 1230000,
    dueDate: "2024-01-14",
    overdueDays: 1,
    status: "overdue" as const,
  },
];

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

interface OverviewSectionProps {
  onRecordPayment?: () => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  onRecordPayment,
}) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalCollected = recentPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = recentPayments.filter((p) => p.status === "pending");

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="text-white">
              {/* <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, Accountant!
              </h1> */}
              <p className="text-blue-100 mb-4">{formattedDate}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-100">Payments Today</div>
                    <div className="text-lg font-bold">
                      {recentPayments.length}
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
                      {(totalCollected / 1000000).toFixed(1)}M MMK
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
                      {pendingPayments.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="flex-shrink-0">
              <button
                onClick={onRecordPayment}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition duration-200 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Record Payment
              </button>
            </div> */}
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
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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
                  {recentPayments.map((payment) => (
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
                          {payment.amount.toLocaleString()} MMK
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                          <CreditCard className="w-3 h-3" />
                          {payment.method}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDateTime(payment.dateTime)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.status === "completed" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
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
              {recentPayments.map((payment) => (
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
                        payment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status === "completed" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <div className="font-bold">
                        {payment.amount.toLocaleString()} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Method:</span>
                      <div className="font-medium">{payment.method}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <div>{formatDateTime(payment.dateTime)}</div>
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

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Overdue Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Overdue Invoices
                  </h3>
                  <p className="text-sm text-gray-600">
                    Requiring immediate attention
                  </p>
                </div>
                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {overdueInvoices.length} overdue
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 hover:bg-red-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {invoice.tenant}
                      </div>
                      <div className="text-sm text-gray-500">
                        Room {invoice.room}
                      </div>
                      <div className="text-xs text-gray-400">{invoice.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {invoice.amount.toLocaleString()} MMK
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.overdueDays} days overdue
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      Due: {formatDate(invoice.dueDate)}
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Send Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <Link
                to="/accountant/overdue-outstanding"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-blue-600 hover:text-blue-800 font-medium"
              >
                View all overdue invoices
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-500">Frequently used actions</p>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.action === "record" && onRecordPayment) {
                      onRecordPayment();
                    }
                    // Handle other actions
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md ${
                    action.color === "blue"
                      ? "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                      : action.color === "green"
                      ? "border-green-200 hover:border-green-300 hover:bg-green-50"
                      : action.color === "purple"
                      ? "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                      : "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  <div
                    className={`p-3 rounded-full mb-2 ${
                      action.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : action.color === "green"
                        ? "bg-green-100 text-green-600"
                        : action.color === "purple"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {action.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {recentPayments.length}
                  </div>
                  <div className="text-gray-600">Today's Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {(totalCollected / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-gray-600">Total Collected</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">94%</div>
                  <div className="text-gray-600">Collection Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">
                    {overdueInvoices.length}
                  </div>
                  <div className="text-gray-600">Overdue</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">System Status</h3>
              <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                All Systems Operational
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Payment Processing</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Invoice Generation</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Report Generation</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Database</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm">Healthy</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-700 text-xs text-blue-200">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
