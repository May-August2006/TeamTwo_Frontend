// src/components/reports/ExpenseVsRevenueReport.tsx

import React, { useState, useEffect, useRef } from 'react';
import { expenseVsRevenueApi, type ExpenseVsRevenueDTO, type ExpenseRevenueFilterParams } from '../../api/expense-vs-revenue-api';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';

interface ExpenseVsRevenueReportProps {
  onBack: () => void;
}

export const ExpenseVsRevenueReport: React.FC<ExpenseVsRevenueReportProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<ExpenseVsRevenueDTO[]>([]);
  const [filteredData, setFilteredData] = useState<ExpenseVsRevenueDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // Create a ref for the header
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [filters, setFilters] = useState<ExpenseRevenueFilterParams>({
    periodType: 'MONTHLY',
    year: new Date().getFullYear()
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Available years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Months
  const months = [
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
    { value: 12, label: 'December' }
  ];

  // Quarters
  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' }
  ];

  // Load data when filters change
  useEffect(() => {
    loadReportData();
  }, [filters]);

  // Apply search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(reportData);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = reportData.filter(item =>
      item.period?.toLowerCase().includes(term) ||
      item.buildingName?.toLowerCase().includes(term)
    );
    
    setFilteredData(filtered);
  }, [reportData, searchTerm]);

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

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await expenseVsRevenueApi.getExpenseVsRevenueData(filters);
      setReportData(data);
      setFilteredData(data);
    } catch (err) {
      console.error('Error loading expense vs revenue data:', err);
      setError('Failed to load expense vs revenue data. Please try again.');
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodTypeChange = (type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') => {
    setFilters(prev => ({
      ...prev,
      periodType: type,
      month: type === 'MONTHLY' ? (prev.month || new Date().getMonth() + 1) : undefined,
      quarter: type === 'QUARTERLY' ? (prev.quarter || 1) : undefined
    }));
  };

  const handleYearChange = (year: number) => {
    setFilters(prev => ({ ...prev, year }));
  };

  const handleMonthChange = (month: number) => {
    setFilters(prev => ({ ...prev, month }));
  };

  const handleQuarterChange = (quarter: number) => {
    setFilters(prev => ({ ...prev, quarter }));
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setFilters({
      periodType: 'YEARLY',
      startDate,
      endDate,
      year: undefined,
      month: undefined,
      quarter: undefined
    });
  };

  const handleClearFilters = () => {
    setFilters({
      periodType: 'MONTHLY',
      year: currentYear,
      month: new Date().getMonth() + 1
    });
    setSearchTerm('');
  };

  const generatePdfReport = async () => {
    try {
      setGeneratingPdf(true);
      
      if (filteredData.length === 0) {
        setError('No data to export');
        return;
      }
      
      const blob = await expenseVsRevenueApi.generatePdfReport(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = 'expense-vs-revenue-report';
      if (filters.periodType) {
        filename += `-${filters.periodType.toLowerCase()}`;
      }
      if (filters.year) {
        filename += `-${filters.year}`;
      }
      if (filters.month && filters.periodType === 'MONTHLY') {
        filename += `-${String(filters.month).padStart(2, '0')}`;
      }
      if (filters.quarter && filters.periodType === 'QUARTERLY') {
        filename += `-Q${filters.quarter}`;
      }
      filename += '.pdf';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateExcelReport = async () => {
    try {
      setGeneratingExcel(true);
      
      if (filteredData.length === 0) {
        setError('No data to export');
        return;
      }
      
      const blob = await expenseVsRevenueApi.generateExcelReport(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = 'expense-vs-revenue-report';
      if (filters.periodType) {
        filename += `-${filters.periodType.toLowerCase()}`;
      }
      if (filters.year) {
        filename += `-${filters.year}`;
      }
      if (filters.month && filters.periodType === 'MONTHLY') {
        filename += `-${String(filters.month).padStart(2, '0')}`;
      }
      if (filters.quarter && filters.periodType === 'QUARTERLY') {
        filename += `-Q${filters.quarter}`;
      }
      filename += '.xlsx';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Excel report:', err);
      setError('Failed to generate Excel report. Please try again.');
    } finally {
      setGeneratingExcel(false);
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const summary = {
      totalRevenue: 0,
      totalExpense: 0,
      totalNetProfit: 0,
      avgProfitMargin: 0,
      profitablePeriods: 0,
      lossPeriods: 0
    };

    filteredData.forEach(item => {
      summary.totalRevenue += item.totalRevenue || 0;
      summary.totalExpense += item.totalExpense || 0;
      summary.totalNetProfit += item.netProfit || 0;
      summary.avgProfitMargin += item.profitMargin || 0;
      
      if (item.netProfit >= 0) {
        summary.profitablePeriods++;
      } else {
        summary.lossPeriods++;
      }
    });

    if (filteredData.length > 0) {
      summary.avgProfitMargin = summary.avgProfitMargin / filteredData.length;
    }

    return summary;
  };

  const summary = calculateSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading expense vs revenue data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header - This will stick to top when scrolling */}
      <div 
        ref={headerRef}
        className={`bg-white p-6 rounded-lg border border-gray-200 transition-all duration-300 ${
          isSticky 
            ? 'fixed top-0 left-0 right-0 z-50 shadow-lg rounded-none border-t-0 border-x-0' 
            : ''
        }`}
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
                <h1 className="text-2xl font-bold text-gray-900">Expense vs Revenue Comparison</h1>
                <p className="text-gray-600 mt-1">
                  Compare total income vs mall expenses for profitability analysis (MMS-27)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear Filters
            </Button>
            
            {/* Export Dropdown */}
            <div className="relative group">
              <Button
                variant="primary"
                disabled={generatingPdf || generatingExcel || filteredData.length === 0}
                className="flex items-center gap-2"
              >
                {generatingPdf || generatingExcel ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {generatingPdf ? 'Generating PDF...' : 'Generating Excel...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </Button>
              
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={generatePdfReport}
                  disabled={generatingPdf}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as PDF
                </button>
                <button
                  onClick={generateExcelReport}
                  disabled={generatingExcel}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding when header is sticky to prevent content from jumping under it */}
      {isSticky && <div className="h-24"></div>}

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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Type
            </label>
            <select
              value={filters.periodType || 'MONTHLY'}
              onChange={(e) => handlePeriodTypeChange(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year || currentYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month (for Monthly) */}
          {filters.periodType === 'MONTHLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={filters.month || new Date().getMonth() + 1}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quarter (for Quarterly) */}
          {filters.periodType === 'QUARTERLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarter
              </label>
              <select
                value={filters.quarter || 1}
                onChange={(e) => handleQuarterChange(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {quarters.map(quarter => (
                  <option key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Periods/Buildings
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by period or building name..."
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Filter Display */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Showing:{' '}
              {filters.periodType === 'MONTHLY' && filters.month && filters.year 
                ? `${months.find(m => m.value === filters.month)?.label} ${filters.year}`
                : filters.periodType === 'QUARTERLY' && filters.quarter && filters.year
                ? `${quarters.find(q => q.value === filters.quarter)?.label} ${filters.year}`
                : filters.periodType === 'YEARLY' && filters.year
                ? `Year ${filters.year}`
                : 'All data'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalRevenue)} MMK
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalExpense)} MMK
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalNetProfit)} MMK
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Profit Margin</p>
              <p className={`text-2xl font-bold ${summary.avgProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(summary.avgProfitMargin)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length} of {reportData.length} periods
            {summary.profitablePeriods > 0 && ` • ${summary.profitablePeriods} profitable`}
            {summary.lossPeriods > 0 && ` • ${summary.lossPeriods} loss`}
          </div>
          
          {filteredData.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={generateExcelReport}
                loading={generatingExcel}
                disabled={generatingExcel || generatingPdf}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={generatePdfReport}
                loading={generatingPdf}
                disabled={generatingPdf || generatingExcel}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expense vs revenue data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {reportData.length === 0 ? 'No financial data available for selected period.' : 'Try changing your filters or search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue (MMK)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expenses (MMK)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Profit/Loss
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit Margin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.period}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.buildingName || 'All Buildings'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.totalRevenue)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.totalExpense)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.netProfit)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${item.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(item.profitMargin)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.netProfit >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.netProfit >= 0 ? 'PROFIT' : 'LOSS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Analysis */}
      {filteredData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Revenue Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Revenue:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalRevenue / filteredData.length)} MMK
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue/Expense Ratio:</span>
                  <span className="font-medium">
                    {summary.totalExpense > 0 
                      ? (summary.totalRevenue / summary.totalExpense).toFixed(2)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Expense Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Expense:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalExpense / filteredData.length)} MMK
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expense/Revenue Ratio:</span>
                  <span className="font-medium">
                    {summary.totalRevenue > 0 
                      ? ((summary.totalExpense / summary.totalRevenue) * 100).toFixed(1) + '%'
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Profitability Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profitability Rate:</span>
                  <span className="font-medium">
                    {((summary.profitablePeriods / filteredData.length) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Profit/Loss:</span>
                  <span className={`font-medium ${summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalNetProfit / filteredData.length)} MMK
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Overall Performance */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-900 text-lg">OVERALL PERFORMANCE</h4>
                <p className="text-sm text-green-700">
                  {summary.totalNetProfit >= 0 ? 'Profitable Period' : 'Loss Period'}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${summary.totalNetProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatCurrency(summary.totalNetProfit)} MMK
                </div>
                <div className="text-sm text-gray-600">
                  Profit Margin: {formatPercentage(summary.avgProfitMargin)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};