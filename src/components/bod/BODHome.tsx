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
  Briefcase,
} from "lucide-react";
import API from "../../api/api"; // You'll need to import your API instance

interface DashboardMetrics {
  totalRevenue: number;
  occupancyRate: number;
  collectionEfficiency: number;
  activeTenants: number;
  revenueThisMonth: number;
  revenueThisQuarter?: number;
  revenueThisYear?: number;
  totalShops?: number;
  occupiedShops?: number;
  vacantShops?: number;
  collectionRate?: number;
  utilityCostPerSqFt?: number;
  utilityEfficiencyImprovement?: number;
  utilitySavings?: number;
}

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalTenants: number;
  activeTenants: number;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingPayments: number;
  overdueInvoices: number;
  pendingMaintenance: number;
}

const BODHome: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics from the new endpoint
      const metricsResponse = await API.get('/api/dashboard/metrics');
      const metricsData = metricsResponse.data;
      
      // Fetch stats from the existing endpoint
      const statsResponse = await API.get('/api/dashboard/stats');
      const statsData = statsResponse.data;
      
      // Combine the data
      const combinedMetrics: DashboardMetrics = {
        totalRevenue: metricsData.totalRevenue || 0,
        occupancyRate: metricsData.occupancyRate || 0,
        collectionEfficiency: metricsData.collectionEfficiency || 0,
        activeTenants: metricsData.activeTenants || 0,
        revenueThisMonth: metricsData.revenueThisMonth || 0,
        revenueThisYear: metricsData.revenueThisYear || 0,
        totalShops: statsData.totalUnits || 0,
        occupiedShops: statsData.occupiedUnits || 0,
        vacantShops: statsData.availableUnits || 0,
        collectionRate: metricsData.collectionEfficiency || 0, // Use collection efficiency as collection rate
      };
      
      setMetrics(combinedMetrics);
      setStats(statsData);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "0 MMK";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
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
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate for pie chart
  const occupied = metrics?.occupiedShops || stats?.occupiedUnits || 0;
  const vacant = metrics?.vacantShops || stats?.availableUnits || 0;
  const total = metrics?.totalShops || stats?.totalUnits || 1;
  const occupiedPercent = (occupied / total) * 100;
  const vacantPercent = (vacant / total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
     

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Units */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {total || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {occupied} occupied • {vacant} vacant
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Home className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-800" 
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
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Building2 className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-800" 
                style={{ width: `${metrics?.occupancyRate || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Target: 90%</span>
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
              <p className="text-sm text-gray-500 mt-1">Lifetime</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <DollarSign className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">
              {metrics?.revenueThisMonth ? `This month: ${formatCurrency(metrics.revenueThisMonth)}` : "No monthly data"}
            </span>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercentage(metrics?.collectionEfficiency)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <TrendingUp className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-800" 
                style={{ width: `${metrics?.collectionEfficiency || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Target: 95%</span>
          </div>
        </div>
      </div>

      {/* Pie Chart for Total Units (Vacant & Occupied) */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Units Distribution</h3>
            <p className="text-sm text-gray-600 mt-1">Vacant vs Occupied Units</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <PieChart className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Pie Chart Visualization */}
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-600">Total Units</p>
              </div>
            </div>
            <div className="w-full h-full">
              {/* Occupied - Percentage */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-blue-600 border-r-transparent"
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
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-800"></div>
                <span className="font-medium text-gray-900">Occupied Units</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{occupied}</p>
                <p className="text-sm text-gray-600">{formatPercentage(occupiedPercent)} of total</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-500"></div>
                <span className="font-medium text-gray-900">Vacant Units</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{vacant}</p>
                <p className="text-sm text-gray-600">{formatPercentage(vacantPercent)} of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Tenants */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.activeTenants || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Currently occupying units</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Contracts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.activeContracts || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.expiringContracts || 0} expiring soon
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Briefcase className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.overdueInvoices || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.outstandingPayments ? formatCurrency(stats.outstandingPayments) : "0 MMK"} outstanding
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <BarChart3 className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Monthly and total performance</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <LineChart className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(metrics?.totalRevenue)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(metrics?.revenueThisMonth)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">This Year</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(metrics?.revenueThisYear)}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Collection Efficiency: <span className="font-bold text-blue-700">
                  {formatPercentage(metrics?.collectionEfficiency)}
                </span>
              </div>
              <div>
                Active Contracts: <span className="font-bold text-blue-700">
                  {stats?.activeContracts || 0}
                </span>
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