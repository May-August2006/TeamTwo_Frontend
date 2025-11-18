/** @format */

import React from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  PieChart,
  BarChart3,
} from "lucide-react";

const BODHome: React.FC = () => {
  // Key Performance Indicators
  const kpis = [
    {
      title: "Total Revenue",
      value: "$12.8M",
      change: "+15.2%",
      trend: "up",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      description: "Year-to-date total revenue",
    },
    {
      title: "Occupancy Rate",
      value: "96.5%",
      change: "+2.3%",
      trend: "up",
      icon: <Building2 className="w-6 h-6 text-blue-600" />,
      description: "Current occupancy across all properties",
    },
    {
      title: "Collection Efficiency",
      value: "94.8%",
      change: "+1.7%",
      trend: "up",
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      description: "Percentage of billed amount collected",
    },
    {
      title: "Active Tenants",
      value: "342",
      change: "+18",
      trend: "up",
      icon: <Users className="w-6 h-6 text-orange-600" />,
      description: "Currently managed tenants",
    },
  ];

  // Revenue by Category
  const revenueByCategory = [
    {
      category: "Retail",
      amount: "$6.2M",
      percentage: 48.4,
      color: "bg-blue-500",
    },
    {
      category: "Food & Beverage",
      amount: "$3.1M",
      percentage: 24.2,
      color: "bg-green-500",
    },
    {
      category: "Entertainment",
      amount: "$1.8M",
      percentage: 14.1,
      color: "bg-purple-500",
    },
    {
      category: "Services",
      amount: "$1.7M",
      percentage: 13.3,
      color: "bg-orange-500",
    },
  ];

  // Quarterly Performance
  const quarterlyData = [
    { quarter: "Q1", revenue: "$2.8M", occupancy: "92%", profit: "$1.2M" },
    { quarter: "Q2", revenue: "$3.2M", occupancy: "94%", profit: "$1.4M" },
    { quarter: "Q3", revenue: "$3.5M", occupancy: "96%", profit: "$1.6M" },
    { quarter: "Q4", revenue: "$3.3M", occupancy: "97%", profit: "$1.5M" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Strategic Overview</h2>
        <p className="text-indigo-100">
          Comprehensive financial performance and operational metrics for
          strategic decision-making
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {kpi.value}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">{kpi.icon}</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{kpi.description}</span>
              <span
                className={`text-sm font-medium ${
                  kpi.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue by Category
            </h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {revenueByCategory.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.amount}
                  </p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Quarterly Performance
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {quarterlyData.map((quarter, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {quarter.quarter}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-gray-600">
                    Revenue:{" "}
                    <span className="font-semibold">{quarter.revenue}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Occupancy:{" "}
                    <span className="font-semibold">{quarter.occupancy}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Profit:{" "}
                    <span className="font-semibold">{quarter.profit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Highlights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Strategic Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Portfolio Growth</h4>
            <p className="text-sm text-gray-600">
              5 new properties acquired this year
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Revenue Growth</h4>
            <p className="text-sm text-gray-600">
              15.2% increase year-over-year
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Tenant Satisfaction</h4>
            <p className="text-sm text-gray-600">92% tenant retention rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BODHome;
