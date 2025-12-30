// components/reports/OutstandingBalancesReport.tsx
import React, { useState, useEffect, useRef } from 'react';
import { reportApi } from '../../api/reportApi';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { OutstandingBalanceReportDTO, OutstandingBalanceFilterDTO } from '../../types/outstanding-balances';

interface OutstandingBalancesReportProps {
  onBack: () => void;
}

// Overdue categories for filtering
const OVERDUE_CATEGORIES = [
  { value: 'all', label: 'All Overdue Periods' },
  { value: '1-30', label: '1-30 days overdue' },
  { value: '31-60', label: '31-60 days overdue' },
  { value: '61+', label: '61+ days overdue' },
];

export const OutstandingBalancesReport: React.FC<OutstandingBalancesReportProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<OutstandingBalanceReportDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // Create a ref for the header
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [filters, setFilters] = useState<OutstandingBalanceFilterDTO>({
    overdueCategory: 'all'
  });

  // Load data when component mounts or filters change
  useEffect(() => {
    loadReportData();
  }, [filters]);

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
      
      // Actually fetch data from API
      const data = await reportApi.getOutstandingBalancesData(filters);
      setReportData(data);
      
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<OutstandingBalanceFilterDTO>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      overdueCategory: 'all',
      tenantName: undefined
    });
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(true);
      
      const exportParams = {
        ...filters,
        format: format === 'excel' ? 'excel' : 'pdf'
      };

      const blob = await reportApi.exportOutstandingBalancesReport(exportParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with correct extension
      const today = new Date().toISOString().split('T')[0];
      let filename = `outstanding-balances-${today}`;
      
      if (filters.startDate && filters.endDate) {
        const start = filters.startDate.replace(/-/g, '');
        const end = filters.endDate.replace(/-/g, '');
        filename += `-${start}-${end}`;
      }
      
      if (filters.overdueCategory && filters.overdueCategory !== 'all') {
        // Clean up category for filename
        const categoryClean = filters.overdueCategory.replace('+', 'plus');
        filename += `-${categoryClean}`;
      }
      
      // IMPORTANT: Use correct extension
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      filename += `.${extension}`;
      
      // Set proper content type for download
      link.download = filename;
      link.setAttribute('type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exporting ${format.toUpperCase()}:`, err);
      setError(`Failed to export ${format.toUpperCase()} report`);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => exportReport('pdf');
  const exportToExcel = () => exportReport('excel');

  // Calculate summary statistics
  const calculateSummary = () => {
    if (reportData.length === 0) {
      return {
        totalOutstanding: 0,
        totalInvoices: 0,
        avgOverdueDays: 0,
        oldestOverdue: 0
      };
    }

    const totalOutstanding = reportData.reduce((sum, item) => sum + item.balanceAmount, 0);
    const totalOverdueDays = reportData.reduce((sum, item) => sum + item.daysOverdue, 0);
    const oldestOverdue = Math.max(...reportData.map(item => item.daysOverdue));
    
    return {
      totalOutstanding,
      totalInvoices: reportData.length,
      avgOverdueDays: Math.round(totalOverdueDays / reportData.length),
      oldestOverdue
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days <= 0) {
      return (
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
          Not overdue
        </span>
      );
    } else if (days <= 30) {
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          {days} days
        </span>
      );
    } else if (days <= 60) {
      return (
        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
          {days} days
        </span>
      );
    } else {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
          {days} days
        </span>
      );
    }
  };

  const getStatusBadge = (status: string, daysOverdue: number) => {
    if (status === 'PAID') {
      return (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          Paid
        </span>
      );
    } else if (status === 'PARTIAL') {
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          Partial
        </span>
      );
    } else if (daysOverdue > 60) {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
          Severely Overdue
        </span>
      );
    } else if (daysOverdue > 30) {
      return (
        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
          Overdue
        </span>
      );
    } else if (daysOverdue > 0) {
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          Overdue
        </span>
      );
    } else if (status === 'UNPAID') {
      return (
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
          Unpaid
        </span>
      );
    } else {
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {status}
        </span>
      );
    }
  };

  const summary = calculateSummary();
  const hasActiveFilters = filters.startDate || filters.endDate || 
                          (filters.overdueCategory && filters.overdueCategory !== 'all') || 
                          filters.tenantName;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-stone-600">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header - This will stick to top when scrolling */}
      <div 
        ref={headerRef}
        className={`bg-white p-6 rounded-lg border border-stone-200 transition-all duration-300`}
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
                <h1 className="text-2xl font-bold text-stone-900">Outstanding Balances Report</h1>
                <p className="text-stone-600 mt-1">
                  List of all tenants with unpaid invoices and overdue payments
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={exportToPDF}
              loading={exporting}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PDF
            </Button>
            <Button
              variant="success"
              onClick={exportToExcel}
              loading={exporting}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Export Excel (XLSX)
            </Button>
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

      {/* Summary Statistics */}
      {reportData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-700 font-medium">Total Outstanding</div>
              <div className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(summary.totalOutstanding)}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-700 font-medium">Total Invoices</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">{summary.totalInvoices}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-700 font-medium">Avg. Overdue Days</div>
              <div className="text-2xl font-bold text-yellow-900 mt-1">{summary.avgOverdueDays} days</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">Oldest Overdue</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">{summary.oldestOverdue} days</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Filter Outstanding Balances</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range - Start Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Date Range - End Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Overdue Category */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Overdue Period
            </label>
            <select
              value={filters.overdueCategory || 'all'}
              onChange={(e) => handleFilterChange({ overdueCategory: e.target.value })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {OVERDUE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFilterChange({ overdueCategory: '1-30' })}
          >
            Show 1-30 days
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFilterChange({ overdueCategory: '31-60' })}
          >
            Show 31-60 days
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFilterChange({ overdueCategory: '61+' })}
          >
            Show 61+ days
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const today = new Date();
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(today.getDate() - 30);
              
              handleFilterChange({
                startDate: thirtyDaysAgo.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
            }}
          >
            Last 30 days
          </Button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Active Filters:</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.startDate && filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Date: {filters.startDate} to {filters.endDate}
                </span>
              )}
              {filters.startDate && !filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  From: {filters.startDate}
                </span>
              )}
              {!filters.startDate && filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  To: {filters.endDate}
                </span>
              )}
              {filters.overdueCategory && filters.overdueCategory !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Overdue: {filters.overdueCategory} days
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Report Information</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This report shows all outstanding invoices with overdue payments. 
              Apply filters to narrow down results, then export in PDF or Excel format. 
              The exported report will include detailed information based on your filters.
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {reportData.length > 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {reportData.map((item, index) => (
                  <tr key={index} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-stone-900">
                        {item.invoiceNumber}
                      </div>
                      <div className="text-sm text-stone-500">
                        Due: {formatDate(item.dueDate)}
                      </div>
                      <div className="text-xs text-stone-400">
                        Issued: {formatDate(item.issueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-stone-900">
                        {item.tenantName}
                      </div>
                      <div className="text-sm text-stone-500">
                        {item.roomNumber} • {item.buildingName}
                      </div>
                      <div className="text-xs text-stone-400">
                        {item.businessType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-red-600">
                        {formatCurrency(item.balanceAmount)} outstanding
                      </div>
                      <div className="text-sm text-stone-500">
                        Total: {formatCurrency(item.totalAmount)}
                      </div>
                      <div className="text-xs text-stone-400">
                        Paid: {formatCurrency(item.paidAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getDaysOverdueBadge(item.daysOverdue)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.invoiceStatus, item.daysOverdue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white p-6 rounded-lg border border-stone-200 text-center">
          <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-stone-900">No outstanding balances found</h3>
          <p className="mt-1 text-sm text-stone-500">
            {hasActiveFilters 
              ? "No invoices match your current filters. Try adjusting your search criteria."
              : "No outstanding invoices found. All invoices are paid up to date."}
          </p>
        </div>
      )}

      {/* What's Included Section */}
      <div className="bg-white p-6 rounded-lg border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">What's Included in the Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-stone-800 mb-2">PDF Report Features:</h4>
            <ul className="text-stone-600 space-y-2 text-sm">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Professional formatting with mall branding
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Color-coded overdue categories
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Summary page with total outstanding
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Print-ready format
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-stone-800 mb-2">Excel Report Features:</h4>
            <ul className="text-stone-600 space-y-2 text-sm">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sortable and filterable columns
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Conditional formatting for overdue days
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Formulas for automatic calculations
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Ready for further analysis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutstandingBalancesReport;