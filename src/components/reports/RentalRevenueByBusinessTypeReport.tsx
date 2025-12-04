/** @format */

import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';

interface RentalRevenueByBusinessTypeReportProps {
  onBack: () => void;
}

interface ReportData {
  businessType: string;
  totalRentalFee: number;
  percentage: number;
}

export const RentalRevenueByBusinessTypeReport: React.FC<RentalRevenueByBusinessTypeReportProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filteredData, setFilteredData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load initial data when component mounts
    loadReportData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reportData, searchTerm]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const data = await reportApi.getRentalRevenueByBusinessType(params);
      setReportData(data);
      setFilteredData(data);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchTerm.trim()) {
      setFilteredData(reportData);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = reportData.filter(item =>
      item.businessType?.toLowerCase().includes(term)
    );
    
    setFilteredData(filtered);
  };

  const handleGenerateReport = () => {
    loadReportData();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    loadReportData();
  };

  const exportToPDF = async () => {
    try {
      setGeneratingPdf(true);
      
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const blob = await reportApi.exportRentalRevenueByBusinessTypeReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = 'rental-revenue-by-business-type';
      if (startDate) filename += `-from-${startDate}`;
      if (endDate) filename += `-to-${endDate}`;
      filename += '.pdf';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF report');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const calculateTotal = () => {
    return filteredData.reduce((total, item) => total + (item.totalRentalFee || 0), 0);
  };

  const getTopCategories = () => {
    return [...filteredData]
      .sort((a, b) => (b.totalRentalFee || 0) - (a.totalRentalFee || 0))
      .slice(0, 3);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

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
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-stone-200">
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
                <h1 className="text-2xl font-bold text-stone-900">Rental Revenue by Business Type</h1>
                <p className="text-stone-600 mt-1">
                  Income grouped by tenant business categories (Retail, Food, Services, etc.)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={clearFilters}
              disabled={loading}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={exportToPDF}
              loading={generatingPdf}
              disabled={generatingPdf || reportData.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PDF Report
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Filter Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Search Business Type
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search business types..."
              className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-stone-600">
            {startDate || endDate ? `Period: ${startDate || 'Start'} to ${endDate || 'End'}` : 'All Time Period'}
          </div>
          
          <Button
            variant="primary"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            Generate Report
          </Button>
        </div>
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

      {/* Results Summary */}
      <div className="bg-white p-4 rounded-lg border border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-stone-600">
            Showing {filteredData.length} business categories
            {searchTerm && ' (filtered)'}
          </div>
          
          {filteredData.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={exportToPDF}
              loading={generatingPdf}
              disabled={generatingPdf}
            >
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-stone-900">No revenue data found</h3>
            <p className="mt-1 text-sm text-stone-500">
              {reportData.length === 0 ? 'No rental revenue data available.' : 'Try changing your filters or search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Business Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Total Rental Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-stone-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stone-900">
                        {item.businessType || 'Uncategorized'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-stone-900">
                        {formatCurrency(item.totalRentalFee || 0)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-900">
                        {item.percentage?.toFixed(2)}%
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="w-full bg-stone-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50">
                <tr className="font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap">TOTAL</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(calculateTotal())}</td>
                  <td className="px-6 py-4 whitespace-nowrap">100%</td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Summary Stats */}
          <div className="bg-white p-6 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Summary Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-stone-600">Total Categories:</span>
                <span className="font-semibold">{filteredData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Total Revenue:</span>
                <span className="font-semibold text-green-600">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Period:</span>
                <span className="font-semibold">{startDate || 'Start'} to {endDate || 'End'}</span>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white p-6 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Top Categories</h3>
            <div className="space-y-3">
              {getTopCategories().map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-stone-600">{item.businessType || 'Uncategorized'}</span>
                  <div className="text-right">
                    <div className="font-semibold text-stone-900">{formatCurrency(item.totalRentalFee || 0)}</div>
                    <div className="text-sm text-stone-500">{item.percentage?.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className="bg-white p-6 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Revenue Distribution</h3>
            <div className="space-y-2">
              {filteredData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" 
                       style={{ backgroundColor: index === 0 ? '#dc2626' : 
                                             index === 1 ? '#ea580c' : 
                                             index === 2 ? '#ca8a04' : 
                                             index === 3 ? '#16a34a' : 
                                             '#6b7280' }}></div>
                  <div className="flex-1 text-sm text-stone-600">{item.businessType || 'Uncategorized'}</div>
                  <div className="text-sm font-semibold">{item.percentage?.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalRevenueByBusinessTypeReport;