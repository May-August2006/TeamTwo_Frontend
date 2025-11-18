/** @format */

import React from "react";
import {
  Target,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
} from "lucide-react";

const PerformanceMetrics: React.FC = () => {
  const metrics = {
    occupancy: [
      { property: "Main Mall", rate: "98%", trend: "up", change: "+2%" },
      { property: "Business Tower", rate: "96%", trend: "up", change: "+1%" },
      { property: "Plaza Center", rate: "94%", trend: "stable", change: "0%" },
      { property: "Garden Complex", rate: "92%", trend: "up", change: "+3%" },
    ],
    collection: [
      {
        metric: "Collection Efficiency",
        value: "94.8%",
        target: "95%",
        status: "on-track",
      },
      {
        metric: "Days Sales Outstanding",
        value: "4.2 days",
        target: "5 days",
        status: "excellent",
      },
      {
        metric: "Late Payments",
        value: "5.2%",
        target: "5%",
        status: "slightly-above",
      },
      {
        metric: "Bad Debt Ratio",
        value: "0.8%",
        target: "1%",
        status: "excellent",
      },
    ],
    tenant: [
      {
        metric: "Tenant Retention",
        value: "92%",
        industryAvg: "85%",
        trend: "up",
      },
      { metric: "New Leases", value: "45", industryAvg: "38", trend: "up" },
      {
        metric: "Tenant Satisfaction",
        value: "4.5/5",
        industryAvg: "4.2/5",
        trend: "stable",
      },
      {
        metric: "Lease Renewal Rate",
        value: "88%",
        industryAvg: "82%",
        trend: "up",
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "on-track":
        return "bg-blue-100 text-blue-800";
      case "slightly-above":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "down")
      return (
        <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
      );
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Occupancy
            </h3>
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">96.5%</p>
          <p className="text-sm text-green-600 mt-2">+2.3% from last quarter</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Collection Rate
            </h3>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">94.8%</p>
          <p className="text-sm text-green-600 mt-2">+1.7% improvement</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tenant Retention
            </h3>
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">92%</p>
          <p className="text-sm text-green-600 mt-2">+7% above industry avg</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Score
            </h3>
            <Target className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">8.7/10</p>
          <p className="text-sm text-green-600 mt-2">Excellent performance</p>
        </div>
      </div>

      {/* Occupancy Rates by Property */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Occupancy Rates by Property
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.occupancy.map((property, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  {property.property}
                </h4>
                {getTrendIcon(property.trend)}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {property.rate}
              </p>
              <p
                className={`text-sm ${
                  property.trend === "up"
                    ? "text-green-600"
                    : property.trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {property.change} from last quarter
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Collection Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Collection Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.collection.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{item.metric}</h4>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status.replace("-", " ")}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target</span>
                  <span className="font-semibold text-blue-600">
                    {item.target}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Tenant Relationship Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.tenant.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{metric.metric}</h4>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-900">
                  {metric.value}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Industry Average</span>
                  <span className="font-semibold text-purple-600">
                    {metric.industryAvg}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">96.5%</p>
            <p className="text-blue-200">Average Occupancy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">94.8%</p>
            <p className="text-blue-200">Collection Efficiency</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">8.7/10</p>
            <p className="text-blue-200">Overall Performance Score</p>
          </div>
        </div>
        <p className="text-blue-200 text-center mt-4">
          All key metrics are performing above industry standards
        </p>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
