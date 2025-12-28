/** @format */

import React, { useState, useEffect, useRef } from 'react';
import { reportApi } from '../../api/reportApi';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { UtilityConsumptionReportDTO, TenantConsumptionDetail } from '../../types/utility-consumption-types';

interface UtilityConsumptionReportProps {
  onBack: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
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

export const UtilityConsumptionReport: React.FC<UtilityConsumptionReportProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<UtilityConsumptionReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // Create a ref for the header
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    year: CURRENT_YEAR,
    month: new Date().getMonth() + 1,
    buildingId: undefined as number | undefined,
    unitId: undefined as number | undefined,
  });

  // Load data when component mounts or filters change
  useEffect(() => {
    loadReportData();
  }, [filters.year, filters.month, filters.buildingId, filters.unitId]);

  // Add scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
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
      
      const data = await reportApi.getUtilityConsumptionData(filters);
      setReportData(data);
      
    } catch (err) {
      console.error('Error loading utility consumption data:', err);
      setError('Failed to load utility consumption data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    setFilters({
      year: CURRENT_YEAR,
      month: new Date().getMonth() + 1,
      buildingId: undefined,
      unitId: undefined,
    });
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(true);
      
      const blob = await reportApi.generateUtilityConsumption({
        ...filters,
        format
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const monthName = MONTHS.find(m => m.value === filters.month)?.label || `Month ${filters.month}`;
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `utility-consumption-${monthName}-${filters.year}.${extension}`;
      
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const getMonthName = (monthNumber: number) => {
    return MONTHS.find(m => m.value === monthNumber)?.label || `Month ${monthNumber}`;
  };

  if (loading && !reportData) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-stone-600">Loading utility consumption report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div 
        ref={headerRef}
        className={`bg-white p-6 rounded-lg border border-stone-200 transition-all duration-300 ${
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
                <h1 className="text-2xl font-bold text-stone-900">Utility Consumption Report</h1>
                <p className="text-stone-600 mt-1">
                  Detailed breakdown of utility usage and costs
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={exportToPDF}
              loading={exporting}
              disabled={exporting || !reportData}
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
              disabled={exporting || !reportData}
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

      {/* Add padding when header is sticky */}
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
      <div className="bg-white p-6 rounded-lg border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Report Period</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year Selector */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {YEARS.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange({ month: parseInt(e.target.value) })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Building Filter */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Building (Optional)
            </label>
            <select
              value={filters.buildingId || ''}
              onChange={(e) => handleFilterChange({ 
                buildingId: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Buildings</option>
              <option value="1">Building A</option>
              <option value="2">Building B</option>
              {/* Add more buildings dynamically */}
            </select>
          </div>

          {/* Unit Filter */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Unit (Optional)
            </label>
            <input
              type="number"
              placeholder="Unit ID"
              value={filters.unitId || ''}
              onChange={(e) => handleFilterChange({ 
                unitId: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Month Selectors */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">Quick Select:</label>
          <div className="flex flex-wrap gap-2">
            {[-1, -2, -3].map(offset => {
              const date = new Date();
              date.setMonth(date.getMonth() + offset);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const monthName = MONTHS.find(m => m.value === month)?.label || `Month ${month}`;
              
              return (
                <Button
                  key={`${year}-${month}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleFilterChange({ year, month })}
                >
                  {monthName} {year}
                </Button>
              );
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const today = new Date();
                handleFilterChange({ 
                  year: today.getFullYear(), 
                  month: today.getMonth() + 1 
                });
              }}
            >
              Current Month
            </Button>
          </div>
        </div>
      </div>

      {/* Report Period Display */}
      {reportData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-blue-900">
                {getMonthName(reportData.month)} {reportData.year} - Utility Consumption Report
              </h4>
              <p className="text-sm text-blue-700">
                Generated on {new Date(reportData.reportDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Total Tenants: {reportData.tenantDetails?.length || 0}</p>
              <p className="text-lg font-bold text-blue-900">
                Total Utility Cost: {formatCurrency(reportData.totalUtilityCost)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {reportData && (
        <div className="bg-white p-6 rounded-lg border border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Electricity Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-800">Electricity</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Consumption:</span>
                  <span className="text-sm font-medium text-blue-900">{formatNumber(reportData.totalElectricityConsumption)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Cost:</span>
                  <span className="text-sm font-medium text-blue-900">{formatCurrency(reportData.totalElectricityCost)}</span>
                </div>
              </div>
            </div>

            {/* Water Summary */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-800">Water</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Consumption:</span>
                  <span className="text-sm font-medium text-green-900">{formatNumber(reportData.totalWaterConsumption)} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Cost:</span>
                  <span className="text-sm font-medium text-green-900">{formatCurrency(reportData.totalWaterCost)}</span>
                </div>
              </div>
            </div>

            {/* Other Charges */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-purple-800">Other Charges</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Transformer Fee:</span>
                  <span className="text-sm font-medium text-purple-900">{formatCurrency(reportData.totalTransformerFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">CAM Charges:</span>
                  <span className="text-sm font-medium text-purple-900">{formatCurrency(reportData.totalCAMCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-100">Total Utility Cost for {getMonthName(reportData.month)} {reportData.year}</p>
                <p className="text-lg font-bold text-white mt-1">
                  {formatCurrency(reportData.totalUtilityCost)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">{reportData.tenantDetails?.length || 0} Tenants</p>
                <p className="text-sm text-blue-100 mt-1">
                  Average per tenant: {formatCurrency(reportData.totalUtilityCost / (reportData.tenantDetails?.length || 1))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {reportData && reportData.tenantDetails && reportData.tenantDetails.length > 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Tenant & Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider bg-blue-50">
                    Electricity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider bg-green-50">
                    Water
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider bg-purple-50">
                    Other Charges
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider bg-gray-50">
                    Total
                  </th>
                </tr>
                {/* Sub-headers */}
                <tr>
                  <th></th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 bg-blue-50">
                    <div className="grid grid-cols-3 gap-2">
                      <span>Consump (kWh)</span>
                      <span>Rate</span>
                      <span>Cost</span>
                    </div>
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 bg-green-50">
                    <div className="grid grid-cols-2 gap-2">
                      <span>Consump (m³)</span>
                      <span>Cost</span>
                    </div>
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 bg-purple-50">
                    <div className="grid grid-cols-2 gap-2">
                      <span>Transformer</span>
                      <span>CAM</span>
                    </div>
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-stone-500 bg-gray-50">
                    Total Charges
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {reportData.tenantDetails.map((tenant, index) => (
                  <tr key={index} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-stone-900">
                        {tenant.tenantName}
                      </div>
                      <div className="text-sm text-stone-500">
                        Unit: {tenant.unitNumber}
                      </div>
                    </td>
                    
                    {/* Electricity Columns */}
                    <td className="px-6 py-4 bg-blue-50">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm text-blue-900 font-medium">
                          {formatNumber(tenant.electricityConsumption)}
                        </span>
                        <span className="text-sm text-blue-700">
                          {formatCurrency(tenant.electricityRate)}
                        </span>
                        <span className="text-sm text-blue-900 font-semibold">
                          {formatCurrency(tenant.electricityCost)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Water Columns */}
                    <td className="px-6 py-4 bg-green-50">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-green-900 font-medium">
                          {formatNumber(tenant.waterConsumption)}
                        </span>
                        <span className="text-sm text-green-900 font-semibold">
                          {formatCurrency(tenant.waterCost)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Other Charges */}
                    <td className="px-6 py-4 bg-purple-50">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-purple-700">
                          {formatCurrency(tenant.transformerFee)}
                        </span>
                        <span className="text-sm text-purple-700">
                          {formatCurrency(tenant.camShare)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Total */}
                    <td className="px-6 py-4 bg-gray-50">
                      <div className="text-lg font-bold text-stone-900">
                        {formatCurrency(tenant.totalUtilityCharges)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading && reportData && (
        <div className="bg-white p-6 rounded-lg border border-stone-200 text-center">
          <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-stone-900">No utility consumption data found</h3>
          <p className="mt-1 text-sm text-stone-500">
            No tenants have utility consumption for {getMonthName(filters.month)} {filters.year}.
          </p>
        </div>
      )}

      {/* Export Information */}
      <div className="bg-white p-6 rounded-lg border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Report Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-stone-800 mb-2 flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF Export Features:
            </h4>
            <ul className="text-stone-600 space-y-2 text-sm">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Professional layout with color-coded sections
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Summary statistics and charts
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Detailed tenant breakdown
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Ready for printing and sharing
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-stone-800 mb-2 flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Excel Export Features:
            </h4>
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
                Formulas for automatic calculations
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Data ready for analysis and charts
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Multiple worksheets for detailed analysis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilityConsumptionReport;