// components/reports/MonthlyCollectionReport.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { monthlyCollectionApi } from '../../api/MonthlyCollectionAPI';
import type { MonthlyCollectionSummaryDTO } from '../../types/reports';

//npm install recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface MonthlyCollectionReportProps {
  onBack: () => void;
}

const MONTH_OPTIONS = [
  { value: '2025-01', label: 'January 2025' },
  { value: '2025-02', label: 'February 2025' },
  { value: '2025-03', label: 'March 2025' },
  { value: '2025-04', label: 'April 2025' },
  { value: '2025-05', label: 'May 2025' },
  { value: '2025-06', label: 'June 2025' },
  { value: '2025-07', label: 'July 2025' },
  { value: '2025-08', label: 'August 2025' },
  { value: '2025-09', label: 'September 2025' },
  { value: '2025-10', label: 'October 2025' },
  { value: '2025-11', label: 'November 2025' },
  { value: '2025-12', label: 'December 2025' },
];

const CHARGE_TYPE_COLORS = {
  'RENT': '#3B82F6',
  'ELECTRICITY': '#10B981',
  'WATER': '#8B5CF6',
  'CAM': '#F59E0B',
  'TRANSFORMER': '#EF4444',
  'OTHER': '#6B7280'
};

// Helper function to calculate collection rate
const calculateCollectionRate = (billed: number, collected: number): number => {
  if (!billed || billed === 0) return 0;
  return (collected / billed) * 100;
};

// Helper function to convert any value to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const MonthlyCollectionReport: React.FC<MonthlyCollectionReportProps> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-01');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [generatingExcel, setGeneratingExcel] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMonthlyData(selectedMonth);
  }, []);

  const loadMonthlyData = async (month: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await monthlyCollectionApi.getMonthlySummary(month);
      setSummaryData(data);
    } catch (err) {
      console.error('Error loading monthly data:', err);
      setError('Failed to load monthly collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    loadMonthlyData(month);
  };

  const generatePdfReport = async () => {
    try {
      setGeneratingPdf(true);
      const blob = await monthlyCollectionApi.generatePdfReport(selectedMonth);
      downloadFile(blob, `monthly-collection-summary-${selectedMonth}.pdf`);
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
      const blob = await monthlyCollectionApi.generateExcelReport(selectedMonth);
      downloadFile(blob, `monthly-collection-summary-${selectedMonth}.xlsx`);
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getChartData = () => {
    if (!summaryData || !summaryData.billedByType) return [];
    return Object.entries(summaryData.billedByType).map(([type, amount]) => ({
      name: type,
      value: toNumber(amount),
      color: CHARGE_TYPE_COLORS[type as keyof typeof CHARGE_TYPE_COLORS] || CHARGE_TYPE_COLORS.OTHER
    }));
  };

  const getBreakdownData = () => {
    if (!summaryData) return [];
    
    const billedByType = summaryData.billedByType || {};
    const collectedByType = summaryData.collectedByType || {};
    
    const types = new Set([
      ...Object.keys(billedByType),
      ...Object.keys(collectedByType)
    ]);
    
    return Array.from(types).map(type => {
      const billed = toNumber(billedByType[type]);
      const collected = toNumber(collectedByType[type]);
      const percentage = calculateCollectionRate(billed, collected);
      
      return {
        type,
        billed,
        collected,
        percentage
      };
    });
  };

  // Calculate totals
  const totalBilled = summaryData ? toNumber(summaryData.totalBilledAmount) : 0;
  const totalCollected = summaryData ? toNumber(summaryData.totalCollectedAmount) : 0;
  const difference = summaryData ? toNumber(summaryData.difference) : 0;
  const collectionRate = calculateCollectionRate(totalBilled, totalCollected);

  if (loading && !summaryData) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading monthly collection data...</span>
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
                <h1 className="text-2xl font-bold text-gray-900">Monthly Collection Summary Report</h1>
                <p className="text-gray-600 mt-1">
                  Compare total amount billed against total amount collected in a month
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

      {/* Month Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Month</h3>
            <p className="text-gray-600 text-sm">Choose a month to view collection summary</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {MONTH_OPTIONS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            
            <Button
              variant="secondary"
              onClick={() => loadMonthlyData(selectedMonth)}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
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

      {/* Summary Cards */}
      {summaryData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Billed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(totalBilled)} MMK
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Collected</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {formatCurrency(totalCollected)} MMK
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Balance (Difference)</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    difference > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(difference)} MMK
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  difference > 0 ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    difference > 0 ? 'text-red-600' : 'text-green-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {collectionRate.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${formatCurrency(Number(value))} MMK`, 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billed vs Collected</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBreakdownData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      label={{ value: 'Amount (MMK)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(Number(value))} MMK`, 'Amount']}
                      labelFormatter={(label) => `Type: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="billed" name="Billed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Breakdown by Charge Type</h3>
              <p className="text-sm text-gray-600 mt-1">Detailed comparison of billed vs collected amounts</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Charge Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billed Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collected Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collection %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getBreakdownData().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: CHARGE_TYPE_COLORS[item.type as keyof typeof CHARGE_TYPE_COLORS] || CHARGE_TYPE_COLORS.OTHER }}
                          />
                          <span className="font-medium text-gray-900">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(item.billed)} MMK
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-green-600">
                          {formatCurrency(item.collected)} MMK
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.percentage >= 90 ? 'bg-green-100 text-green-800' :
                          item.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.percentage >= 90 ? 'Excellent' :
                           item.percentage >= 70 ? 'Good' :
                           'Needs Attention'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatCurrency(totalBilled)} MMK
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      {formatCurrency(totalCollected)} MMK
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {collectionRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        collectionRate >= 90 ? 'bg-green-100 text-green-800' :
                        collectionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {collectionRate >= 90 ? 'Excellent Collection' :
                         collectionRate >= 70 ? 'Good Collection' :
                         'Poor Collection'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
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
          <p className="mt-1 text-sm text-gray-500">Select a month to view collection summary</p>
        </div>
      )}
    </div>
  );
};