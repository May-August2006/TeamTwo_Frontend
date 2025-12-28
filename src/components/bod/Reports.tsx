/** @format */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Calendar, BarChart3, TrendingUp, DollarSign, PieChart, Building } from 'lucide-react';
import { FinancialSummaryReport } from '../../components/reports/FinancialSummaryReport';
// Import BOD-specific report components (you'll need to create these)

import { ExpenseVsRevenueReport } from '../../components/reports/ExpenseVsRevenueReport';
import { RentalRevenueByBusinessTypeReport } from '../../components/reports/RentalRevenueByBusinessTypeReport';

type BODReportType = 
  | 'FINANCIAL_SUMMARY'
  | 'EXPENSE_VS_REVENUE'
  | 'REVENUE_BY_CATEGORY'
  | null;

export const BODReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<BODReportType>(null);
  const { t } = useTranslation();

  // BOD-SPECIFIC REPORTS ONLY (from user story)
  const bodReports = [
     {
    id: 'FINANCIAL_SUMMARY' as BODReportType,
    title: t('reports.financialSummary', "Quarterly/Yearly Financial Summary"),
    description: t('reports.financialSummaryDesc', "High-level financial overview for board decision making"),
    icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
    color: "blue",
    formats: ["PDF", "Excel"],
    availablePeriods: ["Quarterly", "Yearly", "Monthly"]
  },
    {
      id: 'EXPENSE_VS_REVENUE' as BODReportType,
      title: t('reports.expenseVsRevenue', "Expense vs Revenue Comparison"),
      description: t('reports.expenseVsRevenueDesc', "Profitability analysis and margin tracking"),
      icon: <DollarSign className="w-8 h-8 text-purple-600" />,
      color: "purple",
      formats: ["PDF", "Excel"],
      availablePeriods: ["Monthly", "Quarterly", "Yearly"]
    },
    {
      id: 'REVENUE_BY_CATEGORY' as BODReportType,
      title: t('reports.revenueByCategory', "Revenue by Business Category"),
      description: t('reports.revenueByCategoryDesc', "Income breakdown by tenant type (Retail, Food, Services)"),
      icon: <PieChart className="w-8 h-8 text-orange-600" />,
      color: "orange",
      formats: ["PDF", "Excel"],
      availablePeriods: ["Monthly", "Quarterly", "Yearly"]
    },
  ];

  const renderActiveReport = () => {
    switch (activeReport) {
     case 'FINANCIAL_SUMMARY':
      return <FinancialSummaryReport onBack={() => setActiveReport(null)} />;
      case 'EXPENSE_VS_REVENUE':
        return <ExpenseVsRevenueReport onBack={() => setActiveReport(null)} />;
      case 'REVENUE_BY_CATEGORY':
        return <RentalRevenueByBusinessTypeReport onBack={() => setActiveReport(null)} />;
      default:
        return null;
    }
  };

  if (activeReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderActiveReport()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BOD Header - More Premium Look */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('bodReports.title', "Board of Directors Dashboard")}
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                {t('bodReports.subtitle', "Strategic reports and analytics for executive decision making")}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              
              
            </div>
          </div>
        </div>

        

        {/* BOD Reports Grid */}
        <div className="mb-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bodReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 cursor-pointer group"
                onClick={() => setActiveReport(report.id)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${
                    report.color === 'blue' ? 'from-blue-50 to-blue-100' :
                    report.color === 'green' ? 'from-green-50 to-green-100' :
                    report.color === 'purple' ? 'from-purple-50 to-purple-100' :
                    report.color === 'orange' ? 'from-orange-50 to-orange-100' :
                    'from-teal-50 to-teal-100'
                  }`}>
                    {report.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {report.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {report.description}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Available Formats:</span>
                    <div className="flex gap-2">
                      {report.formats.map((format) => (
                        <span key={format} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Time Periods:</span>
                    <div className="flex gap-1">
                      {report.availablePeriods.slice(0, 3).map((period) => (
                        <span key={period} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {period}
                        </span>
                      ))}
                      {report.availablePeriods.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{report.availablePeriods.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button 
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReport(report.id);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      {t('bodReports.viewReport', "View Report")}
                    </button>
                    
                    <button 
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle PDF download
                      }}
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default BODReportsPage;