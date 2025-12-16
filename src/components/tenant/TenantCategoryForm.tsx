import React, { useState, useEffect } from 'react';
import type { TenantCategory } from '../../types/tenant';

interface TenantCategoryFormProps {
  category?: TenantCategory;
  onSubmit: (data: Omit<TenantCategory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isEditing: boolean;
  isLoading?: boolean;
}

const TenantCategoryForm: React.FC<TenantCategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isEditing,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    categoryName: '',
    businessType: '',
    description: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (category && isEditing) {
      setFormData({
        categoryName: category.categoryName,
        businessType: category.businessType,
        description: category.description || '',
      });
    }
  }, [category, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Category Name validation
    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
    } else if (formData.categoryName.trim().length < 2) {
      newErrors.categoryName = 'Category name must be at least 2 characters';
    } else if (formData.categoryName.trim().length > 50) {
      newErrors.categoryName = 'Category name cannot exceed 50 characters';
    }

    // Business Type validation
    if (!formData.businessType.trim()) {
      newErrors.businessType = 'Business type is required';
    } else if (formData.businessType.trim().length > 50) {
      newErrors.businessType = 'Business type cannot exceed 50 characters';
    }

    // Description validation
    if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply character limits
    let processedValue = value;
    if (name === 'categoryName' && value.length > 50) {
      processedValue = value.slice(0, 50);
    } else if (name === 'businessType' && value.length > 50) {
      processedValue = value.slice(0, 50);
    } else if (name === 'description' && value.length > 1000) {
      processedValue = value.slice(0, 1000);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                Category Name *
              </label>
              <span className="text-xs text-gray-500">
                {formData.categoryName.length}/50
              </span>
            </div>
            <input
              type="text"
              id="categoryName"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleInputChange}
              maxLength={50}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.categoryName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter category name"
              disabled={isLoading}
            />
            {errors.categoryName && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryName}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                Business Type *
              </label>
              <span className="text-xs text-gray-500">
                {formData.businessType.length}/50
              </span>
            </div>
            <input
              type="text"
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              maxLength={50}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.businessType ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter business type"
              disabled={isLoading}
            />
            {errors.businessType && (
              <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <span className="text-xs text-gray-500">
                {formData.description.length}/1000
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={1000}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter description (optional)"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantCategoryForm;