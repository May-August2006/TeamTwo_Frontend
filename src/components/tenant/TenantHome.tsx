/** @format */

import React from "react";
import {
  FileText,
  CreditCard,
  Calendar,
  Wrench,
  TrendingDown,
  CheckCircle,
} from "lucide-react";

const TenantHome: React.FC = () => {
  // Current lease information
  const leaseInfo = {
    property: "Main Mall - Unit A-102",
    rent: "$2,500",
    dueDate: "15th of each month",
    nextPayment: "Jan 15, 2024",
    leaseEnd: "Dec 31, 2024",
    space: "1,200 sq ft",
    businessType: "Retail - Fashion",
  };

  // Quick stats
  const quickStats = [
    {
      title: "Current Balance",
      value: "$2,500",
      status: "Due",
      color: "text-red-600",
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      title: "Last Payment",
      value: "$2,500",
      status: "Paid Dec 15",
      color: "text-green-600",
      icon: <CheckCircle className="w-6 h-6" />,
    },
    {
      title: "Open Invoices",
      value: "1",
      status: "Unpaid",
      color: "text-orange-600",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "Maintenance",
      value: "0",
      status: "No open requests",
      color: "text-gray-600",
      icon: <Wrench className="w-6 h-6" />,
    },
  ];

  // Recent activity
  const recentActivity = [
    {
      id: 1,
      type: "invoice",
      message: "January rent invoice generated",
      date: "2 days ago",
      amount: "$2,500",
      status: "unpaid",
    },
    {
      id: 2,
      type: "payment",
      message: "December rent payment received",
      date: "3 weeks ago",
      amount: "$2,500",
      status: "paid",
    },
    {
      id: 3,
      type: "maintenance",
      message: "AC repair request completed",
      date: "1 month ago",
      status: "resolved",
    },
  ];

  // Upcoming dates
  const upcomingDates = [
    { event: "Rent Due", date: "Jan 15, 2024", important: true },
    { event: "Lease Renewal", date: "Nov 30, 2024", important: false },
    { event: "Annual Inspection", date: "Mar 15, 2024", important: false },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, John!</h2>
        <p className="text-green-100">
          Here's your current rental account overview and important updates.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                {stat.icon}
              </div>
            </div>
            <p className="text-sm text-gray-500">{stat.status}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lease Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Lease Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Lease Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Property</p>
                <p className="font-semibold text-gray-900">
                  {leaseInfo.property}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Rent</p>
                <p className="font-semibold text-gray-900">{leaseInfo.rent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Payment Due</p>
                <p className="font-semibold text-gray-900">
                  {leaseInfo.nextPayment}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lease End Date</p>
                <p className="font-semibold text-gray-900">
                  {leaseInfo.leaseEnd}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Space</p>
                <p className="font-semibold text-gray-900">{leaseInfo.space}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Type</p>
                <p className="font-semibold text-gray-900">
                  {leaseInfo.businessType}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "payment"
                        ? "bg-green-100 text-green-600"
                        : activity.type === "invoice"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {activity.type === "payment" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : activity.type === "invoice" ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{activity.date}</p>
                      {activity.amount && (
                        <span
                          className={`text-xs font-medium ${
                            activity.status === "paid"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {activity.amount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Dates
            </h3>
            <div className="space-y-3">
              {upcomingDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    date.important
                      ? "bg-red-50 border border-red-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        date.important ? "text-red-900" : "text-gray-900"
                      }`}
                    >
                      {date.event}
                    </span>
                    <Calendar
                      className={`w-4 h-4 ${
                        date.important ? "text-red-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-sm ${
                      date.important ? "text-red-700" : "text-gray-600"
                    }`}
                  >
                    {date.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <FileText className="w-5 h-5" />
                <span>View Current Invoice</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <CreditCard className="w-5 h-5" />
                <span>Make a Payment</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                <Wrench className="w-5 h-5" />
                <span>Submit Maintenance Request</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantHome;
