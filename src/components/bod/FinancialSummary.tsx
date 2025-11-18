/** @format */

import React from "react";
import { DollarSign, TrendingUp, PieChart, BarChart3 } from "lucide-react";

const FinancialSummary: React.FC = () => {
  const financialData = {
    quarterly: [
      {
        quarter: "Q1 2024",
        revenue: "$2.8M",
        expenses: "$1.6M",
        profit: "$1.2M",
      },
      {
        quarter: "Q2 2024",
        revenue: "$3.2M",
        expenses: "$1.8M",
        profit: "$1.4M",
      },
      {
        quarter: "Q3 2024",
        revenue: "$3.5M",
        expenses: "$1.9M",
        profit: "$1.6M",
      },
      {
        quarter: "Q4 2024",
        revenue: "$3.3M",
        expenses: "$1.8M",
        profit: "$1.5M",
      },
    ],
    yearly: [
      { year: "2021", revenue: "$9.8M", profit: "$4.2M", growth: "8.5%" },
      { year: "2022", revenue: "$10.6M", profit: "$4.8M", growth: "12.3%" },
      { year: "2023", revenue: "$11.9M", profit: "$5.4M", growth: "14.2%" },
      { year: "2024", revenue: "$12.8M", profit: "$5.7M", growth: "15.2%" },
    ],
    incomeSources: [
      { source: "Rental Income", amount: "$8.2M", percentage: 64.1 },
      { source: "Utility Charges", amount: "$2.1M", percentage: 16.4 },
      { source: "CAM Fees", amount: "$1.5M", percentage: 11.7 },
      { source: "Other Income", amount: "$1.0M", percentage: 7.8 },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Revenue
            </h3>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">$12.8M</p>
          <p className="text-sm text-green-600 mt-2">+15.2% from last year</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Net Profit</h3>
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">$5.7M</p>
          <p className="text-sm text-blue-600 mt-2">+12.8% from last year</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Profit Margin
            </h3>
            <PieChart className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">44.5%</p>
          <p className="text-sm text-purple-600 mt-2">+2.1% improvement</p>
        </div>
      </div>

      {/* Quarterly Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Quarterly Performance 2024
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {financialData.quarterly.map((quarter, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                {quarter.quarter}
              </h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-600">Revenue: </span>
                  <span className="font-semibold text-green-600">
                    {quarter.revenue}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Expenses: </span>
                  <span className="font-semibold text-red-600">
                    {quarter.expenses}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Profit: </span>
                  <span className="font-semibold text-blue-600">
                    {quarter.profit}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Yearly Financial Trends
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialData.yearly.map((year, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {year.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {year.revenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {year.profit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {year.growth}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Revenue Sources
        </h3>
        <div className="space-y-4">
          {financialData.incomeSources.map((source, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {source.source}
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {source.amount}
                </p>
                <p className="text-sm text-gray-500">
                  {source.percentage}% of total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
