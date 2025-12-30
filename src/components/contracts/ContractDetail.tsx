// components/contracts/ContractDetail.tsx - FULLY WORKING VERSION
import React, { useState, useEffect } from 'react';
import { contractApi } from '../../api/ContractAPI';
import { TerminationModal } from './TerminationModal';
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
  onTerminate,
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'utilities' | 'timeline' | 'terms'>('overview');
  const [fileLoading, setFileLoading] = useState<string | null>(null);
  const [showTerminationModal, setShowTerminationModal] = useState(false);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractApi.getById(contractId);
      console.log('Contract data:', response.data);
      setContract(response.data);
    } catch (err) {
      console.error('Error loading Lease:', err);
      setError('Failed to load  Lease details');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateContract = () => {
    setShowTerminationModal(true);
  };

  const handleTerminationSuccess = (terminatedContract: Contract) => {
    setContract(terminatedContract);
    setShowTerminationModal(false);
    
    // Reload  Lease to get latest data
    loadContract();
    
    if (onTerminate) {
      onTerminate(terminatedContract);
    }
  };

  // WORKING DOWNLOAD FUNCTION - SIMPLE AND RELIABLE
  const handleDownloadFile = async () => {
  if (!contract?.fileUrl) {
    alert('No file available for download');
    return;
  }
  
  try {
    setFileLoading('download');
    
    // Get the Cloudinary URL
    const cloudinaryUrl = contract.fileUrl;
    
    // Get the original filename
    const originalFileName = contract.fileOriginalName || contract.fileName || `contract-${contract.contractNumber}.pdf`;
    
    // EXTREMELY CLEAN filename for Cloudinary URL (only alphanumeric and underscore)
    const cleanFileName = originalFileName
      .replace(/[^a-zA-Z0-9]/g, '_')  // Replace ANY non-alphanumeric with underscore
      .replace(/_+/g, '_')            // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '');       // Remove leading/trailing underscores
    
    console.log('Original filename:', originalFileName);
    console.log('Clean filename:', cleanFileName);
    
    // Transform URL for download
    let downloadUrl = cloudinaryUrl;
    
    if (cloudinaryUrl.includes('/upload/')) {
      // Option 1: Try with EXTREMELY clean filename (no dots, no dashes)
      downloadUrl = cloudinaryUrl.replace('/upload/', `/upload/fl_attachment:${cleanFileName}/`);
      
      // Option 2: Or try without filename (just fl_attachment)
      // downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    
    console.log('Download URL:', downloadUrl);
    
    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // IMPORTANT: Set download attribute with ORIGINAL filename
    link.download = originalFileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body and trigger click
    document.body.appendChild(link);
    link.click();
    
    // If that fails after 1 second, try without filename in URL
    setTimeout(() => {
      // Check if download started (we can't detect this perfectly, so we just try fallback)
      const fallbackUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
      if (fallbackUrl !== downloadUrl) {
        console.log('Trying fallback URL:', fallbackUrl);
        window.open(fallbackUrl, '_blank');
      }
    }, 1000);
    
    // Clean up
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    
    // SIMPLE FALLBACK: Use just fl_attachment without filename
    if (contract?.fileUrl) {
      const simpleUrl = contract.fileUrl.replace('/upload/', '/upload/fl_attachment/');
      console.log('Fallback URL:', simpleUrl);
      
      const link = document.createElement('a');
      link.href = simpleUrl;
      link.download = contract.fileOriginalName || contract.fileName || `contract-${contract.contractNumber}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    }
    
  } finally {
    setFileLoading(null);
  }
};

  // WORKING PREVIEW FUNCTION
  const handlePreviewFile = async () => {
    if (!contract?.fileUrl) {
      alert('No file available for preview');
      return;
    }
    
    try {
      setFileLoading('preview');
      
      // Just open the Cloudinary URL directly in new tab
      window.open(contract.fileUrl, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview file. Please try downloading instead.');
    } finally {
      setFileLoading(null);
    }
  };

  const getDaysRemaining = (endDate: string): number => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(days, 0);
    } catch (error) {
      return 0;
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      EXPIRING: { color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US').format(amount) + ' MMK';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  // Helper function to get business type
  const getBusinessType = (contract: Contract): string => {
    return contract.tenant?.businessType || 
           contract.tenant?.tenantCategoryName || 
           contract.tenant?.tenantCategory?.categoryName || 
           '-';
  };

  // Helper function to get unit type display with specific type name
  const getUnitTypeDisplay = (contract: Contract): string => {
    if (contract.unit?.roomType?.typeName) {
      return `${contract.unit?.unitType || 'Room'} - ${contract.unit.roomType.typeName}`;
    }
    if (contract.unit?.spaceType?.name) {
      return `${contract.unit?.unitType || 'Space'} - ${contract.unit.spaceType.name}`;
    }
    if (contract.unit?.hallType?.name) {
      return `${contract.unit?.unitType || 'Hall'} - ${contract.unit.hallType.name}`;
    }
    return contract.unit?.unitType || '-';
  };

  // Helper function to get specific type details
  const getUnitTypeDetails = (contract: Contract): string => {
    if (contract.unit?.roomType?.typeName) {
      return `Room Type: ${contract.unit.roomType.typeName}`;
    }
    if (contract.unit?.spaceType?.name) {
      return `Space Type: ${contract.unit.spaceType.name}`;
    }
    if (contract.unit?.hallType?.name) {
      return `Hall Type: ${contract.unit.hallType.name}`;
    }
    return 'Type details not available';
  };

  // Helper function to safely access nested properties
  const getTerminationDate = (contract: Contract): string | undefined => {
    return contract.terminationDate || (contract as any)?.terminationDetails?.terminationDate;
  };

  const getTerminationReason = (contract: Contract): string | undefined => {
    return contract.terminationReason || (contract as any)?.terminationDetails?.terminationReason;
  };

  const getUnitStatus = (contract: Contract): string => {
    if (contract.unit?.isAvailable !== undefined) {
      return contract.unit.isAvailable ? 'Available' : 'Occupied';
    }
    return 'Unknown';
  };

  // Helper to format  Lease terms for display
  const formatContractTerms = (terms: string | undefined): string => {
    if (!terms || terms.trim() === '') {
      return 'No additional terms specified.';
    }
    return terms;
  };

  // Helper to get standard terms and conditions
  const getStandardTermsAndConditions = () => {
    return {
      basicTerms: `Contract Number: ${contract?.contractNumber || 'N/A'}
Tenant: ${contract?.tenant?.tenantName || 'N/A'}
Unit: ${contract?.unit?.unitNumber || 'N/A'}
Duration: ${contract?.contractDurationType || 'N/A'}
Start Date: ${formatDate(contract?.startDate)}
End Date: ${formatDate(contract?.endDate)}`,
      
      standardClauses: `1. PARTIES
This Lease Agreement is made between the Landlord and the Tenant as specified in this Lease.

2. PREMISES
The Landlord leases to the Tenant the premises described in this  Lease for commercial purposes only.

3. TERM
The lease term shall commence on the Start Date and continue until the End Date specified in this Lease.

4. RENT
Tenant shall pay the monthly rental fee of ${formatCurrency(contract?.rentalFee)}, due on the first day of each month.
Grace period: ${contract?.gracePeriodDays || 0} days.

5. SECURITY DEPOSIT
The security deposit of ${formatCurrency(contract?.securityDeposit)} shall be held by Landlord as security for the performance of Tenant's obligations.

6. UTILITIES
Utilities included in this  Lease are as specified. Additional utilities may be charged separately.

7. USE OF PREMISES
The premises shall be used only for the purpose specified in the tenant's business registration.

8. MAINTENANCE
Tenant shall maintain the premises in good condition and promptly report any necessary repairs.

9. DEFAULT
If Tenant fails to pay rent or breaches any terms, Landlord may terminate this agreement with ${contract?.noticePeriodDays || 0} days notice.

10. RENEWAL
Renewal notice must be given at least ${contract?.renewalNoticeDays || 0} days before  Lease expiration.

11. TERMINATION
Either party may terminate this agreement with proper notice as specified in the  Lease terms.

12. GOVERNING LAW
This agreement shall be governed by the laws of the Republic of the Union of Myanmar.`,
      
      additionalTerms: contract?.contractTerms || 'No additional terms specified.'
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading  Lease details...</span>
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
  const canTerminate = contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING';

  // Get termination data safely
  const terminationDate = getTerminationDate(contract);
  const terminationReason = getTerminationReason(contract);
  const unitStatus = getUnitStatus(contract);
  const unitTypeDisplay = getUnitTypeDisplay(contract);
  const unitTypeDetails = getUnitTypeDetails(contract);
  const businessType = getBusinessType(contract);
  
  const termsAndConditions = getStandardTermsAndConditions();

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
                  ← Back
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{contract.contractNumber}</h1>
              {getStatusBadge(contract.contractStatus as ContractStatus)}
            </div>
            {contract.createdAt && (
              <p className="text-gray-600">
                Created on {formatDate(contract.createdAt)}
                {contract.createdBy?.username && ` by ${contract.createdBy.username}`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* File Actions */}
            {(contract.fileUrl || contract.fileName) && (
              <div className="flex gap-2">
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
                  variant="primary-blue" 
                  size="sm"
                  onClick={handleDownloadFile}
                  loading={fileLoading === 'download'}
                  disabled={!!fileLoading}
                >
                  Download
                </Button>
              </div>
            )}
            
            {onEdit && contract.contractStatus !== 'TERMINATED' && contract.contractStatus !== 'EXPIRED' && (
              <Button variant="primary-blue" onClick={() => onEdit(contract)}>
                Edit Lease
              </Button>
            )}
            
            {onRenew && canTerminate && daysRemaining <= 60 && (
              <Button variant="primary-blue" onClick={() => onRenew(contract)}>
                Renew Lease
              </Button>
            )}
            
            {canTerminate && (
              <Button 
                variant="danger" 
                onClick={handleTerminateContract}
              >
                Terminate Lease
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {isExpiringSoon && contract.contractStatus === 'ACTIVE' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-orange-800 font-medium">
               Lease expires in {daysRemaining} days
            </span>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-800 font-medium">
               Lease has expired today
            </span>
          </div>
        </div>
      )}

      {/* Termination Details - Only show for terminated contracts */}
      {contract.contractStatus === 'TERMINATED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">Contract Terminated</h3>
          <div className="text-sm text-red-700 space-y-1">
            <p><strong>Termination Date:</strong> {formatDate(terminationDate)}</p>
            <p><strong>Reason:</strong> {terminationReason || 'Not specified'}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'financial' as const, label: 'Financial' },
            { id: 'utilities' as const, label: 'Utilities' },
            { id: 'timeline' as const, label: 'Timeline' },
            { id: 'terms' as const, label: 'Terms & Conditions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                <div>
                  <label className="text-sm font-medium text-gray-500">Tenant Name</label>
                  <p className="text-gray-900">{contract.tenant?.tenantName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{contract.tenant?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{contract.tenant?.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Type</label>
                  <p className="text-gray-900">{businessType}</p>
                </div>
                {contract.tenant?.contactPerson && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Person</label>
                    <p className="text-gray-900">{contract.tenant.contactPerson}</p>
                  </div>
                )}
                {contract.tenant?.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{contract.tenant.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Unit Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit Number</label>
                  <p className="text-gray-900">{contract.unit?.unitNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit Type</label>
                  <p className="text-gray-900">{unitTypeDisplay}</p>
                  <p className="text-sm text-gray-500 mt-1">{unitTypeDetails}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Space</label>
                  <p className="text-gray-900">
                    {contract.unit?.unitSpace ? `${contract.unit.unitSpace} sq.ft` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">
                    {contract.unit?.level?.levelName || '-'}, 
                    {contract.unit?.level?.building?.buildingName || '-'}
                    {contract.unit?.level?.building?.branch?.branchName && 
                      `, ${contract.unit.level.building.branch.branchName}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{unitStatus}</p>
                </div>
                {contract.unit?.hasMeter && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Meter</label>
                    <p className="text-gray-900">Has meter installed</p>
                  </div>
                )}
              </div>
            </div>

            {/*  Lease Terms */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">{formatDate(contract.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900">{formatDate(contract.endDate)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rental Fee</label>
                    <p className="text-gray-900">{formatCurrency(contract.rentalFee)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Security Deposit</label>
                    <p className="text-gray-900">{formatCurrency(contract.securityDeposit)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration Type</label>
                    <p className="text-gray-900">{contract.contractDurationType || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Grace Period</label>
                    <p className="text-gray-900">{contract.gracePeriodDays || 0} days</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notice Period</label>
                    <p className="text-gray-900">{contract.noticePeriodDays || 0} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Renewal Notice</label>
                    <p className="text-gray-900">{contract.renewalNoticeDays || 0} days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Rent:</span>
                    <span className="font-semibold">{formatCurrency(contract.rentalFee)}</span>
                  </div>
                  {contract.securityDeposit && contract.securityDeposit > 0 && (
                    <div className="flex justify-between">
                      <span>Security Deposit:</span>
                      <span className="font-semibold">{formatCurrency(contract.securityDeposit)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Contract Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span>{contract.contractStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Remaining:</span>
                    <span>{daysRemaining} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract Number:</span>
                    <span className="font-mono">{contract.contractNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Termination Details */}
            {contract.contractStatus === 'TERMINATED' && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">Termination Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Termination Date:</span>
                    <span>{formatDate(terminationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reason:</span>
                    <span>{terminationReason || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit Released:</span>
                    <span>{unitStatus === 'Available' ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'utilities' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Utilities</h3>
            {contract.includedUtilities && contract.includedUtilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contract.includedUtilities.map(utility => (
                  <div key={utility.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{utility.utilityName}</h4>
                    {utility.description && (
                      <p className="text-sm text-gray-600 mt-1">{utility.description}</p>
                    )}
                    {utility.ratePerUnit && (
                      <p className="text-sm text-green-600 mt-1">
                        Rate: {formatCurrency(utility.ratePerUnit)}
                      </p>
                    )}
                    {utility.calculationMethod && (
                      <p className="text-xs text-blue-600 mt-1">
                        {utility.calculationMethod.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No utilities included in this Lease.</p>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Contract Created</span>
                  <span className="text-sm text-gray-500">{formatDateTime(contract.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                   Lease was created with status: {contract.contractStatus}
                </p>
                {contract.createdBy?.username && (
                  <p className="text-xs text-gray-500 mt-1">
                    Created by: {contract.createdBy.username}
                  </p>
                )}
              </div>
            </div>

            {contract.updatedAt && contract.updatedAt !== contract.createdAt && (
              <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Contract Updated</span>
                    <span className="text-sm text-gray-500">{formatDateTime(contract.updatedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Last modification to the Lease
                  </p>
                  {contract.updatedBy?.username && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated by: {contract.updatedBy.username}
                    </p>
                  )}
                </div>
              </div>
            )}


            {contract.contractStatus === 'TERMINATED' && terminationDate && (
              <div className="flex items-start space-x-4 p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-900">Contract Terminated</span>
                    <span className="text-sm text-red-500">{formatDateTime(terminationDate)}</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {terminationReason || 'Not specified'}
                  </p>
                  {(contract as any)?.terminatedBy?.username && (
                    <p className="text-xs text-red-600 mt-1">
                      Terminated by: {(contract as any).terminatedBy.username}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            {/* Basic  Lease Information */}
            {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Basic  Lease Information</h3>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono">
                {termsAndConditions.basicTerms}
              </pre>
            </div> */}

            {/* Standard Terms and Conditions */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Standard Terms and Conditions</h3>
                <p className="text-sm text-gray-600 mt-1">
                  These are the standard terms that apply to all Leases. 
                  {contract.termsAgreementVersion && ` Version: ${contract.termsAgreementVersion}`}
                </p>
              </div>
              <div className="p-6 bg-white">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {termsAndConditions.standardClauses}
                </pre>
              </div>
            </div>

            {/* Additional  Lease Terms */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Additional  Lease Terms</h3>
                <p className="text-sm text-gray-600 mt-1">
                  These are additional terms specific to this Lease
                </p>
              </div>
              <div className="p-6 bg-white">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {formatContractTerms(termsAndConditions.additionalTerms)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Termination Modal */}
      {showTerminationModal &&  Lease && (
        <TerminationModal
          isOpen={showTerminationModal}
          onClose={() => setShowTerminationModal(false)}
          onSuccess={handleTerminationSuccess}
          contract={contract}
        />
      )}
    </div>
  );
};