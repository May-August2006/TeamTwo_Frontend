import React, { useState, useEffect, useRef } from 'react';
import { reportApi } from '../../api/reportApi';
import axios from 'axios';
import { Button } from '../common/ui/Button';

interface DailyCollectionReportProps {
  onBack?: () => void;
}

const DailyCollectionReport: React.FC<DailyCollectionReportProps> = ({ onBack }) => {
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  
  // Create a ref for the header
  const headerRef = useRef<HTMLDivElement>(null);

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

  const handleGenerateExcelReport = async () => {
    if (!reportDate) {
      setError('Please select a report date');
      return;
    }

    setLoadingExcel(true);
    setError('');
    setSuccess('');

    try {
      // Use the existing API with format parameter if available
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
      // Fallback to PDF if Excel export fails
      try {
        const pdfBlob = await reportApi.generateDailyCollectionReport(reportDate);
        
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-collection-report-${reportDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('PDF report generated (Excel not available)');
      } catch (fallbackErr) {
        if (axios.isAxiosError(fallbackErr)) {
          setError(fallbackErr.response?.data?.message || 'Failed to generate report');
        } else {
          setError('Unexpected error occurred while generating report');
        }
      }
    } finally {
      setLoadingExcel(false);
    }
  };

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
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to reports
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Daily Collection Report</h1>
              <p className="text-stone-600 mt-1">
                Summary of all payments collected on a specific date
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={handleGeneratePdfReport}
              loading={loadingPdf}
              disabled={loadingPdf || !reportDate}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PDF
            </Button>
            <Button
              variant="success"
              onClick={handleGenerateExcelReport}
              loading={loadingExcel}
              disabled={loadingExcel || !reportDate}
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
      {isSticky && <div className="h-24"></div>}

      {/* Report Generation Form */}
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

          {/* Quick Export Buttons - Updated Colors */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleGeneratePdfReport}
              loading={loadingPdf}
              disabled={loadingPdf || !reportDate}
              className="flex-1"
            >
              Export PDF
            </Button>
            
            <Button
              variant="success"
              onClick={handleGenerateExcelReport}
              loading={loadingExcel}
              disabled={loadingExcel || !reportDate}
              className="flex-1"
            >
              Export Excel
            </Button>
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

      {/* Report Information - Updated Colors */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">About Daily Collection Report</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium text-blue-800">PDF Report:</span>
              <ul className="text-sm text-blue-700 mt-1 ml-4 space-y-1">
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

      {/* Export Format Comparison - Updated Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-stone-900">PDF Export</h4>
          </div>
          <ul className="text-sm text-stone-600 space-y-2">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Best for printing and sharing
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Professional formatting
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Read-only format
            </li>
          </ul>
          <Button
            variant="primary"
            onClick={handleGeneratePdfReport}
            loading={loadingPdf}
            disabled={loadingPdf || !reportDate}
            className="mt-4 w-full"
          >
            {loadingPdf ? 'Generating...' : 'Download PDF'}
          </Button>
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
          <Button
            variant="success"
            onClick={handleGenerateExcelReport}
            loading={loadingExcel}
            disabled={loadingExcel || !reportDate}
            className="mt-4 w-full"
          >
            {loadingExcel ? 'Generating...' : 'Download Excel'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyCollectionReport;