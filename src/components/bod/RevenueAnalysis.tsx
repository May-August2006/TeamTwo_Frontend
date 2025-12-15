/** @format */

import React from "react";
import { PieChart, TrendingUp, Building2, DollarSign, Target, Calendar } from "lucide-react";

const RevenueAnalysis: React.FC = () => {
  const revenueData = {
    byCategory: [
      { category: "Retail", revenue: "$6.2M", percentage: 48.4, shops: 45, color: "bg-gradient-to-r from-blue-500 to-blue-700" },
      { category: "Food & Beverage", revenue: "$3.1M", percentage: 24.2, shops: 25, color: "bg-gradient-to-r from-sky-500 to-sky-700" },
      { category: "Entertainment", revenue: "$1.8M", percentage: 14.1, shops: 12, color: "bg-gradient-to-r from-indigo-500 to-indigo-700" },
      { category: "Services", revenue: "$1.7M", percentage: 13.3, shops: 18, color: "bg-gradient-to-r from-cyan-500 to-cyan-700" },
    ],
    quarterlyRent: [
      { quarter: "Q1", collected: "$2.4M", target: "$2.5M", achievement: "96%", color: "from-blue-400 to-blue-600" },
      { quarter: "Q2", collected: "$2.6M", target: "$2.7M", achievement: "96.3%", color: "from-sky-400 to-sky-600" },
      { quarter: "Q3", collected: "$2.8M", target: "$2.9M", achievement: "96.6%", color: "from-blue-500 to-blue-700" },
      { quarter: "Q4", collected: "$2.7M", target: "$2.8M", achievement: "96.4%", color: "from-indigo-400 to-indigo-600" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
        <h2 className="text-2xl font-bold mb-2">Revenue Analysis</h2>
        <p className="text-blue-100">
          Revenue breakdown by tenant category and quarterly performance
        </p>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
            <div className="p-2 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
              <DollarSign className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">$12.8M</p>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+15.2% from previous year</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Annual performance 2024</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rental Revenue</h3>
            <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
              <Building2 className="w-5 h-5 text-indigo-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">$10.5M</p>
          <div className="mt-2">
            <div className="flex items-center">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: '82%' }}></div>
              </div>
              <span className="text-xs text-gray-500 ml-2">82% of total</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Categories</h3>
            <div className="p-2 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-lg border border-sky-200">
              <PieChart className="w-5 h-5 text-sky-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">4</p>
          <p className="text-sm text-gray-600 mt-2 font-medium">Revenue generating categories</p>
          <div className="mt-3 flex space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-sky-500 to-sky-700 rounded-full"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue by Business Category</h3>
            <p className="text-sm text-gray-600 mt-1">Performance across tenant segments</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <Target className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        <div className="space-y-4">
          {revenueData.byCategory.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-200 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color}`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{category.category}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${category.color}`} style={{ width: `${category.percentage}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{category.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{category.shops} active shops</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{category.revenue}</p>
                <div className="flex items-center justify-end mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12.5% growth</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-center text-sm text-gray-600">
            Retail contributes nearly half of total revenue, followed by Food & Beverage at 24%
          </div>
        </div>
      </div>

      {/* Quarterly Rent Collection */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Quarterly Rent Collection 2024</h3>
            <p className="text-sm text-gray-600 mt-1">Performance against targets</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
            <Calendar className="w-5 h-5 text-green-700" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueData.quarterlyRent.map((quarter, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-5 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-900 text-lg">{quarter.quarter}</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  {quarter.achievement}
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-600">Rent Collected</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">{quarter.collected}</p>
                </div>
                <div className="p-2 bg-gradient-to-r from-blue-100 to-sky-100 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">Target: {quarter.target}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${quarter.color}`} style={{ width: quarter.achievement }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average rent collection rate: <span className="font-bold text-green-700">96.3%</span></p>
            <p className="text-xs text-gray-500 mt-1">All quarters exceeded 96% of collection targets</p>
          </div>
        </div>
      </div>

      {/* Revenue Contribution Analysis */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue Contribution Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">Category performance and impact</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
            <PieChart className="w-5 h-5 text-indigo-700" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Pie Chart Visualization */}
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">$12.8M</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
            <div className="w-full h-full">
              {/* Retail - 48.4% */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-blue-500 border-r-transparent"
                style={{ 
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                  transform: 'rotate(174.24deg)'
                }}
              ></div>
              {/* Food & Beverage - 24.2% */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-sky-500 border-r-transparent"
                style={{ 
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                  transform: 'rotate(87.12deg)'
                }}
              ></div>
              {/* Entertainment - 14.1% */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-indigo-500 border-r-transparent"
                style={{ 
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                  transform: 'rotate(50.76deg)'
                }}
              ></div>
              {/* Services - 13.3% */}
              <div 
                className="absolute w-full h-full rounded-full border-8 border-cyan-500 border-r-transparent"
                style={{ 
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)'
                }}
              ></div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-4">
            {revenueData.byCategory.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                  <span className="font-medium text-gray-900">{category.category}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{category.revenue}</p>
                  <p className="text-sm text-gray-600">{category.percentage}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysis;