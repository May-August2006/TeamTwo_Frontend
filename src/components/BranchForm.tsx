import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Branch } from '../types';
import { branchApi } from '../api/BranchAPI';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

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
  const { showError } = useNotification();
  const { t } = useTranslation();

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

    // Validate branch name (2-100 characters, required - matches backend @Size(min=2, max=100))
    if (!formData.branchName.trim()) {
      newErrors.branchName = t('forms.branch.validation.nameRequired');
    } else if (formData.branchName.trim().length < 2) {
      newErrors.branchName = t('forms.branch.validation.nameLength');
    } else if (formData.branchName.trim().length > 100) {
      newErrors.branchName = t('forms.branch.validation.nameMax');
    }

    // Validate address (max 250 characters, required - matches backend @Size(max=250))
    if (!formData.address.trim()) {
      newErrors.address = t('forms.branch.validation.addressRequired');
    } else if (formData.address.length > 250) {
      newErrors.address = t('forms.branch.validation.addressMax');
    }

    // Validate phone (must be exactly 11 digits starting with 09, required - matches backend @Pattern)
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = t('forms.branch.validation.phoneRequired');
    } else {
      // Remove any non-digit characters for validation
      const cleanPhone = formData.contactPhone.replace(/\D/g, '');
      
      if (!cleanPhone.startsWith('09')) {
        newErrors.contactPhone = t('forms.branch.validation.phoneStart');
      } else if (cleanPhone.length !== 11) {
        newErrors.contactPhone = t('forms.branch.validation.phoneDigits');
      } else if (!/^09\d{9}$/.test(cleanPhone)) {
        newErrors.contactPhone = t('forms.branch.validation.phoneFormat');
      }
    }

    // Validate email (required, max 100 characters - matches backend @Email @Size(max=100))
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = t('forms.branch.validation.emailRequired');
    } else {
      // More comprehensive email regex that matches Java's @Email annotation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.contactEmail)) {
        newErrors.contactEmail = t('forms.branch.validation.emailFormat');
      } else if (formData.contactEmail.length > 100) {
        newErrors.contactEmail = t('forms.branch.validation.emailMax');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
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
    
    // Phone number validation: only allow numbers and format as 09XXXXXXXXX
    if (name === 'contactPhone') {
      // Remove all non-digit characters
      const phoneValue = value.replace(/\D/g, '');
      
      // If it starts with 09, limit to 11 digits total
      let formattedPhone = phoneValue;
      if (phoneValue.startsWith('09')) {
        formattedPhone = phoneValue.substring(0, 11); // Limit to 11 digits
      } else if (phoneValue.length > 0) {
        // If user types something that doesn't start with 09, auto-add 09
        formattedPhone = '09' + phoneValue.substring(0, 9); // 09 + up to 9 more digits
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone,
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
        fieldErrors.branchName = t('forms.branch.validation.nameRequired');
      } else if (formData.branchName.trim().length < 2) {
        fieldErrors.branchName = t('forms.branch.validation.nameLength');
      } else if (formData.branchName.trim().length > 100) {
        fieldErrors.branchName = t('forms.branch.validation.nameMax');
      }
    }
    
    if (fieldName === 'address') {
      if (!formData.address.trim()) {
        fieldErrors.address = t('forms.branch.validation.addressRequired');
      } else if (formData.address.length > 250) {
        fieldErrors.address = t('forms.branch.validation.addressMax');
      }
    }
    
    if (fieldName === 'contactPhone') {
      if (!formData.contactPhone.trim()) {
        fieldErrors.contactPhone = t('forms.branch.validation.phoneRequired');
      } else {
        // Remove any non-digit characters for validation
        const cleanPhone = formData.contactPhone.replace(/\D/g, '');
        
        if (!cleanPhone.startsWith('09')) {
          fieldErrors.contactPhone = t('forms.branch.validation.phoneStart');
        } else if (cleanPhone.length !== 11) {
          fieldErrors.contactPhone = t('forms.branch.validation.phoneDigits');
        } else if (!/^09\d{9}$/.test(cleanPhone)) {
          fieldErrors.contactPhone = t('forms.branch.validation.phoneFormat');
        }
      }
    }
    
    if (fieldName === 'contactEmail') {
      if (!formData.contactEmail.trim()) {
        fieldErrors.contactEmail = t('forms.branch.validation.emailRequired');
      } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.contactEmail)) {
          fieldErrors.contactEmail = t('forms.branch.validation.emailFormat');
        } else if (formData.contactEmail.length > 100) {
          fieldErrors.contactEmail = t('forms.branch.validation.emailMax');
        }
      }
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition duration-150 shadow-sm";
    if (errors[fieldName]) {
      return `${baseClass} border-red-300 bg-red-50`;
    }
    return `${baseClass} border-stone-300`;
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200 px-6 py-4 sm:px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              {branch ? t('forms.branch.edit') : t('forms.branch.add')}
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
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-4 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="branchName">
                {t('forms.branch.name')} *
              </label>
              <input
                type="text"
                id="branchName"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                onBlur={() => handleBlur('branchName')}
                className={getInputClassName('branchName')}
                placeholder={t('forms.branch.hints.name')}
                disabled={loading}
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.branchName ? (
                  <p className="text-sm text-red-600">{errors.branchName}</p>
                ) : (
                  <p className="text-xs text-stone-500">
                    {t('forms.common.characterCount', { count: formData.branchName.length, max: 100 })}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="address">
                {t('forms.branch.address')} *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={() => handleBlur('address')}
                rows={3}
                className={getInputClassName('address')}
                placeholder={t('forms.branch.hints.address')}
                disabled={loading}
                maxLength={250}
              />
              <div className="flex justify-between mt-1">
                {errors.address ? (
                  <p className="text-sm text-red-600">{errors.address}</p>
                ) : (
                  <p className="text-xs text-stone-500">
                    {t('forms.common.characterCount', { count: formData.address.length, max: 250 })}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="contactPhone">
                {t('forms.branch.contactPhone')} *
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                onBlur={() => handleBlur('contactPhone')}
                className={getInputClassName('contactPhone')}
                placeholder={t('forms.branch.hints.phone')}
                disabled={loading}
                maxLength={11}
                pattern="09\d{9}"
                title="Must start with 09 and be 11 digits total"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
              )}
              {!errors.contactPhone && (
                <p className="mt-1 text-xs text-stone-500">
                  {t('forms.branch.hints.phoneFormat')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1" htmlFor="contactEmail">
                {t('forms.branch.contactEmail')} *
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                onBlur={() => handleBlur('contactEmail')}
                className={getInputClassName('contactEmail')}
                placeholder={t('forms.branch.hints.email')}
                disabled={loading}
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.contactEmail ? (
                  <p className="text-sm text-red-600">{errors.contactEmail}</p>
                ) : (
                  <p className="text-xs text-stone-500">
                    {t('forms.common.characterCount', { count: formData.contactEmail.length, max: 100 })}
                  </p>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="pt-6 border-t border-stone-200">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-stone-300"
                  disabled={loading}
                >
                  {t('forms.common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-white rounded-lg shadow-lg hover:bg-blue-800 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-blue-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  style={{ backgroundColor: '#1E40AF' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('forms.common.saving')}
                    </span>
                  ) : branch ? t('forms.common.update') : t('forms.common.create')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchForm;