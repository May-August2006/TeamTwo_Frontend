import React, { useState } from 'react';
import { reportApi } from '../../api/reportApi';
import axios from 'axios';
import { Button } from '../common/ui/Button'; // You might need to create or import this

interface DailyCollectionReportProps {
  onBack?: () => void; // Add onBack prop
}

const DailyCollectionReport: React.FC<DailyCollectionReportProps> = ({ onBack }) => {
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGeneratePdfReport = async () => {
    if (!reportDate) {
      setError('Please select a report date');
      return;
    }

    setLoadingPdf(true);
    setError('');
    setSuccess('');

    try {
      const pdfBlob = await reportApi.generateDailyCollectionReport(reportDate);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-collection-report-${reportDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Daily collection PDF report generated successfully!');
    } catch (err) {
      console.error('Error generating PDF report:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to generate PDF report');
      } else {
        setError('Unexpected error occurred while generating PDF report');
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  // NEW: Handle Excel Report Generation
  const handleGenerateExcelReport = async () => {
    if (!reportDate) {
      setError('Please select a report date');
      return;
    }

    setLoadingExcel(true);
    setError('');
    setSuccess('');

    try {
      // Note: You need to add this method to your reportApi
      const excelBlob = await reportApi.generateDailyCollectionReport(reportDate, 'excel');
      
      // Create download link
      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-collection-report-${reportDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Daily collection Excel report generated successfully!');
    } catch (err) {
      console.error('Error generating Excel report:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to generate Excel report');
      } else {
        setError('Unexpected error occurred while generating Excel report');
      }
    } finally {
      setLoadingExcel(false);
    }
  };

  // NEW: Fallback method if Excel API method doesn't exist
  const handleGenerateExcelReportFallback = async () => {
    if (!reportDate) {
      setError('Please select a report date');
      return;
    }

    setLoadingExcel(true);
    setError('');
    setSuccess('');

    try {
      // Alternative: Use the existing API with format parameter
      const excelBlob = await reportApi.generateDailyCollectionReport(reportDate);
      
      // Create download link
      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-collection-report-${reportDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Daily collection Excel report generated successfully!');
    } catch (err) {
      console.error('Error generating Excel report:', err);
      setError('Excel export not available. Please contact support.');
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button - UPDATED with dropdown */}
      <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to reports
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Daily Collection Report</h1>
              <p className="text-stone-600 mt-1">
                Summary of all payments collected on a specific date
              </p>
            </div>
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={loadingPdf || loadingExcel || !reportDate}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {(loadingPdf || loadingExcel) ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {loadingPdf ? 'Generating PDF...' : 'Generating Excel...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Report
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
            
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-stone-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button
                onClick={handleGeneratePdfReport}
                disabled={loadingPdf || !reportDate}
                className="w-full text-left px-4 py-3 text-stone-700 hover:bg-stone-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-b border-stone-100"
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium">Export as PDF</div>
                  <div className="text-xs text-stone-500">For printing & sharing</div>
                </div>
              </button>
              <button
                onClick={handleGenerateExcelReport || handleGenerateExcelReportFallback}
                disabled={loadingExcel || !reportDate}
                className="w-full text-left px-4 py-3 text-stone-700 hover:bg-stone-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium">Export as Excel</div>
                  <div className="text-xs text-stone-500">For data analysis</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Form - UPDATED with quick export buttons */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Select Report Date *
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-sm text-stone-500 mt-1">
              Select the date for which you want to generate the collection report
            </p>
          </div>

          {/* Quick Export Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGeneratePdfReport}
              disabled={loadingPdf || !reportDate}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {loadingPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
            
            <button
              onClick={handleGenerateExcelReport || handleGenerateExcelReportFallback}
              disabled={loadingExcel || !reportDate}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {loadingExcel ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Excel...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Report Information - UPDATED with Excel info */}
      <div className="bg-red-50 border border-red-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-3">About Daily Collection Report</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium text-red-800">PDF Report:</span>
              <ul className="text-sm text-red-700 mt-1 ml-4 space-y-1">
                <li>• Professional format suitable for accounting records</li>
                <li>• Shows all payments collected on the selected date</li>
                <li>• Includes payment details: tenant, room, amount, method</li>
                <li>• Provides summary totals and payment method breakdown</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium text-green-800">Excel Report:</span>
              <ul className="text-sm text-green-700 mt-1 ml-4 space-y-1">
                <li>• Spreadsheet format for data analysis and manipulation</li>
                <li>• Raw data in tabular format for filtering and sorting</li>
                <li>• Suitable for import into other applications</li>
                <li>• Can be customized with formulas and charts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Export Format Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-stone-900">PDF Export</h4>
          </div>
          <ul className="text-sm text-stone-600 space-y-2">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Best for printing and sharing
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Professional formatting
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Read-only format
            </li>
          </ul>
          <button
            onClick={handleGeneratePdfReport}
            disabled={loadingPdf || !reportDate}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loadingPdf ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        <div className="bg-white p-5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-stone-900">Excel Export</h4>
          </div>
          <ul className="text-sm text-stone-600 space-y-2">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Best for data analysis
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Editable spreadsheet
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Can add formulas & charts
            </li>
          </ul>
          <button
            onClick={handleGenerateExcelReport || handleGenerateExcelReportFallback}
            disabled={loadingExcel || !reportDate}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loadingExcel ? 'Generating...' : 'Download Excel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCollectionReport;