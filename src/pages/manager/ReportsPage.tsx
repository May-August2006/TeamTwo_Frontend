/** @format */

import React, { useState, useEffect } from "react";

interface Report {
  id: string;
  name: string;
  generatedDate: string;
  period: string;
  format: string;
  size: string;
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportPeriod, setReportPeriod] = useState("monthly");

  useEffect(() => {
    // Mock data - replace with API call
    const mockReports: Report[] = [
      {
        id: "1",
        name: "Monthly Revenue Report",
        generatedDate: "2024-01-15",
        period: "January 2024",
        format: "PDF",
        size: "2.4 MB",
      },
      {
        id: "2",
        name: "Tenant Occupancy Summary",
        generatedDate: "2024-01-10",
        period: "Q4 2023",
        format: "Excel",
        size: "1.8 MB",
      },
      {
        id: "3",
        name: "Utility Consumption Analysis",
        generatedDate: "2024-01-05",
        period: "December 2023",
        format: "PDF",
        size: "3.1 MB",
      },
    ];

    setReports(mockReports);
  }, []);

  const reportTypes = [
    {
      title: "Tenant Contract Summary",
      description: "Summary of all tenant contracts with current status",
    },
    {
      title: "Expiring Contracts",
      description: "List of contracts due to expire within 30 days",
    },
    {
      title: "Vacant vs Occupied Units",
      description: "Occupancy statistics for the mall",
    },
    {
      title: "Monthly Billing Summary",
      description: "Summary of all charges for a billing month",
    },
    {
      title: "Utility Consumption",
      description: "Detailed breakdown of utility usage and costs",
    },
    {
      title: "Outstanding Balances",
      description: "List of all tenants with unpaid invoices",
    },
    {
      title: "Revenue by Category",
      description: "Income grouped by tenant type (Retail, Food, etc.)",
    },
    {
      title: "Expense vs Revenue",
      description: "Comparison of total income vs mall expenses",
    },
  ];

  const handleGenerateReport = (title: string) => {
    console.log(`Generating report: ${title}`);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
          Reports & Analytics
        </h1>

        <div className="flex flex-wrap gap-2">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm sm:text-base">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export All
          </button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {reportTypes.map((report, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{report.description}</p>

            <div className="flex flex-wrap gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                onClick={() => handleGenerateReport(report.title)}
              >
                Generate
              </button>
              <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                PDF
              </button>
              <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Recent Reports
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4 text-gray-900 font-medium">
                      {report.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {report.generatedDate}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {report.period}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {report.format}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {report.size}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex gap-3">
                        <button className="text-blue-600 hover:text-blue-900">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Small screen note */}
          <p className="mt-3 text-xs text-gray-400 text-center sm:hidden">
            Swipe horizontally to view full table →
          </p>
        </div>
      </div>
    </div>
  );
};
