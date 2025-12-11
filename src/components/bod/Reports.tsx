/** @format */

import React from "react";
import { FileText, Download, Calendar, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

const Reports: React.FC = () => {
  const reports = [
    { 
      name: "Quarterly Financial Summary", 
      period: "Q4 2024", 
      format: "PDF, Excel", 
      size: "2.4 MB",
      description: "Complete financial overview for the quarter",
      category: "Financial"
    },
    { 
      name: "Yearly Financial Summary", 
      period: "2024", 
      format: "PDF, Excel", 
      size: "4.8 MB",
      description: "Annual financial performance report",
      category: "Financial"
    },
    { 
      name: "Quarterly Revenue by Category", 
      period: "Q4 2024", 
      format: "PDF, Excel", 
      size: "1.8 MB",
      description: "Revenue breakdown by tenant business type",
      category: "Revenue"
    },
    { 
      name: "Yearly Revenue by Category", 
      period: "2024", 
      format: "PDF, Excel", 
      size: "3.2 MB",
      description: "Annual revenue analysis by category",
      category: "Revenue"
    },
    { 
      name: "Quarterly Expense vs Revenue Comparison", 
      period: "Q4 2024", 
      format: "PDF, Excel", 
      size: "1.6 MB",
      description: "Profitability analysis for the quarter",
      category: "Financial"
    },
    { 
      name: "Yearly Expense vs Revenue Comparison", 
      period: "2024", 
      format: "PDF, Excel", 
      size: "2.9 MB",
      description: "Annual profitability and margin analysis",
      category: "Financial"
    },
  ];

  const recentReports = [
    { name: "Q4 Financial Summary", generated: "2024-12-15", period: "Oct-Dec 2024", format: "PDF" },
    { name: "2024 Annual Report", generated: "2025-01-10", period: "Jan-Dec 2024", format: "PDF, Excel" },
    { name: "Revenue by Category Q4", generated: "2024-12-20", period: "Oct-Dec 2024", format: "Excel" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}


      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Financial Reports</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">4</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200">
              <DollarSign className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Quarterly and yearly summaries</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Reports</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">2</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Category-based analysis</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">6</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <FileText className="w-6 h-6 text-indigo-700" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Available for download</p>
        </div>
      </div>

      {/* Available Reports */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Available Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Quarterly and yearly reports for download</p>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {reports.map((report, index) => (
            <div key={index} className="p-6 hover:bg-blue-50/30 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      report.category === 'Financial' 
                        ? 'bg-gradient-to-br from-blue-100 to-blue-200' 
                        : 'bg-gradient-to-br from-green-100 to-green-200'
                    }`}>
                      {report.category === 'Financial' ? (
                        <DollarSign className="w-5 h-5 text-blue-700" />
                      ) : (
                        <BarChart3 className="w-5 h-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {report.period}
                        </span>
                        <span className="text-xs text-gray-500">{report.format}</span>
                        <span className="text-xs text-gray-500">{report.size}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200 text-sm flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg hover:from-green-700 hover:to-green-900 transition-all duration-200 text-sm flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recently Generated Reports</h3>
            <p className="text-sm text-gray-600 mt-1">Latest report generation activity</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
            <FileText className="w-5 h-5 text-indigo-700" />
          </div>
        </div>
        
        <div className="space-y-4">
          {recentReports.map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-200 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{report.name}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">Generated: {report.generated}</span>
                    <span className="text-xs text-gray-500">Period: {report.period}</span>
                    <span className="text-xs text-gray-500">Format: {report.format}</span>
                  </div>
                </div>
              </div>
              <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200 text-sm">
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;