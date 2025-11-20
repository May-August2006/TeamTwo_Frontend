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

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractApi.getById(contractId);
      console.log('Contract detail response:', response);
      
      let contractData: Contract;
      if (response.data) {
        contractData = response.data;
      } else if (response.id) {
        contractData = response;
      } else {
        throw new Error('Invalid contract data structure');
      }
      
      console.log('Processed contract data:', contractData);
      setContract(contractData);
    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
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

  const getDaysRemaining = (endDate: string): number => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
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

  const calculateTotalInitialPayment = (): number => {
    if (!contract) return 0;
    return (contract.securityDeposit || 0);
  };

  // Format contract duration type for display
  const formatDurationType = (durationType: string | undefined): string => {
    if (!durationType) return '-';
    return durationType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if value exists and should be displayed
  const shouldDisplay = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  };

  // Safe value getter - returns value or null
  const getSafeValue = (value: any): string | null => {
    return shouldDisplay(value) ? value.toString() : null;
  };

  // Render field only if value exists
  const renderField = (label: string, value: any, formatter?: (val: any) => string) => {
    const displayValue = formatter ? formatter(value) : getSafeValue(value);
    if (!displayValue) return null;

    return (
      <div>
        <label className="text-sm font-medium text-gray-500">{label}</label>
        <p className="text-gray-900">{displayValue}</p>
      </div>
    );
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
  const isOverdue = daysRemaining < 0;

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
              {getStatusBadge(contract.contractStatus)}
            </div>
            {shouldDisplay(contract.createdAt) && (
              <p className="text-gray-600">
                Created on {formatDate(contract.createdAt)}
                {contract.createdBy && ` by ${contract.createdBy.username}`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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
            
            {onTerminate && 
             (contract.contractStatus === 'ACTIVE') && (
              <Button variant="danger" onClick={() => onTerminate(contract)}>
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

      {isOverdue && contract.contractStatus === 'ACTIVE' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">
              Contract expired {Math.abs(daysRemaining)} days ago
            </span>
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
                </div>
                <div className="space-y-3">
                  {renderField('Grace Period', contract.gracePeriodDays, (val) => `${val} days`)}
                  {renderField('Notice Period', contract.noticePeriodDays, (val) => `${val} days`)}
                  {renderField('Renewal Notice', contract.renewalNoticeDays, (val) => `${val} days`)}
                </div>
                <div className="space-y-3">
                  {renderField('Contract Status', contract.contractStatus, (val) => 
                    val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                  )}
                  {renderField('Days Remaining', daysRemaining, (val) => `${val} days`)}
                  {contract.contractFilePath && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract Document</label>
                      <p>
                        <a 
                          href={contract.contractFilePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Document
                        </a>
                      </p>
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

                {(contract.securityDeposit && contract.securityDeposit > 0) && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-800 font-medium">Total Initial Payment Required</div>
                    <div className="text-xl font-bold text-yellow-900">
                      {formatCurrency(calculateTotalInitialPayment())}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Due upon contract signing
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
                    <div className="text-sm text-green-600">Contract Value</div>
                    <div className="text-lg font-semibold text-green-900">
                      {formatCurrency(contract.rentalFee * 
                        (contract.contractDurationType === 'THREE_MONTHS' ? 3 :
                         contract.contractDurationType === 'SIX_MONTHS' ? 6 :
                         contract.contractDurationType === 'ONE_YEAR' ? 12 :
                         contract.contractDurationType === 'TWO_YEARS' ? 24 : 12)
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600">Duration</div>
                    <div className="text-lg font-semibold text-purple-900">
                      {contract.contractDurationType === 'THREE_MONTHS' ? '3 Months' :
                       contract.contractDurationType === 'SIX_MONTHS' ? '6 Months' :
                       contract.contractDurationType === 'ONE_YEAR' ? '1 Year' :
                       contract.contractDurationType === 'TWO_YEARS' ? '2 Years' : '1 Year'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {renderField('Status', contract.contractStatus, (val) => 
                    val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                  )}
                  {renderField('Start Date', contract.startDate, formatDate)}
                  {renderField('End Date', contract.endDate, formatDate)}
                  {renderField('Days Remaining', daysRemaining, (val) => `${val} days`)}
                  
                  {contract.contractFilePath && (
                    <div className="pt-3 border-t border-gray-200">
                      <a 
                        href={contract.contractFilePath} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Contract Document
                      </a>
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
                    Contract was created and initialized with status: <span className="font-medium">{contract.contractStatus}</span>
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
                    Contract is currently <span className="font-medium">{contract.contractStatus.replace(/_/g, ' ').toLowerCase()}</span>
                    {isExpiringSoon && contract.contractStatus === 'ACTIVE' && (
                      <span className="text-orange-600 font-medium"> - Expiring soon</span>
                    )}
                    {isOverdue && contract.contractStatus === 'ACTIVE' && (
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
                  {contract.contractStatus === 'ACTIVE' && isOverdue && (
                    <li>• Contract has expired - take action to renew or terminate</li>
                  )}
                  {!contract.contractFilePath && (
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
            {contract.contractFilePath && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(contract.contractFilePath, '_blank')}
              >
                View Document
              </Button>
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