import React, { useState } from 'react';
import { reportApi } from '../../api/reportApi';
import axios from 'axios';

const DailyCollectionReport: React.FC = () => {
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerateReport = async () => {
    if (!reportDate) {
      setError('Please select a report date');
      return;
    }

    setLoading(true);
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
      
      setSuccess('Daily collection report generated successfully!');
    } catch (err) {
      console.error('Error generating report:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to generate report');
      } else {
        setError('Unexpected error occurred while generating report');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Daily Collection Report</h1>
      </div>

      {/* Report Generation Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Report Date *
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Select the date for which you want to generate the collection report
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={loading || !reportDate}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Daily Collection Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">About Daily Collection Report</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• Shows all payments collected on the selected date</p>
          <p>• Includes payment details: tenant, room, amount, method</p>
          <p>• Provides summary totals and payment method breakdown</p>
          <p>• Professional PDF format suitable for accounting records</p>
        </div>
      </div>
    </div>
  );
};

export default DailyCollectionReport;