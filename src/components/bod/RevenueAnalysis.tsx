/** @format */

import React from "react";
import { PieChart, TrendingUp, Building2 } from "lucide-react";

const RevenueAnalysis: React.FC = () => {
  const revenueData = {
    byCategory: [
      {
        category: "Retail",
        revenue: "$6.2M",
        percentage: 48.4,
        growth: "+12.3%",
      },
      {
        category: "Food & Beverage",
        revenue: "$3.1M",
        percentage: 24.2,
        growth: "+15.8%",
      },
      {
        category: "Entertainment",
        revenue: "$1.8M",
        percentage: 14.1,
        growth: "+8.7%",
      },
      {
        category: "Services",
        revenue: "$1.7M",
        percentage: 13.3,
        growth: "+11.2%",
      },
    ],
    byProperty: [
      {
        property: "Main Mall",
        revenue: "$5.8M",
        occupancy: "98%",
        growth: "+14.2%",
      },
      {
        property: "Business Tower",
        revenue: "$3.2M",
        occupancy: "96%",
        growth: "+12.8%",
      },
      {
        property: "Plaza Center",
        revenue: "$2.1M",
        occupancy: "94%",
        growth: "+9.5%",
      },
      {
        property: "Garden Complex",
        revenue: "$1.7M",
        occupancy: "92%",
        growth: "+8.3%",
      },
    ],
    monthlyTrend: [
      { month: "Jan", revenue: "$950K", target: "$900K" },
      { month: "Feb", revenue: "$1.1M", target: "$1.0M" },
      { month: "Mar", revenue: "$1.2M", target: "$1.1M" },
      { month: "Apr", revenue: "$1.3M", target: "$1.2M" },
      { month: "May", revenue: "$1.4M", target: "$1.3M" },
      { month: "Jun", revenue: "$1.5M", target: "$1.4M" },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Revenue
            </h3>
            <PieChart className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">$12.8M</p>
          <p className="text-sm text-green-600 mt-2">
            +15.2% from previous year
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Growth
            </h3>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">15.2%</p>
          <p className="text-sm text-green-600 mt-2">Above industry average</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-600 mt-2">
            Active revenue-generating properties
          </p>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Revenue by Business Category
        </h3>
        <div className="space-y-4">
          {revenueData.byCategory.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    index === 0
                      ? "bg-blue-500"
                      : index === 1
                      ? "bg-green-500"
                      : index === 2
                      ? "bg-purple-500"
                      : "bg-orange-500"
                  }`}
                ></div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {category.category}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category.percentage}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {category.revenue}
                </p>
                <p className="text-sm text-green-600">{category.growth}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Property */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Revenue by Property
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revenueData.byProperty.map((property, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  {property.property}
                </h4>
                <span className="text-sm text-green-600">
                  {property.growth}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">
                  {property.revenue}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Occupancy Rate</span>
                  <span className="font-semibold text-blue-600">
                    {property.occupancy}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Monthly Revenue Trends
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.monthlyTrend.map((month, index) => {
                const isAboveTarget =
                  parseFloat(month.revenue.replace("$", "").replace("K", "")) >
                  parseFloat(month.target.replace("$", "").replace("K", ""));
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isAboveTarget
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isAboveTarget ? "Above Target" : "Below Target"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysis;
