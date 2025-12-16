/** @format */

import React, { useState } from 'react';
import { TenantContractSummary } from '../../components/reports/TenantContractSummary';
import { VacantOccupiedUnitsReport } from '../../components/reports/VacantOccupiedUnitsReport';
import { ExpiringContractsReport } from '../../components/reports/ExpiringContractsReport';
import { ContractHistoryReport } from '../../components/reports/ContractHistoryReport';
import { RentalRevenueByBusinessTypeReport } from '../../components/reports/RentalRevenueByBusinessTypeReport';
import { OutstandingBalancesReport } from '../../components/reports/OutstandingBalancesReport';
import { UtilityConsumptionReport } from '../../components/reports/UtilityConsumptionReport';
import { MonthlyCollectionReport } from '../../components/reports/MonthlyCollectionReport';

type ReportType = 
  | 'TENANT_CONTRACT_SUMMARY' 
  | 'EXPIRING_CONTRACTS' 
  | 'VACANT_OCCUPIED_UNITS' 
  | 'CONTRACT_HISTORY'
  | 'MONTHLY_BILLING_SUMMARY' 
  | 'UTILITY_CONSUMPTION' 
  | 'OUTSTANDING_BALANCES' 
  | 'REVENUE_BY_CATEGORY' 
  | 'EXPENSE_VS_REVENUE'
  | null;

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>(null);

  const reportTypes = [
    {
      id: 'TENANT_CONTRACT_SUMMARY' as ReportType,
      title: "Tenant Contract Summary",
      description: "Summary of all tenant contracts with current status",
      icon: "📊"
    },
    {
      id: 'EXPIRING_CONTRACTS' as ReportType,
      title: "Expiring Contracts",
      description: "List of contracts due to expire within 30 days",
      icon: "⏰"
    },
    {
      id: 'VACANT_OCCUPIED_UNITS' as ReportType,
      title: "Vacant vs Occupied Units",
      description: "Occupancy statistics for the mall",
      icon: "🏢"
    },
    {
      id: 'CONTRACT_HISTORY' as ReportType,
      title: "Contract History Report",
      description: "Complete history of contract changes, renewals, and terminations",
      icon: "📋"
    },
    {
      id: 'MONTHLY_BILLING_SUMMARY' as ReportType,
      title: "Monthly Billing Summary",
      description: "Summary of all charges for a billing month",
      icon: "💰"
    },
    {
      id: 'UTILITY_CONSUMPTION' as ReportType,
      title: "Utility Consumption",
      description: "Detailed breakdown of utility usage and costs",
      icon: "⚡"
    },
    {
    id: 'OUTSTANDING_BALANCES' as ReportType,
    title: "Outstanding Balances",
    description: "List of all tenants with unpaid invoices",
    icon: "📝"
  },
    {
      id: 'REVENUE_BY_CATEGORY' as ReportType,
      title: "Revenue by Category",
      description: "Income grouped by tenant type (Retail, Food, etc.)",
      icon: "📈"
    },
    {
      id: 'EXPENSE_VS_REVENUE' as ReportType,
      title: "Expense vs Revenue",
      description: "Comparison of total income vs mall expenses",
      icon: "⚖️"
    }
  ];

  const handleGenerateReport = (reportId: ReportType) => {
    setActiveReport(reportId);
  };

  const handleBackToReports = () => {
    setActiveReport(null);
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'TENANT_CONTRACT_SUMMARY':
        return <TenantContractSummary onBack={handleBackToReports} />;
      case 'EXPIRING_CONTRACTS':
        return <ExpiringContractsReport onBack={handleBackToReports} />;
      case 'CONTRACT_HISTORY':
        return <ContractHistoryReport onBack={handleBackToReports} />;
      case 'VACANT_OCCUPIED_UNITS':
        return <VacantOccupiedUnitsReport onBack={handleBackToReports} />;
        case 'REVENUE_BY_CATEGORY':  // Add this case
      return <RentalRevenueByBusinessTypeReport onBack={handleBackToReports} />;
      case 'UTILITY_CONSUMPTION':
  return <UtilityConsumptionReport onBack={handleBackToReports} />;
        case 'OUTSTANDING_BALANCES':
  return <OutstandingBalancesReport onBack={handleBackToReports} />;
      case 'MONTHLY_BILLING_SUMMARY':
        return <MonthlyCollectionReport onBack={handleBackToReports} />;
      case 'EXPENSE_VS_REVENUE':
        
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Monthly Billing Summary Report</h2>
            <p className="text-stone-600 mb-4">This report will show monthly billing information</p>
            <button 
              onClick={handleBackToReports}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-150"
            >
              Back to Reports
            </button>
          </div>
        );
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
            <h1 className="text-3xl font-bold text-stone-900">Reports & Analytics</h1>
            <p className="text-stone-600 mt-2">
              Generate detailed reports and analytics for your mall management
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>

            <button className="border border-stone-300 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-50 flex items-center gap-2 text-sm transition duration-150">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export All
            </button>
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
                  className="w-5 h-5 text-stone-400 group-hover:text-red-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-red-600 transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                {report.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <button 
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateReport(report.id);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate
                </button>
                
                <button className="border border-stone-300 text-stone-700 px-3 py-2 rounded text-sm hover:bg-stone-50 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDF
                </button>
                
                <button className="border border-stone-300 text-stone-700 px-3 py-2 rounded text-sm hover:bg-stone-50 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Excel
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Total Tenants</p>
                <p className="text-2xl font-bold text-stone-900">156</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Occupied Units</p>
                <p className="text-2xl font-bold text-stone-900">142</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-stone-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-stone-900">45.2M</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;