import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Branch } from '../types';
import { branchApi } from '../api/BranchAPI';
import { useNotification } from '../context/NotificationContext';

interface BranchFormProps {
  branch?: Branch | null;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

const BranchForm: React.FC<BranchFormProps> = ({ branch, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    branchName: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (branch) {
      setFormData({
        branchName: branch.branchName || '',
        address: branch.address || '',
        contactPhone: branch.contactPhone || '',
        contactEmail: branch.contactEmail || '',
      });
    }
    // Clear errors when editing a branch
    setErrors({});
  }, [branch]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate branch name (matches DTO: @NotBlank @Size(min=2, max=100))
    if (!formData.branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    } else if (formData.branchName.trim().length < 2) {
      newErrors.branchName = 'Branch name must be at least 2 characters';
    } else if (formData.branchName.trim().length > 100) {
      newErrors.branchName = 'Branch name cannot exceed 100 characters';
    }

    // Validate address (matches DTO: @Size(max=500))
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address cannot exceed 500 characters';
    }

    // Validate phone (matches DTO: @Pattern regexp = "^$|^[+]?[0-9]{10,15}$")
    if (formData.contactPhone && !/^$|^[+]?[0-9]{10,15}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone number format. Use 10-15 digits with optional + prefix';
    }

    // Validate email (matches DTO: @Email @Size(max=100))
    if (formData.contactEmail) {
      // More comprehensive email regex that matches Java's @Email annotation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Invalid email format';
      } else if (formData.contactEmail.length > 100) {
        newErrors.contactEmail = 'Email cannot exceed 100 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      let response;
      if (branch) {
        response = await branchApi.update(branch.id, formData);
      } else {
        response = await branchApi.create(formData);
      }

      if (response.data.success) {
        const message = branch ? 'Branch updated successfully' : 'Branch created successfully';
        showSuccess(message);
        onSubmit(message);
        onClose();
      } else {
        // Handle business logic errors from backend
        showError(response.data.message || 'Operation failed');
      }
    } catch (error: any) {
      console.error('Error saving branch:', error);
      
      if (error.response?.data?.errors) {
        // Handle field-specific validation errors from backend
        const backendErrors: Record<string, string> = error.response.data.errors;
        setErrors(prev => ({ ...prev, ...backendErrors }));
        
        // Show first error message
        const firstError = Object.values(backendErrors)[0];
        if (firstError) {
          showError(firstError);
        } else {
          showError('Please fix the validation errors');
        }
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message) {
        showError(error.message);
      } else {
        showError('Failed to save branch. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Phone number validation: only allow numbers and +
    if (name === 'contactPhone') {
      // Allow only numbers and + at the beginning
      const phoneValue = value.replace(/[^\d+]/g, '');
      // Ensure + is only at the beginning
      if (phoneValue.includes('+') && !phoneValue.startsWith('+')) {
        return; // Don't update if + is in the middle
      }
      setFormData(prev => ({
        ...prev,
        [name]: phoneValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBlur = (fieldName: string) => {
    // Validate individual field on blur
    const fieldErrors: Record<string, string> = {};
    
    if (fieldName === 'branchName') {
      if (!formData.branchName.trim()) {
        fieldErrors.branchName = 'Branch name is required';
      } else if (formData.branchName.trim().length < 2) {
        fieldErrors.branchName = 'Branch name must be at least 2 characters';
      } else if (formData.branchName.trim().length > 100) {
        fieldErrors.branchName = 'Branch name cannot exceed 100 characters';
      }
    }
    
    if (fieldName === 'address' && formData.address.length > 500) {
      fieldErrors.address = 'Address cannot exceed 500 characters';
    }
    
    if (fieldName === 'contactPhone' && formData.contactPhone && 
        !/^$|^[+]?[0-9]{10,15}$/.test(formData.contactPhone)) {
      fieldErrors.contactPhone = 'Invalid phone number format. Use 10-15 digits with optional + prefix';
    }
    
    if (fieldName === 'contactEmail' && formData.contactEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.contactEmail)) {
        fieldErrors.contactEmail = 'Invalid email format';
      } else if (formData.contactEmail.length > 100) {
        fieldErrors.contactEmail = 'Email cannot exceed 100 characters';
      }
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm";
    if (errors[fieldName]) {
      return `${baseClass} border-red-300 bg-red-50`;
    }
    return `${baseClass} border-stone-300`;
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            {branch ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
            disabled={loading}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="branchName">
              Branch Name *
            </label>
            <input
              type="text"
              id="branchName"
              name="branchName"
              value={formData.branchName}
              onChange={handleChange}
              onBlur={() => handleBlur('branchName')}
              required
              className={getInputClassName('branchName')}
              placeholder="Enter branch name"
              disabled={loading}
              maxLength={100}
            />
            <div className="flex justify-between mt-1">
              {errors.branchName ? (
                <p className="text-sm text-red-600">{errors.branchName}</p>
              ) : (
                <p className="text-xs text-stone-500">
                  {formData.branchName.length}/100 characters
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="address">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={() => handleBlur('address')}
              rows={3}
              className={getInputClassName('address')}
              placeholder="Enter branch address"
              disabled={loading}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              {errors.address ? (
                <p className="text-sm text-red-600">{errors.address}</p>
              ) : (
                <p className="text-xs text-stone-500">
                  {formData.address.length}/500 characters
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="contactPhone">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              onBlur={() => handleBlur('contactPhone')}
              className={getInputClassName('contactPhone')}
              placeholder="Enter phone number (e.g., +1234567890)"
              disabled={loading}
              maxLength={16} // + plus 15 digits
              pattern="^\+?[0-9]{10,15}$"
              title="10-15 digits with optional + prefix"
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
            )}
            {!errors.contactPhone && formData.contactPhone && (
              <p className="mt-1 text-xs text-stone-500">
                Format: +1234567890 (10-15 digits)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="contactEmail">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              onBlur={() => handleBlur('contactEmail')}
              className={getInputClassName('contactEmail')}
              placeholder="Enter contact email"
              disabled={loading}
              maxLength={100}
            />
            <div className="flex justify-between mt-1">
              {errors.contactEmail ? (
                <p className="text-sm text-red-600">{errors.contactEmail}</p>
              ) : formData.contactEmail && (
                <p className="text-xs text-stone-500">
                  {formData.contactEmail.length}/100 characters
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-stone-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : branch ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchForm;