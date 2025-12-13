/** @format */

import React, { useState, useEffect } from 'react';
import { utilityConsumptionApi, type UtilityConsumptionReportDTO, type UtilityConsumptionFilterParams } from '../../api/utility-consumption-api';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';

interface UtilityConsumptionReportProps {
  onBack: () => void;
}

export const UtilityConsumptionReport: React.FC<UtilityConsumptionReportProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<UtilityConsumptionReportDTO[]>([]);
  const [filteredData, setFilteredData] = useState<UtilityConsumptionReportDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<UtilityConsumptionFilterParams>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState<'MONTHLY' | 'CUSTOM'>('MONTHLY');
  
  // Current year and month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Monthly options for dropdown
  const [monthOptions, setMonthOptions] = useState<Array<{year: number, month: number, label: string}>>([]);

  // Initialize month options
  useEffect(() => {
    const options: Array<{year: number, month: number, label: string}> = [];
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = date.toLocaleString('default', { month: 'long' });
      options.push({
        year,
        month,
        label: `${monthName} ${year}`
      });
    }
    
    setMonthOptions(options);
    
    // Set default to current month
    setFilters({
      year: currentYear,
      month: currentMonth
    });
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (filters.year && filters.month) {
      loadReportData();
    }
  }, [filters]);

  // Apply search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(reportData);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = reportData.filter(item =>
      item.tenantName?.toLowerCase().includes(term) ||
      item.roomNumber?.toLowerCase().includes(term)
    );
    
    setFilteredData(filtered);
  }, [reportData, searchTerm]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await utilityConsumptionApi.getUtilityConsumptionData(filters);
      setReportData(data);
      setFilteredData(data);
    } catch (err) {
      console.error('Error loading utility consumption data:', err);
      setError('Failed to load utility consumption data. Please try again.');
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (year: number, month: number) => {
    setFilters({
      year,
      month,
      startDate: undefined,
      endDate: undefined
    });
    setReportType('MONTHLY');
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setFilters({
      startDate,
      endDate,
      year: undefined,
      month: undefined
    });
    setReportType('CUSTOM');
  };

  const handleClearFilters = () => {
    setFilters({
      year: currentYear,
      month: currentMonth
    });
    setSearchTerm('');
    setReportType('MONTHLY');
  };

  const generatePdfReport = async () => {
    try {
      setGeneratingPdf(true);
      
      if (filteredData.length === 0) {
        setError('No data to export');
        return;
      }
      
      const blob = await utilityConsumptionApi.generatePdfReport(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = 'utility-consumption-report';
      if (filters.year && filters.month) {
        filename += `-${filters.year}-${String(filters.month).padStart(2, '0')}`;
      } else if (filters.startDate && filters.endDate) {
        filename += `-${filters.startDate}-to-${filters.endDate}`;
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
      
      const blob = await utilityConsumptionApi.generateExcelReport(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = 'utility-consumption-report';
      if (filters.year && filters.month) {
        filename += `-${filters.year}-${String(filters.month).padStart(2, '0')}`;
      } else if (filters.startDate && filters.endDate) {
        filename += `-${filters.startDate}-to-${filters.endDate}`;
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
      totalElectricityConsumption: 0,
      totalElectricityCost: 0,
      totalTransformerFee: 0,
      totalWaterCharges: 0,
      grandTotal: 0,
      totalTenants: filteredData.length
    };

    filteredData.forEach(item => {
      summary.totalElectricityConsumption += item.electricityConsumption || 0;
      summary.totalElectricityCost += (item.electricityConsumption || 0) * (item.electricityRate || 0);
      summary.totalTransformerFee += item.transformerFee || 0;
      summary.totalWaterCharges += item.waterCharges || 0;
      summary.grandTotal += item.totalUtilityCharges || 0;
    });

    return summary;
  };

  const summary = calculateSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading utility consumption data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                <h1 className="text-2xl font-bold text-gray-900">Utility Consumption Report</h1>
                <p className="text-gray-600 mt-1">
                  Detailed breakdown of utility usage and costs (MMS-23)
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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report Type Toggle */}
          <div className="flex gap-4 items-center col-span-full">
            <label className="flex items-center">
              <input
                type="radio"
                checked={reportType === 'MONTHLY'}
                onChange={() => setReportType('MONTHLY')}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Monthly Report</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={reportType === 'CUSTOM'}
                onChange={() => setReportType('CUSTOM')}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Custom Date Range</span>
            </label>
          </div>

          {/* Monthly Selector */}
          {reportType === 'MONTHLY' && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <select
                value={filters.year && filters.month ? `${filters.year}-${filters.month}` : ''}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  if (year && month) {
                    handleMonthChange(year, month);
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {monthOptions.map(option => (
                  <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Range */}
          {reportType === 'CUSTOM' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleCustomDateChange(e.target.value, filters.endDate || '')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleCustomDateChange(filters.startDate || '', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </>
          )}

          {/* Search Box */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Tenants/Rooms
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tenant name or room number..."
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Period Display */}
        {(filters.year && filters.month) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Showing data for:{' '}
                {new Date(filters.year, filters.month - 1).toLocaleString('default', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        )}
      </div>

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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Electricity Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalElectricityConsumption.toLocaleString()} kWh
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transformer Fee</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalTransformerFee)} MMK
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.grandTotal)} MMK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length} of {reportData.length} utility records
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No utility consumption data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {reportData.length === 0 ? 'No utility consumption records available for selected period.' : 'Try changing your filters or search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room No.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Electricity (kWh)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate (MMK/kWh)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transformer Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Water Charges
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Charges
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.tenantName}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.roomNumber}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.electricityConsumption.toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.electricityRate)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.transformerFee)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.waterCharges)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.totalUtilityCharges)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Summary */}
      {filteredData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Electricity</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Consumption:</span>
                  <span className="font-medium">
                    {summary.totalElectricityConsumption.toLocaleString()} kWh
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalElectricityCost)} MMK
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Transformer Fee</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Fee:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalTransformerFee)} MMK
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average per Tenant:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalTransformerFee / summary.totalTenants)} MMK
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Water</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Charges:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalWaterCharges)} MMK
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average per Tenant:</span>
                  <span className="font-medium">
                    {formatCurrency(summary.totalWaterCharges / summary.totalTenants)} MMK
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Grand Total */}
          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-red-900 text-lg">GRAND TOTAL</h4>
                <p className="text-sm text-red-700">Total utility charges for selected period</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(summary.grandTotal)} MMK
                </div>
                <div className="text-sm text-red-600">
                  {summary.totalTenants} tenants
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};