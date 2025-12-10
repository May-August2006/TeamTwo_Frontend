/** @format */

import React from "react";
import {
  TrendingUp,
  Building2,
  DollarSign,
  Zap,
  LineChart,
} from "lucide-react";

const PerformanceMetrics: React.FC = () => {
  const utilityData = [
    { building: "Main Mall", 2023: 4.20, 2024: 4.00, improvement: "-4.8%" },
    { building: "Business Tower", 2023: 4.25, 2024: 4.05, improvement: "-4.7%" },
    { building: "Plaza Center", 2023: 4.30, 2024: 4.10, improvement: "-4.7%" },
    { building: "Garden Complex", 2023: 4.35, 2024: 4.15, improvement: "-4.6%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
        <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
        <p className="text-blue-100">
          Key performance indicators for strategic assessment
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Rent Collection Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">94.8%</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+1.7% from last quarter</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-700" style={{ width: '94.8%' }}></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Target: 95% • Industry avg: 90%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Utility Efficiency</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">$4.00/sq ft</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200">
              <Zap className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1 rotate-180" />
              <span className="text-green-600 font-medium">-16.7% improvement</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Industry avg: $4.80</span>
              <span className="text-xs font-bold text-green-600">-16.7% better</span>
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
              {utilityData.map((building, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-blue-700" />
                      </div>
                      <span className="font-medium text-gray-900">{building.building}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-gray-900">${building[2023].toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-blue-700">${building[2024].toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1 rotate-180" />
                      <span className="font-bold text-green-600">{building.improvement}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      parseFloat(building.improvement) <= -4.5 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(building.improvement) <= -4.0 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {parseFloat(building.improvement) <= -4.5 ? 'Excellent' : parseFloat(building.improvement) <= -4.0 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-4 font-bold text-gray-900">AVERAGE</td>
                <td className="px-4 py-4 font-bold text-gray-900">$4.28</td>
                <td className="px-4 py-4 font-bold text-blue-700">$4.08</td>
                <td className="px-4 py-4 font-bold text-green-600">-4.7%</td>
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
          {[
            { year: "2021", cost: 4.80, label: "Baseline" },
            { year: "2022", cost: 4.50, label: "-6.3%" },
            { year: "2023", cost: 4.20, label: "-12.5%" },
            { year: "2024", cost: 4.00, label: "-16.7%" },
          ].map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="text-center mb-2">
                <p className="text-xs font-bold text-gray-900">${item.cost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{item.year}</p>
                <p className="text-xs text-green-600 font-medium mt-1">{item.label}</p>
              </div>
              <div
                className={`w-3/4 ${index === 3 ? 'bg-gradient-to-t from-blue-500 to-blue-700' : 'bg-gradient-to-t from-blue-300 to-blue-500'} rounded-t-lg transition-all duration-300 hover:opacity-90`}
                style={{ height: `${(item.cost / 5) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">Cumulative savings over 4 years</p>
          <p className="text-xl font-bold text-green-700">$1.30/sq ft saved</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;