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
    <div className="p-4 sm:p-8 space-y-6 bg-stone-50 min-h-screen">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900">
              Total Revenue
            </h3>
            <PieChart className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-stone-900">$12.8M</p>
          <p className="text-sm text-green-600 mt-2 font-medium">
            +15.2% from previous year
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900">
              Revenue Growth
            </h3>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-stone-900">15.2%</p>
          <p className="text-sm text-green-600 mt-2 font-medium">Above industry average</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900">Properties</h3>
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-stone-900">8</p>
          <p className="text-sm text-stone-600 mt-2 font-medium">
            Active revenue-generating properties
          </p>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-xl font-bold text-stone-900 mb-6 pb-3 border-b border-stone-200">
          Revenue by Business Category
        </h3>
        <div className="space-y-3">
          {revenueData.byCategory.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-red-50/30 transition duration-150"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    index === 0
                      ? "bg-red-600"
                      : index === 1
                      ? "bg-green-600"
                      : index === 2
                      ? "bg-purple-600"
                      : "bg-orange-600"
                  }`}
                ></div>
                <div>
                  <p className="font-semibold text-stone-900">
                    {category.category}
                  </p>
                  <p className="text-sm text-stone-500">
                    {category.percentage}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-stone-900">
                  {category.revenue}
                </p>
                <p className="text-sm text-green-600 font-medium">{category.growth}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Property */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-xl font-bold text-stone-900 mb-6 pb-3 border-b border-stone-200">
          Revenue by Property
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revenueData.byProperty.map((property, index) => (
            <div key={index} className="bg-stone-50 rounded-lg p-5 hover:bg-red-50/30 transition duration-150 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-stone-900">
                  {property.property}
                </h4>
                <span className="text-sm text-green-600 font-medium">
                  {property.growth}
                </span>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-bold text-stone-900">
                  {property.revenue}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">Occupancy Rate</span>
                  <span className="font-bold text-red-600">
                    {property.occupancy}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-xl font-bold text-stone-900 mb-6 pb-3 border-b border-stone-200">
          Monthly Revenue Trends
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Actual Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Target Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {revenueData.monthlyTrend.map((month, index) => {
                const isAboveTarget =
                  parseFloat(month.revenue.replace("$", "").replace("K", "")) >
                  parseFloat(month.target.replace("$", "").replace("K", ""));
                return (
                  <tr key={index} className="hover:bg-red-50/30 transition duration-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {month.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {month.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
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