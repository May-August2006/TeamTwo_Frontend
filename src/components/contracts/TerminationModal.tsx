// components/contracts/TerminationModal.tsx
import React, { useState, useEffect } from 'react';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { Contract, LeaseTerminationRequest, TerminationPreview } from '../../types/contract';

interface TerminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: Contract) => void;
  contract: Contract | null;
}

export const TerminationModal: React.FC<TerminationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contract
}) => {
  const [terminationData, setTerminationData] = useState<LeaseTerminationRequest>({
    terminationDate: new Date().toISOString().split('T')[0],
    terminationReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<TerminationPreview | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && contract) {
      setTerminationData({
        terminationDate: new Date().toISOString().split('T')[0],
        terminationReason: ''
      });
      setErrors({});
    }
  }, [isOpen, contract]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!terminationData.terminationDate) {
      newErrors.terminationDate = 'Termination date is required';
    } else {
      const terminationDate = new Date(terminationData.terminationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (terminationDate < today) {
        newErrors.terminationDate = 'Termination date cannot be in the past';
      }
    }

    if (!terminationData.terminationReason.trim()) {
      newErrors.terminationReason = 'Termination reason is required';
    } else if (terminationData.terminationReason.trim().length < 5) {
      newErrors.terminationReason = 'Please provide a detailed reason (minimum 5 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !validateForm()) return;

    setLoading(true);
    try {
      const response = await contractApi.terminateWithDetails(contract.id, terminationData);
      
      if (response.data) {
        onSuccess(response.data.contract);
        onClose();
      }
    } catch (error: any) {
      console.error('Error terminating contract:', error);
      const errorMessage = error.response?.data?.error || 'Failed to terminate contract';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTerminationData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Terminate Contract</h2>
          <p className="text-gray-600 mt-1">
            Terminating contract: <strong>{contract.contractNumber}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contract Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Contract Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Tenant:</strong> {contract.tenant?.tenantName}</p>
              <p><strong>Unit:</strong> {contract.unit?.unitNumber}</p>
              <p><strong>Current Status:</strong> {contract.contractStatus}</p>
              <p><strong>End Date:</strong> {new Date(contract.endDate).toLocaleDateString()}</p>
            </div>
          </div>


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
            />
            {errors.terminationDate && (
              <p className="text-red-500 text-sm mt-1">{errors.terminationDate}</p>
            )}
          </div>

          {/* Termination Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termination Reason *
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
          </div>

          {/* Additional Notes (if reason is "Other") */}
          {terminationData.terminationReason === 'Other (please specify below)' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details *
              </label>
              <textarea
                name="additionalNotes"
                value={terminationData.terminationReason}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide specific details for termination..."
                required
              />
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 font-medium">Important Notice</span>
            </div>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• This action cannot be undone</li>
              <li>• The unit will be marked as available immediately</li>
              <li>• Contract status will be changed to "TERMINATED"</li>
              <li>• All future billing will be stopped</li>
            </ul>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={loading}            >
              Terminate Contract
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};