// components/reports/ContractHistoryReport.tsx - UPDATED WITH EXCEL SUPPORT
import React, { useState, useEffect } from 'react';
import { contractHistoryApi } from '../../api/ContractHistoryAPI';
import { tenantApi } from '../../api/TenantAPI';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { ContractHistoryDTO, ContractHistoryFilters } from '../../types/contractHistory';
import type { Tenant } from '../../types/tenant';
import type { Contract } from '../../types/contract';

interface ContractHistoryReportProps {
  onBack: () => void;
}

// Action types for filtering
const ACTION_TYPES = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'CREATED', label: 'Created' },
  { value: 'RENEWED', label: 'Renewed' },
  { value: 'AMENDED', label: 'Amended' },
  { value: 'TERMINATED', label: 'Terminated' }
];

export const ContractHistoryReport: React.FC<ContractHistoryReportProps> = ({ onBack }) => {
  const [history, setHistory] = useState<ContractHistoryDTO[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ContractHistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false); // NEW: Excel loading state
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<ContractHistoryFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');

  // Dropdown data
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [history, filters, searchTerm, selectedActionType]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load tenants and contracts for dropdowns
      const [tenantsResponse, contractsResponse] = await Promise.all([
        tenantApi.getAll(),
        contractApi.getAll()
      ]);

      const tenantsData = Array.isArray(tenantsResponse) ? tenantsResponse : tenantsResponse.data;
      const contractsData = Array.isArray(contractsResponse) ? contractsResponse : contractsResponse.data;

      setTenants(tenantsData || []);
      setContracts(contractsData || []);

      // Load all contract history
      await loadContractHistory();
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadContractHistory = async (filterParams?: ContractHistoryFilters) => {
    try {
      setError(null);
      let historyData: ContractHistoryDTO[];

      if (filterParams?.tenantId) {
        historyData = await contractHistoryApi.getByTenant(filterParams.tenantId);
      } else if (filterParams?.contractId) {
        historyData = await contractHistoryApi.getByContract(filterParams.contractId);
      } else if (filterParams?.actionType && filterParams.actionType !== 'ALL') {
        historyData = await contractHistoryApi.getByActionType(filterParams.actionType);
      } else {
        historyData = await contractHistoryApi.getAll();
      }

      setHistory(historyData);
    } catch (err) {
      console.error('Error loading contract history:', err);
      setError('Failed to load contract history');
      setHistory([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Apply action type filter
    if (selectedActionType !== 'ALL') {
      filtered = filtered.filter(item => item.actionType === selectedActionType);
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.contractNumber?.toLowerCase().includes(term) ||
        item.tenantName?.toLowerCase().includes(term) ||
        item.roomNumber?.toLowerCase().includes(term) ||
        item.actionType?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.changedByUsername?.toLowerCase().includes(term)
      );
    }

    setFilteredHistory(filtered);
  };

  const handleFilterChange = (newFilters: ContractHistoryFilters) => {
    setFilters(newFilters);
    loadContractHistory(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedActionType('ALL');
    loadContractHistory();
  };

  // Generate PDF Report
  const generatePdfReport = async () => {
    try {
      setGeneratingPdf(true);

      // Check if we have filtered data
      if (filteredHistory.length === 0) {
        setError('No data to export');
        return;
      }
      
      // Prepare parameters for PDF generation
      const pdfParams: any = { ...filters };
      
      // Add action type to PDF parameters if not "ALL"
      if (selectedActionType !== 'ALL') {
        pdfParams.actionType = selectedActionType;
      }

      // Generate PDF with current filters
      const blob = await contractHistoryApi.generateReport(pdfParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on filters
      let filename = 'contract-history-report';
      if (filters.tenantId) {
        const tenant = tenants.find(t => t.id === filters.tenantId);
        filename += `-tenant-${tenant?.tenantName || filters.tenantId}`;
      } else if (filters.contractId) {
        const contract = contracts.find(c => c.id === filters.contractId);
        filename += `-contract-${contract?.contractNumber || filters.contractId}`;
      }
      
      if (selectedActionType !== 'ALL') {
        filename += `-${selectedActionType.toLowerCase()}`;
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

  // NEW: Generate Excel Report
  const generateExcelReport = async () => {
    try {
      setGeneratingExcel(true);

      // Check if we have filtered data
      if (filteredHistory.length === 0) {
        setError('No data to export');
        return;
      }
      
      // Prepare parameters for Excel generation
      const excelParams: any = { 
        ...filters,
        format: 'excel' // Add format parameter
      };
      
      // Add action type to Excel parameters if not "ALL"
      if (selectedActionType !== 'ALL') {
        excelParams.actionType = selectedActionType;
      }

      // Generate Excel with current filters
      const blob = await contractHistoryApi.generateReport(excelParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on filters
      let filename = 'contract-history-report';
      if (filters.tenantId) {
        const tenant = tenants.find(t => t.id === filters.tenantId);
        filename += `-tenant-${tenant?.tenantName || filters.tenantId}`;
      } else if (filters.contractId) {
        const contract = contracts.find(c => c.id === filters.contractId);
        filename += `-contract-${contract?.contractNumber || filters.contractId}`;
      }
      
      if (selectedActionType !== 'ALL') {
        filename += `-${selectedActionType.toLowerCase()}`;
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

  // NEW: Combined export function that shows options
  const handleExportReport = () => {
    if (filteredHistory.length === 0) {
      setError('No data to export');
      return;
    }

    // Show export options modal or implement a dropdown
    // For simplicity, we'll create a simple dropdown UI
    return (
      <div className="relative">
        <Button
          variant="primary"
          onClick={generatePdfReport}
          disabled={generatingPdf || generatingExcel || filteredHistory.length === 0}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Report
        </Button>
        <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 hidden hover:block group-hover:block">
          <button
            onClick={generatePdfReport}
            disabled={generatingPdf}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
          <button
            onClick={generateExcelReport}
            disabled={generatingExcel}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
        </div>
      </div>
    );
  };

  const getActionTypeBadge = (actionType: string) => {
    const config = {
      CREATED: { color: 'bg-blue-100 text-blue-800', label: 'Created' },
      RENEWED: { color: 'bg-green-100 text-green-800', label: 'Renewed' },
      AMENDED: { color: 'bg-yellow-100 text-yellow-800', label: 'Amended' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' }
    };

    const actionConfig = config[actionType as keyof typeof config] || 
                        { color: 'bg-gray-100 text-gray-800', label: actionType };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionConfig.color}`}>
        {actionConfig.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Check if we have active filters for PDF generation
  const hasActiveFilters = filters.tenantId || filters.contractId || selectedActionType !== 'ALL';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading contract history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - UPDATED with Excel button */}
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
                <h1 className="text-2xl font-bold text-gray-900">Contract History Report</h1>
                <p className="text-gray-600 mt-1">
                  Track all contract changes, renewals, amendments, and terminations
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
            
            {/* Export Dropdown */}
            <div className="relative group">
              <Button
                variant="primary"
                disabled={generatingPdf || generatingExcel || history.length === 0}
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

      {/* Filters - REMOVED DATE RANGE, KEPT ACTION TYPE */}
      {/* ... (filters section remains exactly the same) */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter History</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tenant Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Tenant
            </label>
            <select
              value={filters.tenantId || ''}
              onChange={(e) => {
                const tenantId = e.target.value ? parseInt(e.target.value) : undefined;
                handleFilterChange({ ...filters, tenantId, contractId: undefined });
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tenants</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.tenantName}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Contract
            </label>
            <select
              value={filters.contractId || ''}
              onChange={(e) => {
                const contractId = e.target.value ? parseInt(e.target.value) : undefined;
                handleFilterChange({ ...filters, contractId, tenantId: undefined });
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Contracts</option>
              {contracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNumber} - {contract.tenant?.tenantName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Action Type
            </label>
            <select
              value={selectedActionType}
              onChange={(e) => {
                const actionType = e.target.value;
                setSelectedActionType(actionType);
                if (actionType !== 'ALL') {
                  handleFilterChange({ ...filters, actionType });
                } else {
                  handleFilterChange({ ...filters, actionType: undefined });
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTION_TYPES.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search History
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contract, tenant, room, action, or description..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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
              {filters.tenantId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tenant: {tenants.find(t => t.id === filters.tenantId)?.tenantName}
                </span>
              )}
              {filters.contractId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Contract: {contracts.find(c => c.id === filters.contractId)?.contractNumber}
                </span>
              )}
              {selectedActionType !== 'ALL' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Action: {selectedActionType}
                </span>
              )}
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

      {/* Results Summary - UPDATED with Excel button */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {filteredHistory.length} of {history.length} history records
            {hasActiveFilters && ' (filtered)'}
          </div>
          
          {filteredHistory.length > 0 && (
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

      {/* History Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contract history found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {history.length === 0 ? 'No contract history records available.' : 'Try changing your filters or search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract & Tenant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changed By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.createdAt)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.contractNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.tenantName}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.roomNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.buildingName}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionTypeBadge(record.actionType)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {record.changedByUsername}
                      </div>
                      {record.changedByFullName && (
                        <div className="text-sm text-gray-500">
                          {record.changedByFullName}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {record.description}
                      </div>
                      {(record.oldValues || record.newValues) && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            View Changes
                          </summary>
                          <div className="mt-2 space-y-2">
                            {record.oldValues && (
                              <div>
                                <span className="font-medium text-red-600">Old:</span>
                                <pre className="text-xs mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(JSON.parse(record.oldValues), null, 2)}
                                </pre>
                              </div>
                            )}
                            {record.newValues && (
                              <div>
                                <span className="font-medium text-green-600">New:</span>
                                <pre className="text-xs mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(JSON.parse(record.newValues), null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {filteredHistory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredHistory.length}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredHistory.filter(r => r.actionType === 'CREATED').length}
            </div>
            <div className="text-sm text-gray-600">Contracts Created</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredHistory.filter(r => r.actionType === 'RENEWED').length}
            </div>
            <div className="text-sm text-gray-600">Contracts Renewed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredHistory.filter(r => r.actionType === 'TERMINATED').length}
            </div>
            <div className="text-sm text-gray-600">Contracts Terminated</div>
          </div>
        </div>
      )}
    </div>
  );
};