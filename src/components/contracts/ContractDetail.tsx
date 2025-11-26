// components/contracts/ContractDetail.tsx
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
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'utilities' | 'timeline'>('overview');
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
      console.error('Error loading contract:', err);
      setError('Failed to load contract details');
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
    
    // Reload contract to get latest data
    loadContract();
    
    if (onTerminate) {
      onTerminate(terminatedContract);
    }
  };

  const handleDownloadFile = async () => {
    if (!contract) return;
    
    try {
      setFileLoading('download');
      const response = await contractApi.downloadFile(contract.id);
      
      if (response.data?.fileUrl) {
        window.open(response.data.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download contract file');
    } finally {
      setFileLoading(null);
    }
  };

  const handlePreviewFile = async () => {
    if (!contract) return;
    
    try {
      setFileLoading('preview');
      const response = await contractApi.previewFile(contract.id);
      
      if (response.data?.fileUrl) {
        window.open(response.data.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview contract file');
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

  // Helper function to safely access nested properties
  const getTerminationDate = (contract: Contract): string | undefined => {
    return contract.terminationDate || (contract as any)?.terminationDetails?.terminationDate;
  };

  const getTerminationReason = (contract: Contract): string | undefined => {
    return contract.terminationReason || (contract as any)?.terminationDetails?.terminationReason;
  };

  const getRoomStatus = (contract: Contract): string => {
    if (contract.room?.isAvailable !== undefined) {
      return contract.room.isAvailable ? 'Available' : 'Occupied';
    }
    return 'Unknown';
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
  const canTerminate = contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING';

  // Get termination data safely
  const terminationDate = getTerminationDate(contract);
  const terminationReason = getTerminationReason(contract);
  const roomStatus = getRoomStatus(contract);

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
                  variant="primary" 
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
              <Button variant="primary" onClick={() => onEdit(contract)}>
                Edit Contract
              </Button>
            )}
            
            {onRenew && canTerminate && daysRemaining <= 60 && (
              <Button variant="primary" onClick={() => onRenew(contract)}>
                Renew Contract
              </Button>
            )}
            
            {canTerminate && (
              <Button 
                variant="danger" 
                onClick={handleTerminateContract}
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
            <span className="text-orange-800 font-medium">
              Contract expires in {daysRemaining} days
            </span>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-800 font-medium">
              Contract has expired today
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
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'financial' as const, label: 'Financial' },
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
                {contract.tenant?.businessType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Type</label>
                    <p className="text-gray-900">{contract.tenant.businessType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Room Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Number</label>
                  <p className="text-gray-900">{contract.room?.roomNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Type</label>
                  <p className="text-gray-900">{contract.room?.roomType?.typeName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Space</label>
                  <p className="text-gray-900">
                    {contract.room?.roomSpace ? `${contract.room.roomSpace} sq.ft` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{roomStatus}</p>
                </div>
              </div>
            </div>

            {/* Contract Terms */}
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
                    <span>Room Released:</span>
                    <span>{roomStatus === 'Available' ? 'Yes' : 'No'}</span>
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No utilities included in this contract.</p>
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
                  <span className="text-sm text-gray-500">{formatDate(contract.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Contract was created with status: {contract.contractStatus}
                </p>
              </div>
            </div>

            {contract.contractStatus === 'TERMINATED' && terminationDate && (
              <div className="flex items-start space-x-4 p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-900">Contract Terminated</span>
                    <span className="text-sm text-red-500">{formatDate(terminationDate)}</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {terminationReason || 'Not specified'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Termination Modal */}
      {showTerminationModal && contract && (
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