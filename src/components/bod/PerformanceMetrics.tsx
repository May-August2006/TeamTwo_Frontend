/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Zap,
  LineChart,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Target,
  Percent,
  Clock,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

interface PerformanceMetricsDTO {
  rentCollectionRate?: number;
  rentCollectionChange?: number;
  utilityCostChange?: number; // Percentage change
  utilityCostChangeAmount?: number; // Absolute change in currency
  buildingUtilityData?: Array<{
    buildingName: string;
    previousYearCost: number;
    currentYearCost: number;
    costChangePercentage: number; // e.g., 25.3
    costChangeAmount: number; // e.g., 250000
    status: "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION";
  }>;
  utilityTrendData?: Array<{
    year: string;
    totalCost: number;
    label: string; // e.g., "+25.3%" or "-10.2%"
  }>;
  cumulativeSavings?: number;
  industryAverageUtility?: number; // Industry average percentage change
  targetCollectionRate?: number;
  realTimeDataAvailable?: boolean;
  lastUpdated?: string;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"REAL" | "MOCK" | "NO_DATA">("REAL");
  const [timeRange, setTimeRange] = useState<"YEAR" | "QUARTER" | "MONTH">("YEAR");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [timeRange]);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);

      // Test if we have real data
      try {
        const testResponse = await axios.get(
          "/api/dashboard/performance-metrics"
        );
        
        console.log("Performance metrics API response:", testResponse.data);
        
        // Check if real data is available
        if (testResponse.data.realTimeDataAvailable === false || 
            (!testResponse.data.buildingUtilityData || testResponse.data.buildingUtilityData.length === 0)) {
          console.warn("No real data found in response, showing sample data");
          setDataSource("MOCK");
        } else {
          setDataSource("REAL");
          // Process the real data
          const processedData = processMetricsData(testResponse.data);
          setMetrics(processedData);
          setRefreshing(false);
          setLoading(false);
          return; // Exit early if we have real data
        }
      } catch (testError) {
        console.warn("Performance metrics endpoint error:", testError);
        setDataSource("MOCK");
      }

      // Fallback to sample data if no real data
      setMetrics({
        rentCollectionRate: 94.8,
        rentCollectionChange: 1.7,
        utilityCostChange: 15.5,
        utilityCostChangeAmount: 25000000,
        cumulativeSavings: -1500000,
        industryAverageUtility: 12.0,
        targetCollectionRate: 95,
        buildingUtilityData: [
          {
            buildingName: "Sein Gay Har Parami Centre",
            previousYearCost: 45000000,
            currentYearCost: 52000000,
            costChangePercentage: 15.6,
            costChangeAmount: 7000000,
            status: "NEEDS_ATTENTION",
          },
          {
            buildingName: "Sein Gay Har Kamayut Centre",
            previousYearCost: 38000000,
            currentYearCost: 42000000,
            costChangePercentage: 10.5,
            costChangeAmount: 4000000,
            status: "NEEDS_ATTENTION",
          },
          {
            buildingName: "Hlaing Building 2",
            previousYearCost: 28000000,
            currentYearCost: 30000000,
            costChangePercentage: 7.1,
            costChangeAmount: 2000000,
            status: "GOOD",
          },
          {
            buildingName: "Sein Gay Har Kamayut Centre 2",
            previousYearCost: 32000000,
            currentYearCost: 33000000,
            costChangePercentage: 3.1,
            costChangeAmount: 1000000,
            status: "GOOD",
          },
          {
            buildingName: "Dagon Center",
            previousYearCost: 55000000,
            currentYearCost: 52000000,
            costChangePercentage: -5.5,
            costChangeAmount: -3000000,
            status: "EXCELLENT",
          },
        ],
        utilityTrendData: [
          { year: "2021", totalCost: 180000000, label: "Baseline" },
          { year: "2022", totalCost: 195000000, label: "+8.3%" },
          { year: "2023", totalCost: 210000000, label: "+7.7%" },
          { year: "2024", totalCost: 235000000, label: "+11.9%" },
        ],
        realTimeDataAvailable: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      setError("Failed to load performance metrics. Please try again later.");
      setDataSource("NO_DATA");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to process and format metrics data
  const processMetricsData = (data: any): PerformanceMetricsDTO => {
    const processed: PerformanceMetricsDTO = { ...data };

    // Ensure all numbers are properly formatted
    if (processed.buildingUtilityData) {
      processed.buildingUtilityData = processed.buildingUtilityData.map(
        (building) => ({
          ...building,
          costChangePercentage: building.costChangePercentage || 0,
          costChangeAmount: building.costChangeAmount || 0,
          previousYearCost: building.previousYearCost || 0,
          currentYearCost: building.currentYearCost || 0,
        })
      );
    }

    // Ensure trend data is properly formatted
    if (processed.utilityTrendData) {
      processed.utilityTrendData = processed.utilityTrendData.map((trend) => ({
        ...trend,
        totalCost: trend.totalCost || 0,
        label: trend.label || "Baseline",
      }));
    }

    return processed;
  };

  // Helper functions for formatting
  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0";

    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('en-US').format(absValue);

    // Convert to lakhs (1 lakh = 100,000)
    if (absValue >= 100000) {
      return `${(value / 100000).toFixed(2)}L`;
    }

    return formatted;
  };

  const formatCurrencyMMK = (value: number): string => {
    const formattedValue = formatCurrency(value);
    // Only append MMK if it's not already in lakhs format
    if (formattedValue.endsWith('L')) {
      return `${formattedValue}`;
    }
    return `${formattedValue} MMK`;
  };

  const formatCurrencyLakhs = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0.00L";
    
    const lakhsValue = value / 100000;
    return `${lakhsValue.toFixed(2)}L`;
  };

  const formatPercentage = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0.0%";
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  // Safely get number values
  const safeNumber = (
    value: number | undefined | null,
    defaultValue: number = 0
  ): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return defaultValue;
    }
    return value;
  };

  // Calculate average improvement from building data
  const calculateAverageImprovement = (): number => {
    if (!metrics?.buildingUtilityData || metrics.buildingUtilityData.length === 0)
      return 0;

    try {
      const improvements = metrics.buildingUtilityData.map(
        (b) => b.costChangePercentage
      );
      return improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
    } catch (error) {
      console.error("Error calculating average improvement:", error);
      return 0;
    }
  };

  // Calculate total utility cost
  const calculateTotalUtilityCost = (): number => {
    if (!metrics?.buildingUtilityData || metrics.buildingUtilityData.length === 0)
      return 0;

    try {
      return metrics.buildingUtilityData.reduce(
        (sum, b) => sum + safeNumber(b.currentYearCost, 0),
        0
      );
    } catch (error) {
      console.error("Error calculating total utility cost:", error);
      return 0;
    }
  };

  // Get status color
  const getStatusColor = (
    status: "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION" | undefined
  ) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status) {
      case "EXCELLENT":
        return "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200";
      case "GOOD":
        return "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200";
      case "NEEDS_ATTENTION":
        return "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200";
      default:
        return "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusText = (
    status: "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION" | undefined
  ) => {
    if (!status) return "Unknown";

    switch (status) {
      case "EXCELLENT":
        return "Excellent";
      case "GOOD":
        return "Good";
      case "NEEDS_ATTENTION":
        return "Needs Attention";
      default:
        return status;
    }
  };

  // Prepare data for charts
  const prepareTrendChartData = () => {
    if (!metrics?.utilityTrendData || metrics.utilityTrendData.length === 0) {
      return [];
    }

    return metrics.utilityTrendData.map((trend) => ({
      year: trend.year,
      cost: trend.totalCost / 100000, // Convert to lakhs for display
      label: trend.label,
    }));
  };

  const prepareBuildingComparisonData = () => {
    if (!metrics?.buildingUtilityData || metrics.buildingUtilityData.length === 0) {
      return [];
    }

    return metrics.buildingUtilityData
      .slice(0, 5) // Limit to top 5 buildings
      .map((building) => ({
        name: building.buildingName.length > 15 
          ? building.buildingName.substring(0, 15) + "..." 
          : building.buildingName,
        previousYear: building.previousYearCost / 100000, // Convert to lakhs
        currentYear: building.currentYearCost / 100000, // Convert to lakhs
        change: building.costChangePercentage,
      }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header with Loading State */}
        <div className="bg-gradient-to-br from-slate-900 to-[#1E40AF] rounded-2xl shadow-2xl p-6 text-white border border-[#1E3A8A]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Performance Metrics</h2>
              <p className="text-blue-200 font-light">
                Loading key performance indicators...
              </p>
            </div>
            <div className="animate-pulse">
              <LineChart className="w-8 h-8 text-blue-300" />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1E40AF] border-t-transparent"></div>
            <p className="text-slate-700 font-medium">Calculating performance metrics...</p>
            <p className="text-sm text-slate-500">
              Fetching data from invoices, contracts, and utility records
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div className="space-y-6">
        {/* Header with Error State */}
        <div className="bg-gradient-to-br from-slate-900 to-[#1E40AF] rounded-2xl shadow-2xl p-6 text-white border border-[#1E3A8A]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Performance Metrics</h2>
              <p className="text-blue-200 font-light">Error loading performance data</p>
            </div>
            <AlertCircle className="w-8 h-8 text-rose-300" />
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-rose-200 p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-rose-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-rose-800 mb-2">
                Unable to Load Metrics
              </h3>
              <p className="text-rose-700 mb-4">{error}</p>
              <div className="space-y-3">
                <p className="text-sm text-rose-600">This could be because:</p>
                <ul className="list-disc list-inside text-sm text-rose-600 space-y-1 ml-2">
                  <li>No invoice data exists in the system</li>
                  <li>Utility costs haven't been recorded yet</li>
                  <li>Contract data is missing or incomplete</li>
                  <li>The backend service is not properly configured</li>
                </ul>
              </div>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={fetchPerformanceMetrics}
                  className="px-4 py-2.5 bg-[#1E40AF] text-white rounded-xl hover:bg-[#1E3A8A] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-2 font-medium shadow-md hover:shadow-lg"
                >
                  Retry
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2.5 bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 font-medium"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-[#1E40AF] rounded-2xl shadow-2xl p-6 text-white border border-[#1E3A8A]">
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Performance Metrics</h2>
          <p className="text-blue-200 font-light">No performance data available</p>
        </div>
      </div>
    );
  }

  // Extract values with defaults
  const rentCollectionRate = safeNumber(metrics.rentCollectionRate, 0);
  const rentCollectionChange = safeNumber(metrics.rentCollectionChange, 0);
  const utilityCostChange = safeNumber(metrics.utilityCostChange, 0);
  const utilityCostChangeAmount = safeNumber(metrics.utilityCostChangeAmount, 0);
  const industryAverageUtility = safeNumber(metrics.industryAverageUtility, 12.0);
  const targetCollectionRate = safeNumber(metrics.targetCollectionRate, 95);
  const buildingUtilityData = metrics.buildingUtilityData || [];
  const utilityTrendData = metrics.utilityTrendData || [];

  const averageImprovement = calculateAverageImprovement();
  const totalUtilityCost = calculateTotalUtilityCost();

  // Chart data
  const trendChartData = prepareTrendChartData();
  const buildingChartData = prepareBuildingComparisonData();

  return (
    <div className="space-y-6">
      {/* Header with Data Source Indicator */}
      <div className="bg-gradient-to-br from-slate-900 to-[#1E40AF] rounded-2xl shadow-2xl p-6 text-white border border-[#1E3A8A]">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold tracking-tight">Performance Metrics</h2>
              {dataSource === "MOCK" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  Using Sample Data
                </span>
              )}
              {dataSource === "REAL" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Real Data
                </span>
              )}
              {refreshing && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
                  <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <p className="text-blue-200 font-light">
              Key performance indicators for rent collection and utility cost management
            </p>
            {dataSource === "MOCK" && (
              <p className="text-amber-200 text-sm mt-2 font-medium">
                <AlertCircle className="w-4 h-4 inline mr-1.5" />
                Real data will appear when you have paid invoices with utility items
              </p>
            )}
            {dataSource === "REAL" && metrics.lastUpdated && (
              <div className="flex items-center mt-2 text-blue-100">
                <Clock className="w-4 h-4 mr-1.5" />
                <span className="text-sm">
                  Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end space-y-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchPerformanceMetrics}
                disabled={refreshing}
                className={`p-2.5 rounded-xl ${refreshing 
                  ? 'bg-[#1E3A8A] cursor-not-allowed' 
                  : 'bg-white/20 hover:bg-white/30'} transition-all duration-300 hover:scale-105`}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <LineChart className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              <button
                onClick={() => setTimeRange("YEAR")}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-300 ${
                  timeRange === "YEAR"
                    ? "bg-white text-[#1E40AF] shadow-md"
                    : "text-white hover:bg-white/20"
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setTimeRange("QUARTER")}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-300 ${
                  timeRange === "QUARTER"
                    ? "bg-white text-[#1E40AF] shadow-md"
                    : "text-white hover:bg-white/20"
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => setTimeRange("MONTH")}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-300 ${
                  timeRange === "MONTH"
                    ? "bg-white text-[#1E40AF] shadow-md"
                    : "text-white hover:bg-white/20"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Rent Collection Rate Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 hover:shadow-2xl transition-all duration-500 group">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl border border-emerald-200">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Rent Collection Rate</p>
              </div>
              <p className="text-4xl font-bold text-slate-900 mt-2">
                {rentCollectionRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-2">
                {rentCollectionChange >= 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-emerald-500 mr-2" />
                    <span className="text-emerald-600 font-semibold">
                      +{Math.abs(rentCollectionChange).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5 text-rose-500 mr-2" />
                    <span className="text-rose-600 font-semibold">
                      {rentCollectionChange.toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="text-slate-500 text-sm ml-2">from last {timeRange.toLowerCase()}</span>
              </div>
            </div>
            <Target className="w-8 h-8 text-slate-300 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progress</span>
              <span>{Math.min(rentCollectionRate, 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-md"
                style={{ width: `${Math.min(rentCollectionRate, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-500">Target</p>
                <p className="text-sm font-semibold text-slate-900">{targetCollectionRate.toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Industry Avg</p>
                <p className="text-sm font-semibold text-slate-900">90%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Utility Cost Change Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 hover:shadow-2xl transition-all duration-500 group">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-2 rounded-xl border ${
                  utilityCostChange < 0
                    ? "bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-200"
                    : utilityCostChange < 5
                    ? "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200"
                    : "bg-gradient-to-br from-rose-100 to-red-100 border-rose-200"
                }`}>
                  <Zap className={`w-5 h-5 ${
                    utilityCostChange < 0
                      ? "text-emerald-600"
                      : utilityCostChange < 5
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`} />
                </div>
                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Utility Cost Change</p>
              </div>
              <p className={`text-4xl font-bold mt-2 ${
                utilityCostChange < 0
                  ? "text-emerald-600"
                  : utilityCostChange < 5
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}>
                {utilityCostChange >= 0 ? "+" : ""}
                {utilityCostChange.toFixed(1)}%
              </p>
              <p className={`text-lg font-semibold mt-2 ${
                utilityCostChangeAmount < 0 ? "text-emerald-500" : "text-rose-500"
              }`}>
                {utilityCostChangeAmount >= 0 ? "+" : ""}
                {formatCurrencyLakhs(utilityCostChangeAmount)}
              </p>
            </div>
            {utilityCostChange <= 0 ? (
              <TrendingDown className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
            ) : (
              <TrendingUp className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {utilityCostChange <= 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="text-emerald-600 font-medium">
                      Cost reduction achieved
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-rose-500 mr-2" />
                    <span className="text-rose-600 font-medium">
                      Cost increase detected
                    </span>
                  </>
                )}
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                utilityCostChange < industryAverageUtility
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}>
                {utilityCostChange < industryAverageUtility ? "Better" : "Worse"} than industry
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-500">Industry Average</p>
                <p className="text-sm font-semibold text-slate-900">{industryAverageUtility}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Your Performance</p>
                <p className="text-sm font-semibold text-slate-900">{utilityCostChange.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Utility Cost Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 hover:shadow-2xl transition-all duration-500 group">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Utility Cost</p>
              </div>
              <p className="text-4xl font-bold text-slate-900 mt-2">
                {formatCurrencyLakhs(totalUtilityCost)}
              </p>
              <p className="text-slate-600 mt-2">Current Year Total</p>
            </div>
            <Building2 className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-600 font-medium">Average Building Change</span>
              <span className={`text-lg font-bold ${
                averageImprovement < 0
                  ? "text-emerald-600"
                  : averageImprovement < 5
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}>
                {averageImprovement >= 0 ? "+" : ""}
                {averageImprovement.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Best: {Math.min(...buildingUtilityData.map(b => b.costChangePercentage)).toFixed(1)}%</span>
                <span>Worst: {Math.max(...buildingUtilityData.map(b => b.costChangePercentage)).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-100 transition-all duration-1000"
                  style={{ width: `${100 - Math.min(Math.abs(averageImprovement) * 2, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-500">Buildings</p>
                <p className="text-sm font-semibold text-slate-900">{buildingUtilityData.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {buildingUtilityData.filter(b => b.status === "EXCELLENT").length} Excellent
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Attention</p>
                <p className="text-sm font-semibold text-rose-600">
                  {buildingUtilityData.filter(b => b.status === "NEEDS_ATTENTION").length} Need
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utility Trend Chart - Area Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 group hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Utility Cost Trend</h3>
              <p className="text-slate-600">Annual utility costs in lakhs MMK</p>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-[#1E40AF] to-blue-600 rounded-xl border border-blue-500 shadow-md">
              <LineChart className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}L`}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value) => [`${value}L MMK`, "Cost"]}
                  labelFormatter={(label) => `Year: ${label}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#1E293B" }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  name="Total Cost"
                  stroke="#1E40AF"
                  strokeWidth={3}
                  fill="url(#colorCost)"
                  activeDot={{ r: 8, strokeWidth: 2, stroke: "#1E40AF", fill: "white" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Shows year-over-year utility cost changes across all properties
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#1E40AF] rounded-full mr-2"></div>
                  <span className="text-xs text-slate-500">Total Cost</span>
                </div>
                <Percent className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Building Comparison Chart - Grouped Bar Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 group hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Building Comparison</h3>
              <p className="text-slate-600">Previous vs Current Year (Lakhs MMK)</p>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl border border-emerald-400 shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}L`}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "change") {
                      return [`${value}%`, "Change"];
                    }
                    return [`${value}L MMK`, name === "previousYear" ? "Last Year" : "Current Year"];
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#1E293B" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  name="Previous Year"
                  dataKey="previousYear"
                  fill="#94a3b8"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  name="Current Year"
                  dataKey="currentYear"
                  fill="#1E40AF"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Utility cost comparison between previous and current year
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#94a3b8] rounded mr-2"></div>
                  <span className="text-xs text-slate-500">Previous</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#1E40AF] rounded mr-2"></div>
                  <span className="text-xs text-slate-500">Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Building Utility Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 group hover:shadow-2xl transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-slate-900">
                Building Utility Cost Analysis
              </h3>
              {dataSource === "MOCK" && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                  Sample Data
                </span>
              )}
              {dataSource === "REAL" && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                  Real Data • {buildingUtilityData.length} Properties
                </span>
              )}
            </div>
            <p className="text-slate-600">
              Detailed cost comparison and performance analysis by property
            </p>
          </div>
          <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300 shadow-sm">
            <LineChart className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Property Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Last Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Current Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Change %
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buildingUtilityData.length > 0 ? (
                buildingUtilityData.map((building, index) => {
                  const changePercentage = building.costChangePercentage || 0;
                  const changeAmount = building.costChangeAmount || 0;

                  return (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mr-3 border border-slate-300">
                            <Building2 className="w-4 h-4 text-slate-700" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">
                              {building.buildingName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">
                          {formatCurrencyLakhs(building.previousYearCost || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#1E40AF]">
                          {formatCurrencyLakhs(building.currentYearCost || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {changePercentage <= 0 ? (
                            <>
                              <TrendingDown className="w-5 h-5 text-emerald-500 mr-2" />
                              <span className="font-bold text-emerald-600">
                                {changePercentage.toFixed(1)}%
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-5 h-5 text-rose-500 mr-2" />
                              <span className="font-bold text-rose-600">
                                +{changePercentage.toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold px-3 py-1.5 rounded-lg ${
                            changeAmount <= 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {changeAmount >= 0 ? "+" : ""}
                          {formatCurrencyLakhs(changeAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                            building.status
                          )} shadow-sm`}
                        >
                          {getStatusText(building.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-sm font-medium text-[#1E40AF] hover:text-[#1E3A8A] hover:underline transition-colors duration-200"
                          onClick={() => {
                            console.log("View details for:", building.buildingName);
                          }}
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Building2 className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="text-lg font-medium mb-2">No building utility data available</p>
                      <p className="text-sm text-slate-400">
                        Add invoices with utility items to see performance metrics
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {buildingUtilityData.length > 0 && (
              <tfoot className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <td className="px-6 py-4 font-bold text-slate-900 border-t border-slate-200">TOTAL</td>
                  <td className="px-6 py-4 font-bold text-slate-900 border-t border-slate-200">
                    {formatCurrencyLakhs(
                      buildingUtilityData.reduce(
                        (sum, b) => sum + (b.previousYearCost || 0),
                        0
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#1E40AF] border-t border-slate-200">
                    {formatCurrencyLakhs(totalUtilityCost)}
                  </td>
                  <td className="px-6 py-4 font-bold border-t border-slate-200">
                    <span
                      className={
                        averageImprovement < 0
                          ? "text-emerald-600"
                          : averageImprovement < 5
                          ? "text-amber-600"
                          : "text-rose-600"
                      }
                    >
                      {averageImprovement >= 0 ? "+" : ""}
                      {averageImprovement.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold border-t border-slate-200">
                    <span
                      className={utilityCostChangeAmount < 0 ? "text-emerald-600" : "text-rose-600"}
                    >
                      {utilityCostChangeAmount >= 0 ? "+" : ""}
                      {formatCurrencyLakhs(utilityCostChangeAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-t border-slate-200">
                    <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                      Summary
                    </span>
                  </td>
                  <td className="px-6 py-4 border-t border-slate-200"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Data Source Information */}
      {dataSource === "MOCK" && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-xl border border-amber-200 p-6">
          <div className="flex items-start">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl border border-amber-300 mr-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-800 mb-2">
                Using Sample Data
              </h3>
              <p className="text-amber-700 mb-4">
                Real performance metrics will appear when you have:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm text-amber-700">
                    Invoices with <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-medium">RENT</code> items marked as <strong>PAID</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm text-amber-700">
                    Utility invoices (<code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-medium">ELECTRICITY</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-medium">WATER</code>) marked as <strong>PAID</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm text-amber-700">
                    Issue dates in 2024 or 2025
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm text-amber-700">
                    Contracts associated with units and buildings
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => (window.location.href = "/invoices")}
                  className="px-4 py-2.5 text-sm font-medium bg-amber-100 text-amber-800 rounded-xl hover:bg-amber-200 transition-all duration-300 border border-amber-300 shadow-sm hover:shadow"
                >
                  Go to Invoices
                </button>
                <button
                  onClick={() => (window.location.href = "/contracts")}
                  className="px-4 py-2.5 text-sm font-medium bg-amber-100 text-amber-800 rounded-xl hover:bg-amber-200 transition-all duration-300 border border-amber-300 shadow-sm hover:shadow"
                >
                  Go to Contracts
                </button>
                <button
                  onClick={fetchPerformanceMetrics}
                  disabled={refreshing}
                  className="px-4 py-2.5 text-sm font-medium bg-[#1E40AF] text-white rounded-xl hover:bg-[#1E3A8A] transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    "Refresh Data"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend and Info */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Data Interpretation</h4>
            <p className="text-sm text-slate-600 mb-4">
              Data shows utility cost changes year-over-year. Negative percentages indicate cost
              reductions (good), positive percentages indicate cost increases (requires attention).
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-100 rounded-full mr-3 border border-emerald-300"></div>
                <span className="text-sm text-slate-700">
                  <span className="font-semibold text-emerald-700">EXCELLENT</span> – Cost reduction of 5% or more
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-100 rounded-full mr-3 border border-amber-300"></div>
                <span className="text-sm text-slate-700">
                  <span className="font-semibold text-amber-700">GOOD</span> – Cost increase of less than 5%
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-rose-100 rounded-full mr-3 border border-rose-300"></div>
                <span className="text-sm text-slate-700">
                  <span className="font-semibold text-rose-700">NEEDS ATTENTION</span> – Cost increase of more than 5%
                </span>
              </div>
            </div>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Currency Information</h4>
            <p className="text-sm text-slate-600 mb-4">
              All monetary values are displayed in Myanmar Kyat (MMK). The values are shown in lakhs (1 Lakh = 100,000 MMK).
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <p className="text-3xl font-bold text-[#1E40AF]">L</p>
                <p className="text-sm text-slate-700 mt-1 font-medium">Lakhs (1,00,000 MMK)</p>
                <p className="text-xs text-slate-600 mt-1">Example: 5.20L = 520,000 MMK</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">Note:</p>
              <p className="text-xs text-blue-600 mt-1">
                All currency values are automatically converted to lakhs format. 1 Lakh = 100,000 Myanmar Kyats.
              </p>
            </div>
          </div>
        </div>
        {dataSource === "REAL" && metrics.lastUpdated && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-400 mr-2" />
              <p className="text-xs text-slate-500">
                Data last fetched: {new Date(metrics.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMetrics;