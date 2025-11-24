// components/contracts/ContractDetail.tsx
import React, { useState, useEffect } from 'react';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { Contract, ContractStatus } from '../../types/contract';

interface ContractDetailProps {
  contractId: number;
  onBack?: () => void;
  onEdit?: (contract: Contract) => void;
  onRenew?: (contract: Contract) => void;
  onTerminate?: (contract: Contract) => void;
}

export const ContractDetail: React.FC<ContractDetailProps> = ({
  contractId,
  onBack,
  onEdit,
  onRenew,
  onTerminate
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'utilities' | 'timeline'>('overview');
  const [fileLoading, setFileLoading] = useState<string | null>(null);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractApi.getById(contractId);
      
      let contractData: Contract;
      if (response.data) {
        contractData = response.data;
      } else if (response.id) {
        contractData = response;
      } else {
        throw new Error('Invalid contract data structure');
      }
      
      setContract(contractData);
    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  // File download handler - FIXED: Better error handling and file naming
  const handleDownloadFile = async () => {
    if (!contract) return;
    
    try {
      setFileLoading('download');
      const response = await contractApi.downloadFile(contract.id);
      
      // Create blob URL for download
      const blob = new Blob([response.data], { 
        type: contract.mimeType || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use fileOriginalName if available, otherwise generate filename
      const filename = contract.fileOriginalName || 
        `contract-${contract.contractNumber}.${getFileExtension(contract.fileType)}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download contract file');
    } finally {
      setFileLoading(null);
    }
  };

  // File preview handler - FIXED: Better PDF handling
  const handlePreviewFile = async () => {
    if (!contract) return;
    
    try {
      setFileLoading('preview');
      const response = await contractApi.previewFile(contract.id);
      
      // Create blob URL for preview
      const blob = new Blob([response.data], { 
        type: contract.mimeType || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Check if file is PDF
      const isPDF = contract.mimeType === 'application/pdf' || 
                   contract.fileType?.toLowerCase() === 'pdf' ||
                   response.data.type === 'application/pdf';
      
      if (isPDF) {
        // Open PDF in new tab
        window.open(url, '_blank');
      } else {
        // For non-PDF files, download instead
        const link = document.createElement('a');
        link.href = url;
        const filename = contract.fileOriginalName || 
          `contract-${contract.contractNumber}-preview.${getFileExtension(contract.fileType)}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up URL after some time
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview contract file');
    } finally {
      setFileLoading(null);
    }
  };

  // Helper function to get file extension
  const getFileExtension = (fileType?: string): string => {
    if (!fileType) return 'pdf';
    
    const typeMap: { [key: string]: string } = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'xls': 'xls',
      'xlsx': 'xlsx',
      'PDF': 'pdf',
      'DOC': 'doc',
      'DOCX': 'docx',
      'XLS': 'xls',
      'XLSX': 'xlsx'
    };
    
    return typeMap[fileType] || 'pdf';
  };

  // FIXED: Correct days remaining calculation
  const getDaysRemaining = (endDate: string): number => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      
      // Set both dates to start of day for accurate calculation
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Calculate difference in days (end date is inclusive)
      const diffTime = endDateOnly.getTime() - todayOnly.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(days + 1, 0); // +1 because end date is inclusive
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  };

  // FIXED: Correct contract duration calculation
  const calculateContractDuration = () => {
    if (!contract?.startDate || !contract?.endDate) {
      return { months: 0, days: 0, totalDays: 0 };
    }

    try {
      const start = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      
      // Calculate total days (end date is inclusive)
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate years and months difference
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      let days = end.getDate() - start.getDate();
      
      // Adjust for negative days
      if (days < 0) {
        months--;
        // Get days in the previous month
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
      }
      
      // Adjust for negative months
      if (months < 0) {
        years--;
        months += 12;
      }
      
      const totalMonths = years * 12 + months;
      
      // For display, if it's approximately one year, show as 12 months
      if (totalDays >= 360 && totalDays <= 370) {
        return {
          months: 12,
          days: 0,
          totalDays: totalDays
        };
      }
      
      return {
        months: totalMonths,
        days: days,
        totalDays: totalDays
      };
    } catch (error) {
      console.error('Error calculating contract duration:', error);
      return { months: 0, days: 0, totalDays: 0 };
    }
  };

  // FIXED: Correct total contract value calculation
  const calculateTotalContractValue = (): number => {
    if (!contract?.rentalFee) return 0;
    
    const duration = calculateContractDuration();
    const monthlyRate = contract.rentalFee;
    
    // Calculate based on actual duration in months (including partial months)
    const totalMonths = duration.months + (duration.days > 0 ? duration.days / 30 : 0);
    const totalValue = monthlyRate * totalMonths;
    
    return Math.round(totalValue);
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      EXPIRING: { color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' MMK';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '-';
    }
  };

  // Format contract duration type for display
  const formatDurationType = (durationType: string | undefined): string => {
    if (!durationType) return '-';
    return durationType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // FIXED: Safe status formatter to handle null values
  const formatStatus = (status: string | undefined | null): string => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if value exists and should be displayed
  const shouldDisplay = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  };

  // Safe value getter - returns value or null
  const getSafeValue = (value: any): string | null => {
    return shouldDisplay(value) ? value.toString() : null;
  };

  // FIXED: Render field with better null handling
  const renderField = (label: string, value: any, formatter?: (val: any) => string) => {
    if (!shouldDisplay(value)) return null;

    let displayValue: string;
    try {
      displayValue = formatter ? formatter(value) : getSafeValue(value) || '-';
    } catch (error) {
      console.error(`Error formatting field "${label}":`, error);
      displayValue = '-';
    }

    if (!displayValue || displayValue === '-') return null;

    return (
      <div>
        <label className="text-sm font-medium text-gray-500">{label}</label>
        <p className="text-gray-900">{displayValue}</p>
      </div>
    );
  };

  // Format duration for display
  const formatDurationDisplay = (duration: { months: number; days: number }) => {
    if (duration.months === 12 && duration.days === 0) {
      return '12 months';
    }
    if (duration.months > 0 && duration.days > 0) {
      return `${duration.months} months ${duration.days} days`;
    }
    if (duration.months > 0) {
      return `${duration.months} months`;
    }
    return `${duration.days} days`;
  };

  // Format file size for display
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading contract details...</span>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Contract not found'}</div>
        <Button onClick={loadContract} variant="primary">
          Try Again
        </Button>
        {onBack && (
          <Button onClick={onBack} variant="secondary" className="ml-2">
            Back to List
          </Button>
        )}
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(contract.endDate);
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isOverdue = contract.contractStatus === 'ACTIVE' && daysRemaining === 0;
  const contractDuration = calculateContractDuration();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
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
                  Back
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{contract.contractNumber || 'No Contract Number'}</h1>
              {getStatusBadge(contract.contractStatus as ContractStatus)}
            </div>
            {shouldDisplay(contract.createdAt) && (
              <p className="text-gray-600">
                Created on {formatDate(contract.createdAt)}
                {contract.createdBy && ` by ${contract.createdBy.username}`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* File Actions - FIXED: Always show if file exists */}
            {(contract.fileUrl || contract.fileName || contract.fileOriginalName) && (
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handlePreviewFile}
                  loading={fileLoading === 'preview'}
                  disabled={!!fileLoading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleDownloadFile}
                  loading={fileLoading === 'download'}
                  disabled={!!fileLoading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Button>
              </div>
            )}
            
            {onEdit && contract.contractStatus !== 'TERMINATED' && contract.contractStatus !== 'EXPIRED' && (
              <Button variant="primary" onClick={() => onEdit(contract)}>
                Edit Contract
              </Button>
            )}
            
            {onRenew && 
             (contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING') && 
             daysRemaining <= 60 && (
              <Button variant="primary" onClick={() => onRenew(contract)}>
                Renew Contract
              </Button>
            )}
            
            {onTerminate && contract.contractStatus === 'ACTIVE' && (
              <Button 
                variant="danger" 
                onClick={() => onTerminate(contract)}
              >
                Terminate Contract
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {isExpiringSoon && contract.contractStatus === 'ACTIVE' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-orange-800 font-medium">
              Contract expires in {daysRemaining} days
            </span>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">
              Contract has expired today
            </span>
          </div>
        </div>
      )}

      {/* File Information Card - FIXED: Show if any file info exists */}
      {(contract.fileUrl || contract.fileName || contract.fileOriginalName) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900">
                  {contract.fileOriginalName || contract.fileName || 'Contract Document'}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-blue-700">
                  {contract.fileType && (
                    <span className="bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                      {contract.fileType.toUpperCase()}
                    </span>
                  )}
                  {contract.fileSize && (
                    <span>{formatFileSize(contract.fileSize)}</span>
                  )}
                  {contract.mimeType && (
                    <span>{contract.mimeType}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handlePreviewFile}
                loading={fileLoading === 'preview'}
                disabled={!!fileLoading}
              >
                Preview
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleDownloadFile}
                loading={fileLoading === 'download'}
                disabled={!!fileLoading}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'financial' as const, label: 'Financial Details' },
            { id: 'utilities' as const, label: 'Utilities' },
            { id: 'timeline' as const, label: 'Timeline' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tenant Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h3>
              <div className="space-y-3">
                {renderField('Tenant Name', contract.tenant?.tenantName)}
                {renderField('Contact Person', contract.tenant?.contactPerson)}
                {renderField('Email', contract.tenant?.email)}
                {renderField('Phone', contract.tenant?.phone)}
                {renderField('Address', contract.tenant?.address)}
                {renderField('NRC Number', contract.tenant?.nrc_no)}
                {renderField('Business Type', contract.tenant?.businessType)}
                {renderField('Category', contract.tenant?.tenantCategoryName)}
              </div>
            </div>

            {/* Room Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
              <div className="space-y-3">
                {renderField('Room Number', contract.room?.roomNumber)}
                {renderField('Room Type', contract.room?.roomType?.typeName)}
                {renderField('Floor/Level', contract.room?.level?.levelName)}
                {renderField('Space', contract.room?.roomSpace, (val) => `${val} sqm`)}
                {renderField('Building', contract.room?.level?.building?.buildingName)}
                {renderField('Branch', contract.room?.level?.building?.branch?.branchName)}
                {renderField('Rental Fee', contract.room?.rentalFee, formatCurrency)}
              </div>
            </div>

            {/* Contract Terms */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  {renderField('Start Date', contract.startDate, formatDate)}
                  {renderField('End Date', contract.endDate, formatDate)}
                  {renderField('Duration Type', contract.contractDurationType, formatDurationType)}
                  {renderField('Actual Duration', formatDurationDisplay(contractDuration))}
                </div>
                <div className="space-y-3">
                  {renderField('Grace Period', contract.gracePeriodDays, (val) => `${val} days`)}
                  {renderField('Notice Period', contract.noticePeriodDays, (val) => `${val} days`)}
                  {renderField('Renewal Notice', contract.renewalNoticeDays, (val) => `${val} days`)}
                </div>
                <div className="space-y-3">
                  {/* FIXED: Use safe status formatter */}
                  {renderField('Contract Status', contract.contractStatus, formatStatus)}
                  {renderField('Days Remaining', daysRemaining, (val) => `${val} days`)}
                  {/* File Information */}
                  {(contract.fileUrl || contract.fileName || contract.fileOriginalName) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract Document</label>
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={handlePreviewFile}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          disabled={!!fileLoading}
                        >
                          Preview
                        </button>
                        <button
                          onClick={handleDownloadFile}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                          disabled={!!fileLoading}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {shouldDisplay(contract.contractTerms) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Contract Terms & Conditions</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.contractTerms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Monthly Rental Fee</span>
                  <span className="text-xl font-semibold text-gray-900">
                    {formatCurrency(contract.rentalFee)}
                  </span>
                </div>
                
                {contract.securityDeposit && contract.securityDeposit > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">Security Deposit</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {formatCurrency(contract.securityDeposit)}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Refundable at contract termination
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Contract Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Summary</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">Total Contract Value</div>
                    <div className="text-lg font-semibold text-green-900">
                      {formatCurrency(calculateTotalContractValue())}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      {formatDurationDisplay(contractDuration)}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600">Duration</div>
                    <div className="text-lg font-semibold text-purple-900">
                      {contractDuration.months} Months
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      {contractDuration.totalDays} total days
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* FIXED: Use safe status formatter */}
                  {renderField('Status', contract.contractStatus, formatStatus)}
                  {renderField('Start Date', contract.startDate, formatDate)}
                  {renderField('End Date', contract.endDate, formatDate)}
                  {renderField('Days Remaining', daysRemaining, (val) => `${val} days`)}
                  
                  {/* File Actions */}
                  {(contract.fileUrl || contract.fileName || contract.fileOriginalName) && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handlePreviewFile}
                          loading={fileLoading === 'preview'}
                          disabled={!!fileLoading}
                        >
                          Preview Document
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleDownloadFile}
                          loading={fileLoading === 'download'}
                          disabled={!!fileLoading}
                        >
                          Download Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilities' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Utilities</h3>
            {contract.includedUtilities && contract.includedUtilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contract.includedUtilities.map(utility => (
                  <div key={utility.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{utility.utilityName}</h4>
                      {utility.ratePerUnit && utility.ratePerUnit > 0 && (
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(utility.ratePerUnit)}
                        </span>
                      )}
                    </div>
                    {utility.description && (
                      <p className="text-sm text-gray-600 mb-3">{utility.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        utility.calculationMethod === 'FIXED' 
                          ? 'bg-blue-100 text-blue-800'
                          : utility.calculationMethod === 'METERED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {utility.calculationMethod?.toLowerCase() || 'fixed'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {utility.ratePerUnit && utility.ratePerUnit > 0 ? 'Additional' : 'Included'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No utilities included</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This contract doesn't include any utilities.
                </p>
              </div>
            )}
            
            {/* Utility Summary */}
            {contract.includedUtilities && contract.includedUtilities.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Utility Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Total Utilities: </span>
                    <span className="font-medium">{contract.includedUtilities.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Fixed Rate: </span>
                    <span className="font-medium">
                      {contract.includedUtilities.filter(u => u.calculationMethod === 'FIXED').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Metered: </span>
                    <span className="font-medium">
                      {contract.includedUtilities.filter(u => u.calculationMethod === 'METERED').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Timeline</h3>
            <div className="space-y-4">
              {/* Contract Created */}
              <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Contract Created</span>
                    <span className="text-sm text-gray-500">{formatDate(contract.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Contract was created and initialized with status: <span className="font-medium">{formatStatus(contract.contractStatus)}</span>
                    {contract.createdBy && ` by ${contract.createdBy.username}`}
                  </p>
                </div>
              </div>
              
              {/* Contract Period */}
              <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Contract Period</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Active period for this contract ({daysRemaining} days remaining)
                  </p>
                </div>
              </div>

              {/* File Upload */}
              {(contract.fileUrl || contract.fileName || contract.fileOriginalName) && (
                <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Contract Document</span>
                      <span className="text-sm text-gray-500">Available</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Contract document uploaded: {contract.fileOriginalName || contract.fileName}
                      {contract.fileSize && ` (${formatFileSize(contract.fileSize)})`}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePreviewFile}
                        loading={fileLoading === 'preview'}
                        disabled={!!fileLoading}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownloadFile}
                        loading={fileLoading === 'download'}
                        disabled={!!fileLoading}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {contract.updatedAt && contract.updatedAt !== contract.createdAt && (
                <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Last Updated</span>
                      <span className="text-sm text-gray-500">{formatDate(contract.updatedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Contract details were last modified</p>
                  </div>
                </div>
              )}

              {/* Status Changes */}
              <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Current Status</span>
                    <span className="text-sm text-gray-500">Now</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Contract is currently <span className="font-medium">{formatStatus(contract.contractStatus)}</span>
                    {isExpiringSoon && contract.contractStatus === 'ACTIVE' && (
                      <span className="text-orange-600 font-medium"> - Expiring soon</span>
                    )}
                    {isOverdue && (
                      <span className="text-red-600 font-medium"> - Overdue</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {contract.contractStatus === 'ACTIVE' && isExpiringSoon && (
                    <li>• Consider renewing the contract before it expires</li>
                  )}
                  {isOverdue && (
                    <li>• Contract has expired - take action to renew or terminate</li>
                  )}
                  {!contract.fileUrl && !contract.fileName && !contract.fileOriginalName && (
                    <li>• Upload contract document for record keeping</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="text-sm text-gray-600">
            Contract ID: <span className="font-mono">{contract.id}</span>
            {contract.updatedAt && (
              <span className="ml-4">
                Last updated: {formatDate(contract.updatedAt)}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(contract.fileUrl || contract.fileName || contract.fileOriginalName) && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePreviewFile}
                  loading={fileLoading === 'preview'}
                  disabled={!!fileLoading}
                >
                  Preview Document
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadFile}
                  loading={fileLoading === 'download'}
                  disabled={!!fileLoading}
                >
                  Download Document
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={loadContract}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};