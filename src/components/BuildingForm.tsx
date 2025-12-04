import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Building, Branch } from '../types';
import { buildingApi } from '../api/BuildingAPI';
import { branchApi } from '../api/BranchAPI';
import { useNotification } from '../context/NotificationContext';

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

    // Branch ID validation
    if (!formData.branchId || formData.branchId <= 0) {
      newErrors.branchId = 'Please select a branch';
    }

    // Building Name validation (matches DTO)
    if (!formData.buildingName.trim()) {
      newErrors.buildingName = 'Building name is required';
    } else if (formData.buildingName.length < 2) {
      newErrors.buildingName = 'Building name must be at least 2 characters';
    } else if (formData.buildingName.length > 50) {
      newErrors.buildingName = 'Building name must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-\.\&]+$/.test(formData.buildingName)) {
      newErrors.buildingName = 'Building name can only contain letters, numbers, spaces, hyphens, dots, and ampersands';
    }

    // Building Code validation (matches DTO)
    if (formData.buildingCode) {
      if (formData.buildingCode.length > 20) {
        newErrors.buildingCode = 'Building code must be less than 20 characters';
      } else if (!/^[A-Z0-9\-]*$/.test(formData.buildingCode)) {
        newErrors.buildingCode = 'Building code can only contain uppercase letters, numbers, and hyphens';
      }
    }

    // Total Floors validation (matches DTO)
    if (formData.totalFloors < 0) {
      newErrors.totalFloors = 'Total floors cannot be negative';
    } else if (formData.totalFloors > 25) {
      newErrors.totalFloors = 'Total floors cannot exceed 25';
    }

    // Leasable Area validation (matches DTO)
    if (formData.totalLeasableArea < 0) {
      newErrors.totalLeasableArea = 'Leasable area cannot be negative';
    } else if (formData.totalLeasableArea > 5000000) {
      newErrors.totalLeasableArea = 'Leasable area cannot exceed 5,000,000 sqft';
    } else if (formData.totalLeasableArea.toString().split('.')[1]?.length > 2) {
      newErrors.totalLeasableArea = 'Leasable area can only have up to 2 decimal places';
    }

    // Transformer Fee validation
    if (formData.transformerFee < 0) {
      newErrors.transformerFee = 'Transformer fee cannot be negative';
    } else if (formData.transformerFee > 100000000) {
      newErrors.transformerFee = 'Transformer fee cannot exceed 100,000,000 MMK';
    } else if (formData.transformerFee.toString().split('.')[1]?.length > 2) {
      newErrors.transformerFee = 'Transformer fee can only have up to 2 decimal places';
    }

    // Generator Fee validation
    if (formData.generatorFee < 0) {
      newErrors.generatorFee = 'Generator fee cannot be negative';
    } else if (formData.generatorFee > 100000000) {
      newErrors.generatorFee = 'Generator fee cannot exceed 100,000,000 MMK';
    } else if (formData.generatorFee.toString().split('.')[1]?.length > 2) {
      newErrors.generatorFee = 'Generator fee can only have up to 2 decimal places';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicateBuilding = async (): Promise<boolean> => {
    if (!formData.buildingName.trim() || !formData.branchId) {
      return false;
    }

    setIsCheckingDuplicate(true);
    try {
      // Use the API checkExists method if available
      // For now, we'll return false (assuming it's not a duplicate)
      return false;
    } catch (error) {
      console.error('Error checking duplicate building:', error);
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    // Check for duplicate building name (only for new buildings)
    if (!building) {
      const isDuplicate = await checkDuplicateBuilding();
      if (isDuplicate) {
        showError(`A building named "${formData.buildingName}" already exists in the selected branch`);
        return;
      }
    }

    setLoading(true);

    try {
      // Convert to proper types for API
      const buildingData = {
        ...formData,
        buildingCode: formData.buildingCode || null, // Send null if empty
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
        showError(error.response.data.message);
      } 
      else if (error.message?.includes('Network Error')) {
        showError('Network error. Please check your connection and try again.');
      }
      else if (error.message?.includes('already exists')) {
        showError('A building with this name already exists in the selected branch');
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

  const handleBuildingNameBlur = async () => {
    if (formData.buildingName.trim() && formData.branchId && !building) {
      const isDuplicate = await checkDuplicateBuilding();
      if (isDuplicate) {
        setErrors(prev => ({
          ...prev,
          buildingName: `A building named "${formData.buildingName}" already exists in the selected branch`
        }));
        showWarning('Duplicate building name detected');
      }
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

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-stone-200">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-stone-900">
            {building ? 'Edit Building' : 'Add New Building'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
            aria-label="Close"
            disabled={loading}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
              Branch *
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              disabled={loading || branches.length === 0}
              className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 bg-white shadow-sm ${
                errors.branchId ? 'border-red-500' : 'border-stone-300'
              } ${(loading || branches.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value={0}>Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="mt-1 text-xs text-red-600">{errors.branchId}</p>
            )}
            {branches.length === 0 && (
              <p className="mt-1 text-xs text-yellow-600">No branches available. Please create a branch first.</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
              Building Name *
            </label>
            <input
              type="text"
              name="buildingName"
              value={formData.buildingName}
              onChange={handleChange}
              onBlur={handleBuildingNameBlur}
              disabled={loading}
              required
              className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm ${
                errors.buildingName ? 'border-red-500' : 'border-stone-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Enter building name (2-50 characters)"
              maxLength={50}
            />
            {errors.buildingName && (
              <p className="mt-1 text-xs text-red-600">{errors.buildingName}</p>
            )}
            <p className="mt-1 text-xs text-stone-500">
              {formData.buildingName.length}/50 characters
            </p>
            {isCheckingDuplicate && (
              <p className="mt-1 text-xs text-blue-600">Checking for duplicates...</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
              Building Code (Optional)
            </label>
            <input
              type="text"
              name="buildingCode"
              value={formData.buildingCode}
              onChange={handleBuildingCodeChange}
              disabled={loading}
              className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm ${
                errors.buildingCode ? 'border-red-500' : 'border-stone-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Enter building code (uppercase letters, numbers, hyphens only)"
              maxLength={20}
            />
            {errors.buildingCode && (
              <p className="mt-1 text-xs text-red-600">{errors.buildingCode}</p>
            )}
            <p className="mt-1 text-xs text-stone-500">
              {formData.buildingCode.length}/20 characters
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                Total Floors (0-25)
              </label>
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors || ''}
                onChange={handleChange}
                min="0"
                step="1"
                disabled={loading}
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm ${
                  errors.totalFloors ? 'border-red-500' : 'border-stone-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="0"
              />
              {errors.totalFloors && (
                <p className="mt-1 text-xs text-red-600">{errors.totalFloors}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                Total Leasable Area (sqft)
              </label>
              <input
                type="number"
                name="totalLeasableArea"
                value={formData.totalLeasableArea || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm ${
                  errors.totalLeasableArea ? 'border-red-500' : 'border-stone-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="0"
              />
              {errors.totalLeasableArea && (
                <p className="mt-1 text-xs text-red-600">{errors.totalLeasableArea}</p>
              )}
              <p className="mt-1 text-xs text-stone-500">
                Current: {formatNumber(formData.totalLeasableArea)} sqft
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                Transformer Fee (MMK)
              </label>
              <input
                type="number"
                name="transformerFee"
                value={formData.transformerFee || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm ${
                  errors.transformerFee ? 'border-red-500' : 'border-stone-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="0"
              />
              {errors.transformerFee && (
                <p className="mt-1 text-xs text-red-600">{errors.transformerFee}</p>
              )}
              <p className="mt-1 text-xs text-stone-500">
                Current: {formatCurrency(formData.transformerFee)}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                Generator Fee (MMK)
              </label>
              <input
                type="number"
                name="generatorFee"
                value={formData.generatorFee || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm ${
                  errors.generatorFee ? 'border-red-500' : 'border-stone-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="0"
              />
              {errors.generatorFee && (
                <p className="mt-1 text-xs text-red-600">{errors.generatorFee}</p>
              )}
              <p className="mt-1 text-xs text-stone-500">
                Current: {formatCurrency(formData.generatorFee)}
              </p>
            </div>
          </div>

          {(formData.transformerFee > 0 || formData.generatorFee > 0) && (
            <div className="bg-stone-50 p-3 sm:p-4 rounded-lg border border-stone-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-700">Total Additional Fees:</span>
                <span className="text-lg font-bold text-stone-900">
                  {formatCurrency(formData.transformerFee + formData.generatorFee)}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                (Transformer: {formatCurrency(formData.transformerFee)} + Generator: {formatCurrency(formData.generatorFee)})
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 sm:pt-6 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 sm:px-6 py-2 sm:py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-xs sm:text-sm lg:text-base shadow-sm w-full sm:w-auto order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isCheckingDuplicate}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-xs sm:text-sm lg:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? 'Saving...' : 
               isCheckingDuplicate ? 'Checking...' : 
               building ? 'Update Building' : 'Create Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuildingForm;