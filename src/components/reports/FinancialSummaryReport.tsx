// components/reports/FinancialSummaryReport.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { reportApi } from '../../api/reportApi';
import type { FinancialSummaryDTO, FinancialSummaryRequest } from '../../api/reportApi';

// npm install recharts
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

interface FinancialSummaryReportProps {
  onBack: () => void;
}

const PERIOD_OPTIONS = [
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const QUARTER_OPTIONS = [
  { value: 1, label: 'Q1 (Jan-Mar)' },
  { value: 2, label: 'Q2 (Apr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dec)' },
];

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const REVENUE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
const EXPENSE_VISUALIZATION_COLOR = '#3B82F6'; // Blue color similar to Export Report button

export const FinancialSummaryReport: React.FC<FinancialSummaryReportProps> = ({ onBack }) => {
  const currentYear = new Date().getFullYear();
  
  const [periodType, setPeriodType] = useState<string>('QUARTERLY');
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(1);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [summaryData, setSummaryData] = useState<FinancialSummaryDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [generatingExcel, setGeneratingExcel] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // Create a ref for the header
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFinancialSummary();
  }, [periodType, year, quarter, month]);

  // Add scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add a small threshold to prevent flickering
        setIsSticky(scrollTop > headerHeight + 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadFinancialSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: FinancialSummaryRequest = {
        periodType,
        year
      };

      if (periodType === 'QUARTERLY') {
        params.quarter = quarter;
      } else if (periodType === 'MONTHLY') {
        params.month = month;
      }

      const data = await reportApi.getFinancialSummaryData(params);
      setSummaryData(data);
    } catch (err) {
      console.error('Error loading financial summary:', err);
      setError('Failed to load financial summary data');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (type: string) => {
    setPeriodType(type);
  };

  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
  };

  const handleQuarterChange = (value: string) => {
    setQuarter(parseInt(value));
  };

  const handleMonthChange = (value: string) => {
    setMonth(parseInt(value));
  };

  const generatePdfReport = async () => {
    try {
      setGeneratingPdf(true);
      const params: FinancialSummaryRequest = {
        periodType,
        year,
        quarter: periodType === 'QUARTERLY' ? quarter : undefined,
        month: periodType === 'MONTHLY' ? month : undefined,
      };
      
      const blob = await reportApi.exportFinancialSummaryPdf(params);
      const filename = `financial-summary-${periodType.toLowerCase()}-${year}${
        periodType === 'QUARTERLY' ? `-Q${quarter}` : 
        periodType === 'MONTHLY' ? `-${month}` : ''
      }.pdf`;
      
      downloadFile(blob, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateExcelReport = async () => {
    try {
      setGeneratingExcel(true);
      const params: FinancialSummaryRequest = {
        periodType,
        year,
        quarter: periodType === 'QUARTERLY' ? quarter : undefined,
        month: periodType === 'MONTHLY' ? month : undefined,
      };
      
      const blob = await reportApi.exportFinancialSummaryExcel(params);
      const filename = `financial-summary-${periodType.toLowerCase()}-${year}${
        periodType === 'QUARTERLY' ? `-Q${quarter}` : 
        periodType === 'MONTHLY' ? `-${month}` : ''
      }.xlsx`;
      
      downloadFile(blob, filename);
    } catch (err) {
      console.error('Error generating Excel:', err);
      setError('Failed to generate Excel report');
    } finally {
      setGeneratingExcel(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getPeriodDescription = () => {
    switch (periodType) {
      case 'QUARTERLY':
        return `Q${quarter} ${year}`;
      case 'YEARLY':
        return `${year}`;
      case 'MONTHLY':
        const monthName = MONTH_OPTIONS.find(m => m.value === month)?.label || `Month ${month}`;
        return `${monthName} ${year}`;
      default:
        return `${year}`;
    }
  };

  // Prepare data for revenue pie chart
  const getRevenueData = () => {
    if (!summaryData) return [];
    return summaryData.revenueByCategory.map((item, index) => ({
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentage,
      color: REVENUE_COLORS[index % REVENUE_COLORS.length] || item.color || '#cccccc'
    }));
  };

  // Prepare data for monthly trend chart
  const getTrendData = () => {
    if (!summaryData) return [];
    return Object.entries(summaryData.monthlyTrend || {}).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  // Prepare data for expense breakdown
  const getExpenseData = () => {
    if (!summaryData) return [];
    return summaryData.expenseByCategory.map((item, index) => ({
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentage,
      color: REVENUE_COLORS[(index + 2) % REVENUE_COLORS.length]
    }));
  };

  if (loading && !summaryData) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading financial summary...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header - This will stick to top when scrolling */}
      <div 
        ref={headerRef}
        className={`bg-white p-6 rounded-lg border border-gray-200 transition-all duration-300 `}
      >
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${isSticky ? 'container mx-auto' : ''}`}>
          <div>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Reports
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Summary Report</h1>
                <p className="text-gray-600 mt-1">
                  High-level financial overview for board decision making
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative group">
              <Button
                variant="primary"
                disabled={generatingPdf || generatingExcel || !summaryData}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Report
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={generateExcelReport}
                  disabled={generatingExcel}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingExcel ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Generating Excel...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as Excel
                    </>
                  )}
                </button>
                <button
                  onClick={generatePdfReport}
                  disabled={generatingPdf}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingPdf ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding when header is sticky to prevent content from jumping under it */}
      {/* {isSticky && <div className="h-24"></div>} */}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Period</h3>
            <p className="text-gray-600 text-sm">Choose the reporting period for financial summary</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Period Type:</label>
              <select
                value={periodType}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PERIOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {periodType === 'QUARTERLY' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Quarter:</label>
                <select
                  value={quarter}
                  onChange={(e) => handleQuarterChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {QUARTER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'MONTHLY' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <select
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTH_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={loadFinancialSummary}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <>
          {/* Period Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Financial Summary - {getPeriodDescription()}</h2>
                <p className="text-blue-100 mt-1">Generated for Board of Directors</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-right">
                  <p className="text-sm text-blue-200">Report Date</p>
                  <p className="font-semibold">{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(summaryData.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Rent:</p>
                    <p className="font-medium">{formatCurrency(summaryData.totalRentalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Utilities:</p>
                    <p className="font-medium">{formatCurrency(summaryData.totalUtilityIncome)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CAM:</p>
                    <p className="font-medium">{formatCurrency(summaryData.totalCAMCollection)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Other:</p>
                    <p className="font-medium">{formatCurrency(summaryData.totalOtherIncome)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    summaryData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summaryData.netProfit)}
                  </p>
                  <p className="text-sm mt-1">
                    Margin: <span className="font-medium">{formatPercentage(summaryData.profitMargin)}</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  summaryData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    summaryData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Total Expenses:</p>
                <p className="font-medium">{formatCurrency(summaryData.totalExpenses)}</p>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatPercentage(summaryData.occupancyRate)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Total Units:</p>
                    <p className="font-medium">{summaryData.totalUnits}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Occupied:</p>
                    <p className="font-medium">{summaryData.occupiedUnits}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vacant:</p>
                    <p className="font-medium">{summaryData.vacantUnits}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Active Contracts:</p>
                    <p className="font-medium">{summaryData.activeContracts}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Efficiency */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Efficiency</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {formatPercentage(summaryData.collectionEfficiency)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">Performance:</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                      summaryData.collectionEfficiency >= 90 ? 'bg-green-100 text-green-800' :
                      summaryData.collectionEfficiency >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {summaryData.collectionEfficiency >= 90 ? 'Excellent' :
                       summaryData.collectionEfficiency >= 70 ? 'Good' :
                       'Needs Attention'}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-2">Expiring Contracts (30 days):</p>
                  <p className="font-medium">{summaryData.expiringContracts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getRevenueData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getRevenueData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {getRevenueData().map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.name}:</span>
                    <span className="ml-2">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend Line Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).replace('MMK', '')}
                      label={{ value: 'Revenue (MMK)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Monthly Revenue"
                      stroke="#4CAF50" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Showing revenue trend over the last 6 months</p>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          {summaryData.expenseByCategory && summaryData.expenseByCategory.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expense Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visualization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summaryData.expenseByCategory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ 
                                backgroundColor: REVENUE_COLORS[(index + 2) % REVENUE_COLORS.length] 
                              }}
                            />
                            <span className="font-medium text-gray-900">{item.categoryName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatPercentage(item.percentage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(item.percentage, 100)}%`,
                                  backgroundColor: EXPENSE_VISUALIZATION_COLOR 
                                }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-500 w-16 text-right">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 font-semibold text-gray-900">Total Expenses</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatCurrency(summaryData.totalExpenses)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">100%</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: '100%',
                                backgroundColor: EXPENSE_VISUALIZATION_COLOR 
                              }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Financial Health Assessment */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${
                summaryData.netProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    summaryData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {summaryData.netProfit >= 0 ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Profitability</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {summaryData.netProfit >= 0 ? 'Profitable operations' : 'Loss-making period'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                summaryData.occupancyRate >= 80 ? 'bg-green-50 border border-green-200' :
                summaryData.occupancyRate >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    summaryData.occupancyRate >= 80 ? 'bg-green-100' :
                    summaryData.occupancyRate >= 60 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      summaryData.occupancyRate >= 80 ? 'text-green-600' :
                      summaryData.occupancyRate >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Occupancy</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {summaryData.occupancyRate >= 80 ? 'High occupancy rate' :
                       summaryData.occupancyRate >= 60 ? 'Moderate occupancy' :
                       'Low occupancy - needs attention'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                summaryData.collectionEfficiency >= 90 ? 'bg-green-50 border border-green-200' :
                summaryData.collectionEfficiency >= 70 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    summaryData.collectionEfficiency >= 90 ? 'bg-green-100' :
                    summaryData.collectionEfficiency >= 70 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      summaryData.collectionEfficiency >= 90 ? 'text-green-600' :
                      summaryData.collectionEfficiency >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Collections</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {summaryData.collectionEfficiency >= 90 ? 'Excellent collection rate' :
                       summaryData.collectionEfficiency >= 70 ? 'Acceptable collection rate' :
                       'Poor collection - review needed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!summaryData && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">Select a period to view financial summary</p>
        </div>
      )}
    </div>
  );
};