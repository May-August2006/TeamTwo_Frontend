// components/contracts/TerminationModal.tsx
import React, { useState, useEffect } from 'react';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import type { Contract, LeaseTerminationRequest, TerminationPreview } from '../../types/contract';

interface TerminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (terminationData: LeaseTerminationRequest) => Promise<void>;
  contract: Contract | null;
  isLoading?: boolean;
}

export const TerminationModal: React.FC<TerminationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contract,
  isLoading = false
}) => {
  const { showError, showWarning } = useNotification();
  
  const [terminationData, setTerminationData] = useState<LeaseTerminationRequest>({
    terminationDate: new Date().toISOString().split('T')[0],
    terminationReason: ''
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<TerminationPreview | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otherReasonText, setOtherReasonText] = useState('');

  useEffect(() => {
    if (isOpen && contract) {
      setTerminationData({
        terminationDate: new Date().toISOString().split('T')[0],
        terminationReason: ''
      });
      setOtherReasonText('');
      setErrors({});
      setPreview(null);
    }
  }, [isOpen, contract]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Termination date validation
    if (!terminationData.terminationDate) {
      newErrors.terminationDate = 'Termination date is required';
    } else {
      const terminationDate = new Date(terminationData.terminationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (terminationDate < today) {
        newErrors.terminationDate = 'Termination date cannot be in the past';
      }
      
      // Check if termination date is before contract start date
      if (contract?.startDate) {
        const startDate = new Date(contract.startDate);
        if (terminationDate < startDate) {
          newErrors.terminationDate = 'Termination date cannot be before Lease start date';
        }
      }
    }

    // Termination reason validation
    if (!terminationData.terminationReason.trim()) {
      newErrors.terminationReason = 'Termination reason is required';
    } else if (terminationData.terminationReason.trim().length < 5) {
      newErrors.terminationReason = 'Please provide a detailed reason (minimum 5 characters)';
    } else if (terminationData.terminationReason.trim().length > 500) {
      newErrors.terminationReason = 'Termination reason cannot exceed 500 characters';
    }

    // Additional validation for "Other" reason
    if (terminationData.terminationReason === 'Other (please specify below)' && !otherReasonText.trim()) {
      newErrors.otherReason = 'Please provide specific details for termination';
    } else if (terminationData.terminationReason === 'Other (please specify below)' && otherReasonText.trim().length < 5) {
      newErrors.otherReason = 'Please provide detailed explanation (minimum 5 characters)';
    } else if (terminationData.terminationReason === 'Other (please specify below)' && otherReasonText.trim().length > 500) {
      newErrors.otherReason = 'Additional details cannot exceed 500 characters';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showError('Please fix the validation errors before submitting.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !validateForm()) return;

    // Prepare final termination data
    const finalTerminationData = {
      ...terminationData,
      // If reason is "Other", use the custom text
      terminationReason: terminationData.terminationReason === 'Other (please specify below)' 
        ? otherReasonText 
        : terminationData.terminationReason
    };

    try {
      await onSuccess(finalTerminationData);
      // Success message is handled by parent component
    } catch (error: any) {
      console.error('Error terminating contract:', error);
      const errorMessage = error.response?.data?.error || 'Failed to terminate contract';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle character limits
    if (name === 'terminationReason' && value.length > 100) {
      showWarning('Termination reason cannot exceed 100 characters');
      return;
    }
    
    setTerminationData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error when user makes changes
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const handleOtherReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (value.length > 500) {
      showWarning('Additional details cannot exceed 500 characters');
      return;
    }
    
    setOtherReasonText(value);
    
    if (errors.otherReason) {
      setErrors(prev => ({ ...prev, otherReason: '' }));
    }
  };

  const calculatePenaltyInfo = () => {
    if (!contract) return null;
    
    const terminationDate = new Date(terminationData.terminationDate);
    const contractEndDate = new Date(contract.endDate);
    const today = new Date();
    
    // Calculate early termination penalty (if applicable)
    const monthsRemaining = Math.max(0, Math.ceil((contractEndDate.getTime() - terminationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    if (monthsRemaining > 0) {
      const penaltyAmount = contract.rentalFee ? contract.rentalFee * 2 : 0; // 2 months rent as penalty
      return {
        isEarlyTermination: true,
        monthsRemaining,
        penaltyAmount,
        noticePeriodDays: contract.noticePeriodDays || 30
      };
    }
    
    return null;
  };

  const terminationReasons = [
    'Lease expired',
    'Early termination by tenant',
    'Breach of contract',
    'Mutual agreement',
    'Property redevelopment',
    'Tenant business closure',
    'Other (please specify below)'
  ];

  const penaltyInfo = calculatePenaltyInfo();

  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Terminate Contract</h2>
              <p className="text-gray-600 mt-1">
                Terminating contract: <strong>{contract.contractNumber}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contract Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Lease Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Tenant:</strong> {contract.tenant?.tenantName || 'N/A'}</p>
              <p><strong>Unit:</strong> {contract.unit?.unitNumber || 'N/A'}</p>
              <p><strong>Current Status:</strong> 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  contract.contractStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  contract.contractStatus === 'EXPIRING' ? 'bg-orange-100 text-orange-800' :
                  contract.contractStatus === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contract.contractStatus}
                </span>
              </p>
              <p><strong>End Date:</strong> {new Date(contract.endDate).toLocaleDateString()}</p>
              {contract.rentalFee && (
                <p><strong>Monthly Rent:</strong> {contract.rentalFee.toLocaleString()} MMK</p>
              )}
              {contract.securityDeposit && contract.securityDeposit > 0 && (
                <p><strong>Security Deposit:</strong> {contract.securityDeposit.toLocaleString()} MMK</p>
              )}
            </div>
          </div>

          {/* Early Termination Penalty Warning */}
          {penaltyInfo?.isEarlyTermination && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">Early Termination Penalty</span>
              </div>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• {penaltyInfo.monthsRemaining} months remaining on contract</li>
                <li>• Early termination penalty: {penaltyInfo.penaltyAmount.toLocaleString()} MMK</li>
                <li>• {penaltyInfo.noticePeriodDays} days notice period required</li>
              </ul>
            </div>
          )}

          {/* Termination Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termination Date *
            </label>
            <input
              type="date"
              name="terminationDate"
              value={terminationData.terminationDate}
              onChange={handleInputChange}
              required
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.terminationDate ? 'border-red-500' : 'border-gray-300'
              }`}
              min={new Date().toISOString().split('T')[0]}
              max={contract.endDate}
            />
            {errors.terminationDate && (
              <p className="text-red-500 text-sm mt-1">{errors.terminationDate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must be between today and Lease end date ({new Date(contract.endDate).toLocaleDateString()})
            </p>
          </div>

          {/* Termination Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termination Reason *
              <span className="text-xs text-gray-500 ml-2">Maximum 100 characters</span>
            </label>
            <select
              name="terminationReason"
              value={terminationData.terminationReason}
              onChange={handleInputChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.terminationReason ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a reason...</option>
              {terminationReasons.map(reason => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.terminationReason && (
              <p className="text-red-500 text-sm mt-1">{errors.terminationReason}</p>
            )}
            {terminationData.terminationReason && (
              <p className="text-xs text-gray-500 mt-1">
                {100 - terminationData.terminationReason.length} characters remaining
              </p>
            )}
          </div>

          {/* Additional Notes (if reason is "Other") */}
          {terminationData.terminationReason === 'Other (please specify below)' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details *
                <span className="text-xs text-gray-500 ml-2">Maximum 500 characters</span>
              </label>
              <textarea
                name="otherReason"
                value={otherReasonText}
                onChange={handleOtherReasonChange}
                rows={3}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.otherReason ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Please provide specific details for termination..."
                required
              />
              {errors.otherReason && (
                <p className="text-red-500 text-sm mt-1">{errors.otherReason}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {500 - otherReasonText.length} characters remaining
              </p>
            </div>
          )}

          {/* Security Deposit Information */}
          {contract.securityDeposit && contract.securityDeposit > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 font-medium">Security Deposit Information</span>
              </div>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Security deposit: {contract.securityDeposit.toLocaleString()} MMK</li>
                <li>• Deposit will be refunded after property inspection</li>
                <li>• Any damages or outstanding bills will be deducted</li>
                <li>• Refund processed within 30 days of termination</li>
              </ul>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">Important Notice</span>
            </div>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li>• This action <strong>cannot be undone</strong></li>
              <li>• The unit will be marked as available immediately</li>
              <li>• Lease status will be changed to "TERMINATED"</li>
              <li>• All future billing will be stopped</li>
              <li>• Tenant will be notified of termination</li>
            </ul>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Terminating...' : 'Terminate Contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};