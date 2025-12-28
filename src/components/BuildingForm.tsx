import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Building, Branch } from '../types';
import { buildingApi } from '../api/BuildingAPI';
import { branchApi } from '../api/BranchAPI';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

interface BuildingFormProps {
  building?: Building | null;
  onClose: () => void;
  onSubmit: () => void;
}

interface ValidationErrors {
  branchId?: string;
  buildingName?: string;
  buildingCode?: string;
  totalFloors?: string;
  totalLeasableArea?: string;
  transformerFee?: string;
  generatorFee?: string;
  [key: string]: string | undefined;
}

interface BuildingRequest {
  branchId: number;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  totalLeasableArea: number;
  transformerFee: number;
  generatorFee: number;
}

const BuildingForm: React.FC<BuildingFormProps> = ({ building, onClose, onSubmit }) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [formData, setFormData] = useState<BuildingRequest>({
    branchId: 0,
    buildingName: '',
    buildingCode: '',
    totalFloors: 0,
    totalLeasableArea: 0,
    transformerFee: 0,
    generatorFee: 0,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  useEffect(() => {
    loadBranches();
    if (building) {
      setFormData({
        branchId: building.branchId,
        buildingName: building.buildingName,
        buildingCode: building.buildingCode || '',
        totalFloors: building.totalFloors || 0,
        totalLeasableArea: building.totalLeasableArea || 0,
        transformerFee: building.transformerFee || 0,
        generatorFee: building.generatorFee || 0,
      });
    }
  }, [building]);

  const loadBranches = async () => {
    try {
      const response = await branchApi.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
      showError('Failed to load branches. Please refresh the page.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Branch ID validation - REQUIRED
    if (!formData.branchId || formData.branchId <= 0) {
      newErrors.branchId = t('forms.building.validation.branchRequired');
    }

    // Building Name validation - REQUIRED
    if (!formData.buildingName.trim()) {
      newErrors.buildingName = t('forms.building.validation.nameRequired');
    } else if (formData.buildingName.length < 2) {
      newErrors.buildingName = t('forms.building.validation.nameLength');
    } else if (formData.buildingName.length > 50) {
      newErrors.buildingName = t('forms.building.validation.nameMax');
    } else if (!/^[a-zA-Z0-9\s\-\.\&]+$/.test(formData.buildingName)) {
      newErrors.buildingName = t('forms.building.validation.nameChars');
    }

    // Building Code validation - REQUIRED
    if (!formData.buildingCode.trim()) {
      newErrors.buildingCode = t('forms.building.validation.codeRequired');
    } else if (formData.buildingCode.length > 20) {
      newErrors.buildingCode = t('forms.building.validation.codeMax');
    } else if (!/^[A-Z0-9\-]+$/.test(formData.buildingCode)) {
      newErrors.buildingCode = t('forms.building.validation.codeChars');
    }

    // Total Floors validation - REQUIRED (FIXED: check for empty string and 0 value)
    if (formData.totalFloors === null || formData.totalFloors === undefined || formData.totalFloors === 0) {
      newErrors.totalFloors = t('forms.building.validation.floorsRequired');
    } else if (formData.totalFloors < 0) {
      newErrors.totalFloors = t('forms.building.validation.floorsNegative');
    } else if (formData.totalFloors > 25) {
      newErrors.totalFloors = t('forms.building.validation.floorsMax');
    }

    // Total Leasable Area validation - REQUIRED (FIXED: check for empty string and 0 value)
    if (formData.totalLeasableArea === null || formData.totalLeasableArea === undefined || formData.totalLeasableArea === 0) {
      newErrors.totalLeasableArea = t('forms.building.validation.areaRequired');
    } else if (formData.totalLeasableArea < 0) {
      newErrors.totalLeasableArea = t('forms.building.validation.areaNegative');
    } else if (formData.totalLeasableArea > 5000000) {
      newErrors.totalLeasableArea = t('forms.building.validation.areaMax');
    } else if (formData.totalLeasableArea.toString().split('.')[1]?.length > 2) {
      newErrors.totalLeasableArea = t('forms.building.validation.areaDecimals');
    }

    // Transformer Fee validation - REQUIRED (FIXED: check for empty string and 0 value)
    if (formData.transformerFee === null || formData.transformerFee === undefined || formData.transformerFee === 0) {
      newErrors.transformerFee = t('forms.building.validation.transformerRequired');
    } else if (formData.transformerFee < 0) {
      newErrors.transformerFee = t('forms.building.validation.transformerNegative');
    } else if (formData.transformerFee > 10000000) {
      newErrors.transformerFee = t('forms.building.validation.transformerMax');
    } else if (formData.transformerFee.toString().split('.')[1]?.length > 2) {
      newErrors.transformerFee = t('forms.building.validation.transformerDecimals');
    }

    // Generator Fee validation - REQUIRED (FIXED: check for empty string and 0 value)
    if (formData.generatorFee === null || formData.generatorFee === undefined || formData.generatorFee === 0) {
      newErrors.generatorFee = t('forms.building.validation.generatorRequired');
    } else if (formData.generatorFee < 0) {
      newErrors.generatorFee = t('forms.building.validation.generatorNegative');
    } else if (formData.generatorFee > 10000000) {
      newErrors.generatorFee = t('forms.building.validation.generatorMax');
    } else if (formData.generatorFee.toString().split('.')[1]?.length > 2) {
      newErrors.generatorFee = t('forms.building.validation.generatorDecimals');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'branchId':
        if (!value || value <= 0) return t('forms.building.validation.branchRequired');
        return undefined;
      
      case 'buildingName':
        if (!value || !value.trim()) return t('forms.building.validation.nameRequired');
        if (value.length < 2) return t('forms.building.validation.nameLength');
        if (value.length > 50) return t('forms.building.validation.nameMax');
        if (!/^[a-zA-Z0-9\s\-\.\&]+$/.test(value)) 
          return t('forms.building.validation.nameChars');
        return undefined;
      
      case 'buildingCode':
        if (!value || !value.trim()) return t('forms.building.validation.codeRequired');
        if (value.length > 20) return t('forms.building.validation.codeMax');
        if (!/^[A-Z0-9\-]+$/.test(value)) 
          return t('forms.building.validation.codeChars');
        return undefined;
      
      case 'totalFloors':
        if (value === null || value === undefined || value === '' || value === 0) 
          return t('forms.building.validation.floorsRequired');
        if (value < 0) return t('forms.building.validation.floorsNegative');
        if (value > 25) return t('forms.building.validation.floorsMax');
        return undefined;
      
      case 'totalLeasableArea':
        if (value === null || value === undefined || value === '' || value === 0) 
          return t('forms.building.validation.areaRequired');
        if (value < 0) return t('forms.building.validation.areaNegative');
        if (value > 5000000) return t('forms.building.validation.areaMax');
        if (value.toString().split('.')[1]?.length > 2) 
          return t('forms.building.validation.areaDecimals');
        return undefined;
      
      case 'transformerFee':
        if (value === null || value === undefined || value === '' || value === 0) 
          return t('forms.building.validation.transformerRequired');
        if (value < 0) return t('forms.building.validation.transformerNegative');
        if (value > 10000000) return t('forms.building.validation.transformerMax');
        if (value.toString().split('.')[1]?.length > 2) 
          return t('forms.building.validation.transformerDecimals');
        return undefined;
      
      case 'generatorFee':
        if (value === null || value === undefined || value === '' || value === 0) 
          return t('forms.building.validation.generatorRequired');
        if (value < 0) return t('forms.building.validation.generatorNegative');
        if (value > 10000000) return t('forms.building.validation.generatorMax');
        if (value.toString().split('.')[1]?.length > 2) 
          return t('forms.building.validation.generatorDecimals');
        return undefined;
      
      default:
        return undefined;
    }
  };

  const validateAllFields = () => {
    const newErrors: ValidationErrors = {};
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof BuildingRequest]);
      if (error) {
        newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicateBuilding = async (): Promise<boolean> => {
    if (!formData.buildingName.trim() || !formData.branchId) {
      return false;
    }

    setIsCheckingDuplicate(true);
    try {
      // Check if building name already exists in the same branch
      const response = await buildingApi.checkExists(formData.buildingName, formData.branchId);
      return response.data; // Assuming API returns boolean
    } catch (error) {
      console.error('Error checking duplicate building:', error);
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['branchId', 'buildingName', 'buildingCode', 'totalFloors', 'totalLeasableArea', 'transformerFee', 'generatorFee'];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    // Frontend validation - check all fields
    if (!validateAllFields()) {
      showError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Convert to proper types for API
      const buildingData = {
        ...formData,
        buildingCode: formData.buildingCode.trim(), // Always send trimmed value
      };

      if (building) {
        await buildingApi.update(building.id, buildingData);
        showSuccess('Building updated successfully!');
      } else {
        await buildingApi.create(buildingData);
        showSuccess('Building created successfully!');
      }
      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error saving building:', error);
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const newErrors: ValidationErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          // Map backend field names to frontend field names if needed
          const fieldName = key === 'totalLeasableArea' ? 'totalLeasableArea' : 
                           key === 'transformerFee' ? 'transformerFee' :
                           key === 'generatorFee' ? 'generatorFee' : key;
          newErrors[fieldName] = backendErrors[key];
        });
        
        setErrors(newErrors);
        showError('Please fix the validation errors');
      } 
      else if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Handle building code duplicate error
        if (errorMessage.includes('Building code') && errorMessage.includes('already exists')) {
          setErrors(prev => ({
            ...prev,
            buildingCode: errorMessage
          }));
          showError(errorMessage);
        } 
        // Handle building name duplicate error
        else if (errorMessage.includes('Building with name') && errorMessage.includes('already exists')) {
          setErrors(prev => ({
            ...prev,
            buildingName: errorMessage
          }));
          showError(errorMessage);
        } else {
          showError(errorMessage);
        }
      } 
      else if (error.message?.includes('Network Error')) {
        showError('Network error. Please check your connection and try again.');
      }
      else {
        showError(building ? 'Failed to update building' : 'Failed to create building');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Handle numeric fields
    if (name === 'branchId' || 
        name === 'totalFloors' || 
        name === 'totalLeasableArea' ||
        name === 'transformerFee' ||
        name === 'generatorFee') {
      
      // For empty value, set to 0
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }));
      } else {
        // Parse the number - this will automatically remove leading zeros
        const numValue = parseFloat(value);
        
        // Check if it's a valid number
        if (!isNaN(numValue)) {
          // For fees and area, round to 2 decimal places
          if (name === 'totalLeasableArea' || name === 'transformerFee' || name === 'generatorFee') {
            const roundedValue = Math.round(numValue * 100) / 100;
            setFormData(prev => ({
              ...prev,
              [name]: roundedValue
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              [name]: numValue
            }));
          }
        } else {
          // If not a valid number, set to 0
          setFormData(prev => ({
            ...prev,
            [name]: 0
          }));
        }
      }
    } else {
      // Handle string fields
      let processedValue = value;
      
      // Auto-uppercase for building code
      if (name === 'buildingCode') {
        processedValue = value.toUpperCase();
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Trim values
    if (name === 'buildingName' || name === 'buildingCode') {
      const trimmedValue = value.trim();
      if (trimmedValue !== value) {
        setFormData(prev => ({
          ...prev,
          [name]: trimmedValue
        }));
      }
    }
    
    // Validate this field
    const error = validateField(name, formData[name as keyof BuildingRequest]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      // Clear error if validation passes
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleBuildingCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
    if (errors.buildingCode) {
      setErrors(prev => ({ ...prev, buildingCode: undefined }));
    }
    setFormData(prev => ({ ...prev, buildingCode: value }));
  };

  // Helper to check if field should show error
  const shouldShowError = (fieldName: string): boolean => {
    return touched[fieldName] === true && errors[fieldName] !== undefined;
  };

  // Helper function to handle numeric input with character limits
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, maxLength: number) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    let processedValue = numericValue;
    if (parts.length > 2) {
      processedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Enforce max character length
    if (processedValue.length > maxLength) {
      processedValue = processedValue.slice(0, maxLength);
    }
    
    // Update the form state
    setFormData(prev => ({
      ...prev,
      [name]: processedValue === '' ? 0 : processedValue
    }));
  };

  // Helper function to handle numeric blur
  const handleNumericBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Convert string to number and round if needed
    if (value && value !== '0') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // For fees and area, round to 2 decimal places
        if (name === 'totalLeasableArea' || name === 'transformerFee' || name === 'generatorFee') {
          const roundedValue = Math.round(numValue * 100) / 100;
          setFormData(prev => ({
            ...prev,
            [name]: roundedValue
          }));
        } else {
          // For floors, ensure it's an integer
          const intValue = Math.floor(numValue);
          setFormData(prev => ({
            ...prev,
            [name]: intValue
          }));
        }
      }
    }
    
    // Validate this field
    const error = validateField(name, formData[name as keyof BuildingRequest]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      // Clear error if validation passes
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-stone-900">
              {building ? t('forms.building.edit') : t('forms.building.add')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition duration-150"
              aria-label="Close"
              disabled={loading}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                {t('forms.building.branch')} *
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading || branches.length === 0}
                className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 bg-white shadow-sm ${
                  shouldShowError('branchId') ? 'border-red-500' : 'border-stone-300'
                } ${(loading || branches.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value={0}>{t('forms.building.hints.branch')}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
              {shouldShowError('branchId') && (
                <p className="mt-1 text-xs text-red-600">{errors.branchId}</p>
              )}
              {branches.length === 0 && (
                <p className="mt-1 text-xs text-yellow-600">{t('forms.building.hints.noBranches')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                {t('forms.building.name')} *
              </label>
              <input
                type="text"
                name="buildingName"
                value={formData.buildingName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 shadow-sm ${
                  shouldShowError('buildingName') ? 'border-red-500' : 'border-stone-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={t('forms.building.hints.name')}
                maxLength={50}
              />
              {shouldShowError('buildingName') && (
                <p className="mt-1 text-xs text-red-600">{errors.buildingName}</p>
              )}
              <p className="mt-1 text-xs text-stone-500">
                {t('forms.common.characterCount', { count: formData.buildingName.length, max: 50 })}
              </p>
              {isCheckingDuplicate && (
                <p className="mt-1 text-xs text-blue-600">{t('forms.common.loading')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                {t('forms.building.code')} *
              </label>
              <input
                type="text"
                name="buildingCode"
                value={formData.buildingCode}
                onChange={handleBuildingCodeChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 shadow-sm ${
                  shouldShowError('buildingCode') ? 'border-red-500' : 'border-stone-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={t('forms.building.hints.code')}
                maxLength={20}
              />
              {shouldShowError('buildingCode') && (
                <p className="mt-1 text-xs text-red-600">{errors.buildingCode}</p>
              )}
              <p className="mt-1 text-xs text-stone-500">
                {t('forms.common.characterCount', { count: formData.buildingCode.length, max: 20 })}
              </p>
              <p className="mt-1 text-xs text-blue-600">
                {t('forms.building.hints.codeUnique')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                  {t('forms.building.totalFloors')} ({t('forms.building.hints.floors')})
                </label>
                <input
                  type="text"
                  name="totalFloors"
                  value={formData.totalFloors === 0 ? '' : formData.totalFloors.toString()}
                  onChange={(e) => handleNumericInput(e, 2)}
                  onBlur={handleNumericBlur}
                  disabled={loading}
                  className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 shadow-sm ${
                    shouldShowError('totalFloors') ? 'border-red-500' : 'border-stone-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="0 *"
                />
                {shouldShowError('totalFloors') && (
                  <p className="mt-1 text-xs text-red-600">{errors.totalFloors}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                  {t('forms.building.totalLeasableArea')} ({t('forms.building.hints.area')})
                </label>
                <input
                  type="text"
                  name="totalLeasableArea"
                  value={formData.totalLeasableArea === 0 ? '' : formData.totalLeasableArea.toString()}
                  onChange={(e) => handleNumericInput(e, 10)}
                  onBlur={handleNumericBlur}
                  disabled={loading}
                  className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 shadow-sm ${
                    shouldShowError('totalLeasableArea') ? 'border-red-500' : 'border-stone-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="0 *"
                />
                {shouldShowError('totalLeasableArea') && (
                  <p className="mt-1 text-xs text-red-600">{errors.totalLeasableArea}</p>
                )}
                {formData.totalLeasableArea > 0 && (
                  <p className="mt-1 text-xs text-stone-500">
                    {t('forms.building.selected')}: {formatNumber(formData.totalLeasableArea)} sqft
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                  {t('forms.building.transformerFee')} ({t('forms.building.hints.transformer')})
                </label>
                <input
                  type="text"
                  name="transformerFee"
                  value={formData.transformerFee === 0 ? '' : formData.transformerFee.toString()}
                  onChange={(e) => handleNumericInput(e, 12)}
                  onBlur={handleNumericBlur}
                  disabled={loading}
                  className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 shadow-sm ${
                    shouldShowError('transformerFee') ? 'border-red-500' : 'border-stone-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="0 *"
                />
                {shouldShowError('transformerFee') && (
                  <p className="mt-1 text-xs text-red-600">{errors.transformerFee}</p>
                )}
                {formData.transformerFee > 0 && (
                  <p className="mt-1 text-xs text-stone-500">
                    {t('forms.building.selected')}: {formatCurrency(formData.transformerFee)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                  {t('forms.building.generatorFee')} ({t('forms.building.hints.generator')})
                </label>
                <input
                  type="text"
                  name="generatorFee"
                  value={formData.generatorFee === 0 ? '' : formData.generatorFee.toString()}
                  onChange={(e) => handleNumericInput(e, 12)}
                  onBlur={handleNumericBlur}
                  disabled={loading}
                  className={`w-full border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition duration-150 shadow-sm ${
                    shouldShowError('generatorFee') ? 'border-red-500' : 'border-stone-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="0 *"
                />
                {shouldShowError('generatorFee') && (
                  <p className="mt-1 text-xs text-red-600">{errors.generatorFee}</p>
                )}
                {formData.generatorFee > 0 && (
                  <p className="mt-1 text-xs text-stone-500">
                    {t('forms.building.selected')}: {formatCurrency(formData.generatorFee)}
                  </p>
                )}
              </div>
            </div>

            {(formData.transformerFee > 0 || formData.generatorFee > 0) && (
              <div className="bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-stone-700">{t('forms.building.totalAdditionalFees')}:</span>
                  <span className="text-lg font-bold text-stone-900">
                    {formatCurrency(formData.transformerFee + formData.generatorFee)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  ({t('forms.building.transformerFee')}: {formatCurrency(formData.transformerFee)} + {t('forms.building.generatorFee')}: {formatCurrency(formData.generatorFee)})
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 sm:pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 text-stone-600 border border-stone-300 rounded-2xl hover:bg-stone-100 transition duration-150 font-medium text-xs sm:text-sm lg:text-base shadow-sm w-full sm:w-auto order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('forms.common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || isCheckingDuplicate}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#1E40AF] text-white rounded-2xl shadow-lg hover:bg-[#1E3A8A] transition duration-150 font-semibold text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-4 focus:ring-[#93C5FD] transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
              >
                {loading ? t('forms.common.saving') : 
                 isCheckingDuplicate ? t('forms.common.loading') : 
                 building ? t('forms.common.update') : t('forms.common.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuildingForm;