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
      icon: <Building2 className="w-6 h-6 text-red-600" />,
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
      color: "bg-red-600",
    },
    {
      category: "Food & Beverage",
      amount: "$3.1M",
      percentage: 24.2,
      color: "bg-green-600",
    },
    {
      category: "Entertainment",
      amount: "$1.8M",
      percentage: 14.1,
      color: "bg-purple-600",
    },
    {
      category: "Services",
      amount: "$1.7M",
      percentage: 13.3,
      color: "bg-orange-600",
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
    <div className="p-4 sm:p-8 space-y-6 bg-stone-50 min-h-screen">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Strategic Overview</h2>
        <p className="text-red-100">
          Comprehensive financial performance and operational metrics for
          strategic decision-making
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 hover:shadow-xl transition duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">
                  {kpi.value}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">{kpi.icon}</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">{kpi.description}</span>
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
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-stone-900">
              Revenue by Category
            </h3>
            <PieChart className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-4">
            {revenueByCategory.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-red-50/30 transition duration-150">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-bold text-stone-700">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">
                    {item.amount}
                  </p>
                  <p className="text-xs text-stone-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly Performance */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-stone-900">
              Quarterly Performance
            </h3>
            <BarChart3 className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-4">
            {quarterlyData.map((quarter, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-stone-50 rounded-lg hover:bg-red-50/30 transition duration-150"
              >
                <div>
                  <p className="font-bold text-stone-900">
                    {quarter.quarter}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-stone-600">
                    Revenue:{" "}
                    <span className="font-bold text-green-600">{quarter.revenue}</span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Occupancy:{" "}
                    <span className="font-bold text-red-600">{quarter.occupancy}</span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Profit:{" "}
                    <span className="font-bold text-stone-900">{quarter.profit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Highlights */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">
          Strategic Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-5 bg-red-50 rounded-lg border border-red-100">
            <Building2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-stone-900">Portfolio Growth</h4>
            <p className="text-sm text-stone-600">
              5 new properties acquired this year
            </p>
          </div>
          <div className="text-center p-5 bg-green-50 rounded-lg border border-green-100">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-bold text-stone-900">Revenue Growth</h4>
            <p className="text-sm text-stone-600">
              15.2% increase year-over-year
            </p>
          </div>
          <div className="text-center p-5 bg-purple-50 rounded-lg border border-purple-100">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-bold text-stone-900">Tenant Satisfaction</h4>
            <p className="text-sm text-stone-600">92% tenant retention rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BODHome;