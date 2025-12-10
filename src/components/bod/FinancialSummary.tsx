/** @format */

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, PieChart, Calendar, TrendingDown, BarChart, Loader2 } from "lucide-react";
import { dashboardApi, type DashboardMetrics } from "../../api/dashboardApi";

const FinancialSummary: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError("Failed to load financial data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "$0";
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">Loading financial data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">{error}</div>
          <button
            onClick={fetchDashboardMetrics}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const financialData = {
    quarterly: [
      { quarter: "Q1 2024", rentCollected: formatCompactCurrency(2400000), totalRevenue: formatCompactCurrency(2800000), expenses: formatCompactCurrency(1200000), netProfit: formatCompactCurrency(1600000) },
      { quarter: "Q2 2024", rentCollected: formatCompactCurrency(2600000), totalRevenue: formatCompactCurrency(3200000), expenses: formatCompactCurrency(1400000), netProfit: formatCompactCurrency(1800000) },
      { quarter: "Q3 2024", rentCollected: formatCompactCurrency(2800000), totalRevenue: formatCompactCurrency(3500000), expenses: formatCompactCurrency(1500000), netProfit: formatCompactCurrency(2000000) },
      { quarter: "Q4 2024", rentCollected: formatCompactCurrency(2700000), totalRevenue: formatCompactCurrency(3300000), expenses: formatCompactCurrency(1300000), netProfit: formatCompactCurrency(2000000) },
    ],
    yearly: [
      { year: "2022", totalRevenue: "$10.6M", totalExpenses: "$6.2M", netProfit: "$4.4M", profitMargin: "41.5%" },
      { year: "2023", totalRevenue: "$11.9M", totalExpenses: "$6.5M", netProfit: "$5.4M", profitMargin: "45.4%" },
      { year: "2024", totalRevenue: formatCompactCurrency(metrics?.totalRevenue), totalExpenses: formatCompactCurrency(metrics?.totalExpenses), netProfit: formatCompactCurrency(metrics?.netProfit), profitMargin: metrics?.profitMargin ? `${metrics.profitMargin.toFixed(1)}%` : "0%" },
    ],
  };

  const revenueExpenseData = [
    { month: "Jan", revenue: 2.8, expenses: 1.2 },
    { month: "Feb", revenue: 3.2, expenses: 1.4 },
    { month: "Mar", revenue: 3.5, expenses: 1.5 },
    { month: "Apr", revenue: 3.3, expenses: 1.3 },
    { month: "May", revenue: 3.6, expenses: 1.4 },
    { month: "Jun", revenue: 3.8, expenses: 1.6 },
  ];

  const maxValue = Math.max(...revenueExpenseData.map(d => Math.max(d.revenue, d.expenses)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Financial Summary</h2>
            <p className="text-blue-100">
              Quarterly and yearly financial overview for strategic assessment
            </p>
          </div>
          <button
            onClick={fetchDashboardMetrics}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm backdrop-blur-sm border border-white/20"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rent Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.totalRentCollected)}
              </p>
              <p className="text-sm text-gray-500 mt-1">2024 Annual</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200">
              <DollarSign className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.3% from last year</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">2024 Annual</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+15.2% from last year</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.totalExpenses)}
              </p>
              <p className="text-sm text-gray-500 mt-1">2024 Annual</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1 rotate-180" />
            <span className="text-green-600 font-medium">+6.2% from last year</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.netProfit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">2024 Annual</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <PieChart className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-green-600 font-medium">
              Profit Margin: {metrics?.profitMargin ? `${metrics.profitMargin.toFixed(1)}%` : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue vs Expenses</h3>
            <p className="text-sm text-gray-600 mt-1">Monthly comparison chart</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <BarChart className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        
        <div className="flex items-end space-x-4 h-64">
          {revenueExpenseData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="text-center mb-2">
                <p className="text-xs font-bold text-gray-900">{item.month}</p>
              </div>
              <div className="w-full flex space-x-1">
                <div className="flex-1 relative">
                  <div 
                    className="bg-gradient-to-t from-blue-500 to-blue-700 rounded-t-lg transition-all duration-300 hover:opacity-90"
                    style={{ height: `${(item.revenue / maxValue) * 100}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-700">
                    ${item.revenue}M
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div 
                    className="bg-gradient-to-t from-red-500 to-red-700 rounded-t-lg transition-all duration-300 hover:opacity-90"
                    style={{ height: `${(item.expenses / maxValue) * 100}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700">
                    ${item.expenses}M
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-sm mr-2"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-700 rounded-sm mr-2"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Quarterly Performance 2024</h3>
            <p className="text-sm text-gray-600 mt-1">Detailed quarterly financial breakdown</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <Calendar className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialData.quarterly.map((quarter, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-5 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-900 text-lg">{quarter.quarter}</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  +14.2%
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-600">Rent Collected</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">{quarter.rentCollected}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">Revenue</p>
                    <p className="font-bold text-blue-900">{quarter.totalRevenue}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700">Net Profit</p>
                    <p className="font-bold text-green-900">{quarter.netProfit}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Trends */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Yearly Financial Trends</h3>
            <p className="text-sm text-gray-600 mt-1">Three-year performance comparison</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        <div className="space-y-4">
          {financialData.yearly.map((year, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-200 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-300">
                  <span className="text-xl font-bold text-blue-900">{year.year}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{year.totalRevenue}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      <span className="text-sm text-gray-600">Expenses: {year.totalExpenses}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                  {year.profitMargin} margin
                </span>
                <p className="text-lg font-bold text-green-700 mt-1">{year.netProfit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;