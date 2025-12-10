/** @format */

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  PieChart,
  BarChart3,
  LineChart,
  Loader2,
  Home,
  Calendar,
} from "lucide-react";
import { dashboardApi, type DashboardMetrics } from "../../api/dashboardApi";

const BODHome: React.FC = () => {
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
      setError("Failed to load dashboard data");
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

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "0%";
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  // Calculate for pie chart
  const occupied = metrics?.occupiedShops || 0;
  const vacant = metrics?.vacantShops || 0;
  const total = metrics?.totalShops || 1;
  const occupiedPercent = (occupied / total) * 100;
  const vacantPercent = (vacant / total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Board of Directors Dashboard</h2>
            <p className="text-blue-100">
              Strategic overview for high-level decision making
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Shops */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shops</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.totalShops || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {occupied} occupied • {vacant} vacant
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <Home className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" 
                style={{ width: `${metrics?.occupancyRate || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">{formatPercentage(metrics?.occupancyRate)} occupied</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercentage(metrics?.occupancyRate)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <Building2 className="w-6 h-6 text-indigo-700" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" 
                style={{ width: `${metrics?.occupancyRate || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Industry avg: 88%</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Annual 2024</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl border border-blue-200">
              <DollarSign className="w-6 h-6 text-teal-700" />
            </div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+5.2% from last quarter</span>
          </div>
        </div>

        {/* Rent Collection Rate */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Rent Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercentage(metrics?.collectionRate)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-700" 
                style={{ width: `${metrics?.collectionRate || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Target: 95%</span>
          </div>
        </div>
      </div>

      {/* Pie Chart for Total Shops (Vacant & Occupied) */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Total Shops Distribution</h3>
            <p className="text-sm text-gray-600 mt-1">Vacant vs Occupied Units</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <PieChart className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Pie Chart Visualization */}
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-600">Total Shops</p>
              </div>
            </div>
            <div className="w-full h-full">
              {/* Occupied - Percentage */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-blue-500 border-r-transparent"
                style={{ 
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                  transform: `rotate(${occupiedPercent * 3.6}deg)`
                }}
              ></div>
              {/* Vacant - Percentage */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-gray-300 border-r-transparent"
                style={{ 
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)'
                }}
              ></div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"></div>
                <span className="font-medium text-gray-900">Occupied Shops</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{occupied}</p>
                <p className="text-sm text-gray-600">{formatPercentage(occupiedPercent)} of total</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-500"></div>
                <span className="font-medium text-gray-900">Vacant Shops</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{vacant}</p>
                <p className="text-sm text-gray-600">{formatPercentage(vacantPercent)} of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Utility Efficiency */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Utility Efficiency</h3>
            <p className="text-sm text-gray-600 mt-1">Cost per sq ft optimization</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <LineChart className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Current Cost per sq ft</p>
              <p className="text-2xl font-bold text-blue-700">${metrics?.utilityCostPerSqFt?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Year-over-year change</p>
              <p className="text-lg font-bold text-green-600">↓ {formatPercentage(metrics?.utilityEfficiencyImprovement)}</p>
            </div>
          </div>

          <div className="flex items-end space-x-4 h-32">
            {[
              { year: "2021", cost: 4.80, color: "bg-gradient-to-t from-gray-300 to-gray-400" },
              { year: "2022", cost: 4.50, color: "bg-gradient-to-t from-blue-300 to-blue-400" },
              { year: "2023", cost: 4.20, color: "bg-gradient-to-t from-blue-400 to-blue-500" },
              { year: "2024", cost: metrics?.utilityCostPerSqFt || 4.00, color: "bg-gradient-to-t from-blue-500 to-blue-700" },
            ].map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-center mb-2">
                  <p className="text-xs font-bold text-gray-900">${item.cost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{item.year}</p>
                </div>
                <div
                  className={`w-3/4 ${item.color} rounded-t-lg transition-all duration-300 hover:opacity-90`}
                  style={{ height: `${(item.cost / 5) * 100}%` }}
                ></div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Cumulative savings: <span className="font-bold text-green-700">${metrics?.utilitySavings?.toFixed(1) || "0"}M</span>
              </div>
              <div className="text-sm text-gray-600">
                Industry avg: $4.80/sq ft
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Last Updated */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <Calendar className="w-4 h-4 inline mr-2" />
        Data last updated: {new Date().toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })}
      </div>
    </div>
  );
};

export default BODHome;