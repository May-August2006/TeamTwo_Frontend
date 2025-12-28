/** @format */

import React, { useState } from "react";
import { OutstandingBalancesReport } from "../reports/OutstandingBalancesReport";
import DailyCollectionReport from "../accountant/DailyCollectionReport"; // Keep this if you want it separate
import { MonthlyCollectionReport } from '../../components/reports/MonthlyCollectionReport';

type ReportType = "DAILY_COLLECTION" | "OUTSTANDING_BALANCES" | "MONTHLY_BILLING_SUMMARY" | null;

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>(null);

  const reportTypes = [
    {
      id: "DAILY_COLLECTION" as ReportType,
      title: "Daily Collection Report",
      description: "Summary of all payments collected on a specific date",
      icon: "💰",
    },
    {
      id: "OUTSTANDING_BALANCES" as ReportType,
      title: "Outstanding Balances",
      description: "List of all tenants with unpaid invoices",
      icon: "📝",
    },
    {
      id: "MONTHLY_BILLING_SUMMARY" as ReportType,
      title: "Monthly Billing Summary",
      description: "Summary of all charges for a billing month",
      icon: "💰"
    },
  ];

  const handleGenerateReport = (reportId: ReportType) => {
    setActiveReport(reportId);
  };

  const handleBackToReports = () => {
    setActiveReport(null);
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case "DAILY_COLLECTION":
        return <DailyCollectionReport onBack={handleBackToReports} />;
      case "OUTSTANDING_BALANCES":
        return <OutstandingBalancesReport onBack={handleBackToReports} />;
         case 'MONTHLY_BILLING_SUMMARY':
                return <MonthlyCollectionReport onBack={handleBackToReports} />;
      default:
        return null;
    }
  };

  if (activeReport) {
    return (
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderActiveReport()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              Accountant Reports
            </h1>
            <p className="text-stone-600 mt-2">
              Generate detailed financial reports
            </p>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
              onClick={() => handleGenerateReport(report.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{report.icon}</div>
                <svg
                  className="w-5 h-5 text-stone-400 group-hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-blue-700-600 transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                {report.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateReport(report.id);
                  }}
                >
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
                  Generate
                </button>

                <button className="border border-stone-300 text-stone-700 px-3 py-2 rounded text-sm hover:bg-stone-50 transition-colors flex items-center gap-1">
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  PDF
                </button>

                <button className="border border-stone-300 text-stone-700 px-3 py-2 rounded text-sm hover:bg-stone-50 transition-colors flex items-center gap-1">
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
      </div>
    </div>
  );
};

export default ReportsPage;
