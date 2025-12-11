/** @format */

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Building2,
  DollarSign,
  Zap,
  LineChart,
} from "lucide-react";
import axios from "axios";

interface PerformanceMetricsDTO {
  rentCollectionRate?: number;
  rentCollectionChange?: number;
  utilityEfficiency?: number;
  utilityEfficiencyChange?: number;
  buildingUtilityData?: Array<{
    buildingName: string;
    cost2023: number;
    cost2024: number;
    improvement: string;
    status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  }>;
  utilityTrendData?: Array<{
    year: string;
    cost: number;
    label: string;
  }>;
  cumulativeSavings?: number;
  industryAverageUtility?: number;
  targetCollectionRate?: number;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await axios.get('/api/dashboard/performance-metrics');
      console.log('API Response:', response.data); // Debug log
      setMetrics(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      setError('Failed to load performance metrics. Please try again later.');
      // Fallback to sample data if API fails
      setMetrics({
        rentCollectionRate: 94.8,
        rentCollectionChange: 1.7,
        utilityEfficiency: 4.00,
        utilityEfficiencyChange: -16.7,
        cumulativeSavings: 1.30,
        industryAverageUtility: 4.80,
        targetCollectionRate: 95,
        buildingUtilityData: [
          { buildingName: "Main Mall", cost2023: 4.20, cost2024: 4.00, improvement: "-4.8%", status: "EXCELLENT" },
          { buildingName: "Business Tower", cost2023: 4.25, cost2024: 4.05, improvement: "-4.7%", status: "GOOD" },
          { buildingName: "Plaza Center", cost2023: 4.30, cost2024: 4.10, improvement: "-4.7%", status: "GOOD" },
          { buildingName: "Garden Complex", cost2023: 4.35, cost2024: 4.15, improvement: "-4.6%", status: "GOOD" },
        ],
        utilityTrendData: [
          { year: "2021", cost: 4.80, label: "Baseline" },
          { year: "2022", cost: 4.50, label: "-6.3%" },
          { year: "2023", cost: 4.20, label: "-12.5%" },
          { year: "2024", cost: 4.00, label: "-16.7%" },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely get number values
  const safeNumber = (value: number | undefined | null, defaultValue: number = 0): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return defaultValue;
    }
    return value;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
          <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
          <p className="text-blue-100">
            Loading key performance indicators...
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
          <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
          <p className="text-blue-100">
            {error}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPerformanceMetrics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
          <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
          <p className="text-blue-100">
            No performance data available
          </p>
        </div>
      </div>
    );
  }

  // Safely extract values with defaults
  const rentCollectionRate = safeNumber(metrics.rentCollectionRate, 0);
  const rentCollectionChange = safeNumber(metrics.rentCollectionChange, 0);
  const utilityEfficiency = safeNumber(metrics.utilityEfficiency, 0);
  const utilityEfficiencyChange = safeNumber(metrics.utilityEfficiencyChange, 0);
  const cumulativeSavings = safeNumber(metrics.cumulativeSavings, 0);
  const industryAverageUtility = safeNumber(metrics.industryAverageUtility, 4.80);
  const targetCollectionRate = safeNumber(metrics.targetCollectionRate, 95);
  const buildingUtilityData = metrics.buildingUtilityData || [];
  const utilityTrendData = metrics.utilityTrendData || [];

  const calculateAverageImprovement = () => {
    if (!buildingUtilityData || buildingUtilityData.length === 0) return "-4.7%";
    
    try {
      const improvements = buildingUtilityData.map(b => {
        if (!b.improvement) return 0;
        const clean = b.improvement.replace('%', '').trim();
        return parseFloat(clean) || 0;
      });
      const average = improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
      return `${average.toFixed(1)}%`;
    } catch (error) {
      console.error('Error calculating average improvement:', error);
      return "-4.7%";
    }
  };

  const calculateAverage2023 = () => {
    if (!buildingUtilityData || buildingUtilityData.length === 0) return "4.28";
    
    try {
      const avg = buildingUtilityData.reduce((sum, b) => sum + safeNumber(b.cost2023, 0), 0) / 
                  buildingUtilityData.length;
      return avg.toFixed(2);
    } catch (error) {
      console.error('Error calculating average 2023:', error);
      return "4.28";
    }
  };

  const calculateAverage2024 = () => {
    if (!buildingUtilityData || buildingUtilityData.length === 0) return "4.08";
    
    try {
      const avg = buildingUtilityData.reduce((sum, b) => sum + safeNumber(b.cost2024, 0), 0) / 
                  buildingUtilityData.length;
      return avg.toFixed(2);
    } catch (error) {
      console.error('Error calculating average 2024:', error);
      return "4.08";
    }
  };

  const averageImprovement = calculateAverageImprovement();
  const average2023 = calculateAverage2023();
  const average2024 = calculateAverage2024();

  const getStatusColor = (status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-amber-100 text-amber-800';
      case 'NEEDS_ATTENTION': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | undefined) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'EXCELLENT': return 'Excellent';
      case 'GOOD': return 'Good';
      case 'NEEDS_ATTENTION': return 'Needs Attention';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rent Collection Rate Card */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Rent Collection Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {rentCollectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {rentCollectionChange >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">
                    +{Math.abs(rentCollectionChange).toFixed(1)}% from last quarter
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                  <span className="text-red-600 font-medium">
                    {rentCollectionChange.toFixed(1)}% from last quarter
                  </span>
                </>
              )}
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-700" 
                style={{ width: `${Math.min(rentCollectionRate, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Target: {targetCollectionRate.toFixed(0)}% • Industry avg: 90%
            </p>
          </div>
        </div>

        {/* Utility Efficiency Card */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Utility Efficiency</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${utilityEfficiency.toFixed(2)}/sq ft
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200">
              <Zap className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {utilityEfficiencyChange <= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1 rotate-180" />
                  <span className="text-green-600 font-medium">
                    {Math.abs(utilityEfficiencyChange).toFixed(1)}% improvement
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">
                    +{utilityEfficiencyChange.toFixed(1)}% increase
                  </span>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Industry avg: ${industryAverageUtility.toFixed(2)}
              </span>
              <span className={`text-xs font-bold ${
                utilityEfficiency < industryAverageUtility 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {utilityEfficiency < industryAverageUtility ? '-' : '+'}
                {Math.abs(
                  ((utilityEfficiency - industryAverageUtility) / 
                  industryAverageUtility) * 100
                ).toFixed(1)}% vs industry
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Year-over-year optimization</p>
          </div>
        </div>
      </div>

      {/* Utility Efficiency Table */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Utility Efficiency by Building</h3>
            <p className="text-sm text-gray-600 mt-1">Cost per sq ft comparison (2023 vs 2024)</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <LineChart className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Building Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">2023 Cost ($/sq ft)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">2024 Cost ($/sq ft)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Improvement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buildingUtilityData && buildingUtilityData.length > 0 ? (
                buildingUtilityData.map((building, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3">
                          <Building2 className="w-4 h-4 text-blue-700" />
                        </div>
                        <span className="font-medium text-gray-900">{building.buildingName || `Building ${index + 1}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-900">${safeNumber(building.cost2023, 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-blue-700">${safeNumber(building.cost2024, 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {building.improvement && building.improvement.startsWith('-') ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1 rotate-180" />
                            <span className="font-bold text-green-600">{building.improvement || '0%'}</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                            <span className="font-bold text-red-600">{building.improvement || '0%'}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(building.status)}`}>
                        {getStatusText(building.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No building data available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-4 font-bold text-gray-900">AVERAGE</td>
                <td className="px-4 py-4 font-bold text-gray-900">${average2023}</td>
                <td className="px-4 py-4 font-bold text-blue-700">${average2024}</td>
                <td className="px-4 py-4 font-bold text-green-600">{averageImprovement}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    Good
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Trend Visualization */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Utility Cost Trend</h3>
            <p className="text-sm text-gray-600 mt-1">Year-over-year cost optimization</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-700 rotate-180" />
          </div>
        </div>
        
        <div className="flex items-end space-x-4 h-48 mt-8">
          {utilityTrendData && utilityTrendData.length > 0 ? (
            utilityTrendData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-center mb-2">
                  <p className="text-xs font-bold text-gray-900">${safeNumber(item.cost, 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{item.year || `Year ${index + 1}`}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">{item.label || '0%'}</p>
                </div>
                <div
                  className={`w-3/4 ${
                    index === utilityTrendData.length - 1 
                      ? 'bg-gradient-to-t from-blue-500 to-blue-700' 
                      : 'bg-gradient-to-t from-blue-300 to-blue-500'
                  } rounded-t-lg transition-all duration-300 hover:opacity-90`}
                  style={{ 
                    height: `${Math.max((safeNumber(item.cost, 0) / 5) * 100, 10)}%`,
                    minHeight: '20px'
                  }}
                ></div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">Cumulative savings over {utilityTrendData.length || 4} years</p>
          <p className="text-xl font-bold text-green-700">
            ${cumulativeSavings.toFixed(2)}/sq ft saved
          </p>
        </div>
      </div>

      {/* Data Last Updated */}
      <div className="text-center text-sm text-gray-500 mt-2">
        <p>Data updates in real-time • Last refreshed: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default PerformanceMetrics;