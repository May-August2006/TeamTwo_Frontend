/** @format */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  TrendingDown, 
  BarChart, 
  Loader2, 
  Building, 
  Users 
} from "lucide-react";
import { dashboardApi } from "../../api/dashboardApi";
import { expenseApi } from "../../api/ExpenseAPI";

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  occupancyRate: number;
  collectionEfficiency: number;
  totalUnits: number;
  occupiedUnits: number;
  activeTenants: number;
  vacantUnits: number;
  monthlyRevenue?: number;
}

const FinancialSummary: React.FC = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');

  useEffect(() => {
    fetchFinancialMetrics();
  }, [period]);

  const fetchFinancialMetrics = async () => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching financial metrics...');
        const data = await dashboardApi.getFinancialMetrics();
        console.log('Financial metrics received:', data);
        
        // Check if data has expenses
        if (data.totalExpenses === 0) {
            console.warn('Total expenses is 0. Check backend data.');
            // Try to get expenses directly
            try {
                const expenseSummary = await expenseApi.getExpenseSummary();
                console.log('Expense summary:', expenseSummary);
            } catch (expenseErr) {
                console.error('Failed to get expense summary:', expenseErr);
            }
        }
        
        setMetrics(data);
        
    } catch (err: any) {
      setError("Failed to load financial data: " + (err.message || "Unknown error"));
      console.error("Error fetching financial metrics:", err);
      
      // Fallback: try to get basic metrics from old endpoint
      try {
        const fallbackData = await dashboardApi.getMetrics();
        setMetrics({
          totalRevenue: fallbackData.totalRevenue || 0,
          totalExpenses: 0, // Not available in old endpoint
          netProfit: fallbackData.totalRevenue || 0,
          profitMargin: 0,
          occupancyRate: fallbackData.occupancyRate || 0,
          collectionEfficiency: fallbackData.collectionEfficiency || 0,
          totalUnits: 0,
          occupiedUnits: 0,
          activeTenants: fallbackData.activeTenants || 0,
          vacantUnits: 0,
          monthlyRevenue: fallbackData.revenueThisMonth || 0
        });
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "MMK 0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('MMK', 'MMK ');
  };

  const formatCompactCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "MMK 0";
    if (Math.abs(amount) >= 1000000000) {
      return `MMK ${(amount / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(amount) >= 1000000) {
      return `MMK ${(amount / 1000000).toFixed(1)}M`;
    } else if (Math.abs(amount) >= 1000) {
      return `MMK ${(amount / 1000).toFixed(1)}K`;
    }
    return `MMK ${amount}`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return "0%";
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">
          {t('financialSummary.loading')}
        </span>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">{error}</div>
          <button
            onClick={fetchFinancialMetrics}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
          >
            {t('financialSummary.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data based on available metrics (adjusted for MMK - values in millions)
  const revenueExpenseData = metrics ? [
    { month: "Jan", revenue: metrics.monthlyRevenue ? metrics.monthlyRevenue / 1000000 : 2.8, expenses: (metrics.totalExpenses / 12) / 1000000 },
    { month: "Feb", revenue: metrics.monthlyRevenue ? metrics.monthlyRevenue / 1000000 : 3.2, expenses: (metrics.totalExpenses / 12) / 1000000 },
    { month: "Mar", revenue: metrics.monthlyRevenue ? metrics.monthlyRevenue / 1000000 : 3.5, expenses: (metrics.totalExpenses / 12) / 1000000 },
    { month: "Apr", revenue: metrics.monthlyRevenue ? metrics.monthlyRevenue / 1000000 : 3.3, expenses: (metrics.totalExpenses / 12) / 1000000 },
    { month: "May", revenue: metrics.monthlyRevenue ? metrics.monthlyRevenue / 1000000 : 3.6, expenses: (metrics.totalExpenses / 12) / 1000000 },
    { month: "Jun", revenue: metrics.monthlyRevenue ? metrics.monthlyRevenue / 1000000 : 3.8, expenses: (metrics.totalExpenses / 12) / 1000000 },
  ] : [];

  const maxValue = revenueExpenseData.length > 0 
    ? Math.max(...revenueExpenseData.map(d => Math.max(d.revenue, d.expenses)))
    : 1;

  // Yearly trends data with MMK
  const yearlyData = metrics ? [
    { 
      year: "2022", 
      totalRevenue: "MMK 10.6B", 
      totalExpenses: "MMK 6.2B", 
      netProfit: "MMK 4.4B", 
      profitMargin: "41.5%" 
    },
    { 
      year: "2023", 
      totalRevenue: "MMK 11.9B", 
      totalExpenses: "MMK 6.5B", 
      netProfit: "MMK 5.4B", 
      profitMargin: "45.4%" 
    },
    { 
      year: "2024", 
      totalRevenue: formatCompactCurrency(metrics.totalRevenue), 
      totalExpenses: formatCompactCurrency(metrics.totalExpenses), 
      netProfit: formatCompactCurrency(metrics.netProfit), 
      profitMargin: formatPercentage(metrics.profitMargin)
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('financialSummary.title')}
          </h1>
          <p className="text-gray-600">
            {t('financialSummary.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg ${period === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t('financialSummary.period.monthly')}
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-4 py-2 rounded-lg ${period === 'quarter' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t('financialSummary.period.quarterly')}
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg ${period === 'year' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t('financialSummary.period.yearly')}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && metrics && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {t('financialSummary.error.title')}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-600">
                {t('financialSummary.cards.totalRevenue.title')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t(`financialSummary.cards.totalRevenue.period.${period}`)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300">
              <DollarSign className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">
              {metrics?.profitMargin 
                ? t('financialSummary.cards.totalRevenue.margin', { 
                    margin: formatPercentage(metrics.profitMargin) 
                  })
                : 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-xl shadow-lg border border-red-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-red-600">
                {t('financialSummary.cards.totalExpenses.title')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.totalExpenses)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('financialSummary.cards.totalExpenses.subtitle')}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl border border-red-300">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <div className="text-gray-600">
              {metrics?.totalRevenue && metrics.totalRevenue > 0 
                ? t('financialSummary.cards.totalExpenses.ratio', { 
                    ratio: formatPercentage((metrics.totalExpenses / metrics.totalRevenue) * 100)
                  })
                : 'No revenue data'}
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-green-600">
                {t('financialSummary.cards.netProfit.title')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.netProfit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('financialSummary.cards.netProfit.subtitle')}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
              <PieChart className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-green-600 font-medium">
              {t('financialSummary.cards.netProfit.margin', { 
                margin: formatPercentage(metrics?.profitMargin) 
              })}
            </span>
          </div>
        </div>

        {/* Occupancy & Collection Card */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-purple-600">
                {t('financialSummary.cards.performanceMetrics.title')}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatPercentage(metrics?.occupancyRate)}</p>
                  <p className="text-xs text-gray-500">
                    {t('financialSummary.cards.performanceMetrics.occupancy')}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatPercentage(metrics?.collectionEfficiency)}</p>
                  <p className="text-xs text-gray-500">
                    {t('financialSummary.cards.performanceMetrics.collection')}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl border border-purple-300">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <Building className="w-4 h-4 mr-1" />
            <span>
              {t('financialSummary.cards.performanceMetrics.units', { 
                occupied: metrics?.occupiedUnits || 0, 
                total: metrics?.totalUnits || 0 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Health Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('financialSummary.profitabilityAnalysis.title')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('financialSummary.profitabilityAnalysis.subtitle')}
              </p>
            </div>
            <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <PieChart className="w-5 h-5 text-green-700" />
            </div>
          </div>
          
          {metrics && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">
                  {t('financialSummary.profitabilityAnalysis.grossRevenue')}
                </span>
                <span className="font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">
                  {t('financialSummary.profitabilityAnalysis.totalExpenses')}
                </span>
                <span className="font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <span className="text-gray-900 font-bold">
                  {t('financialSummary.profitabilityAnalysis.netProfit')}
                </span>
                <span className="font-bold text-green-700 text-lg">{formatCurrency(metrics.netProfit)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">
                  {t('financialSummary.profitabilityAnalysis.profitMargin')}
                </span>
                <span className="font-bold text-blue-700">{formatPercentage(metrics.profitMargin)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Operational Metrics */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('financialSummary.operationalMetrics.title')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('financialSummary.operationalMetrics.subtitle')}
              </p>
            </div>
            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Building className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          
          {metrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    {t('financialSummary.operationalMetrics.totalUnits')}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{metrics.totalUnits}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">
                    {t('financialSummary.operationalMetrics.occupiedUnits')}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{metrics.occupiedUnits}</p>
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-600">
                    {t('financialSummary.operationalMetrics.occupancyRate')}
                  </span>
                  <span className="font-bold text-purple-700">{formatPercentage(metrics.occupancyRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-yellow-600">
                    {t('financialSummary.operationalMetrics.collectionEfficiency')}
                  </span>
                  <span className="font-bold text-yellow-700">{formatPercentage(metrics.collectionEfficiency)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-yellow-700 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, metrics.collectionEfficiency)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;