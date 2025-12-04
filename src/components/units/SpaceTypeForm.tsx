// components/units/SpaceTypeForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../common/ui/Button';
import type { SpaceType, SpaceTypeRequest } from '../../types/unit';

interface SpaceTypeFormProps {
  spaceType?: SpaceType;
  onSubmit: (data: SpaceTypeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SpaceTypeForm: React.FC<SpaceTypeFormProps> = ({
  spaceType,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<SpaceTypeRequest>({
    name: '',
    description: '',
    basePricePerSqm: 0,
    minSpace: 0,
    maxSpace: 0,
    hasUtilities: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (spaceType) {
      setFormData({
        name: spaceType.name,
        description: spaceType.description,
        basePricePerSqm: spaceType.basePricePerSqm,
        minSpace: spaceType.minSpace,
        maxSpace: spaceType.maxSpace,
        hasUtilities: spaceType.hasUtilities
      });
    }
  }, [spaceType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Space type name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Space type name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.basePricePerSqm < 0) {
      newErrors.basePricePerSqm = 'Base price cannot be negative';
    } else if (formData.basePricePerSqm > 10000) {
      newErrors.basePricePerSqm = 'Base price cannot exceed $10,000 per sqm';
    }

    if (formData.minSpace < 0) {
      newErrors.minSpace = 'Minimum space cannot be negative';
    } else if (formData.minSpace > 10000) {
      newErrors.minSpace = 'Minimum space cannot exceed 10,000 sqm';
    }

    if (formData.maxSpace < 0) {
      newErrors.maxSpace = 'Maximum space cannot be negative';
    } else if (formData.maxSpace > 10000) {
      newErrors.maxSpace = 'Maximum space cannot exceed 10,000 sqm';
    }

    if (formData.maxSpace > 0 && formData.minSpace > 0 && formData.maxSpace < formData.minSpace) {
      newErrors.maxSpace = 'Maximum space must be greater than minimum space';
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
    const { name, value, type } = e.target;
    
    let processedValue;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      const numValue = parseFloat(value);
      
      // Apply max limits for specific fields
      if (name === 'basePricePerSqm' && numValue > 10000) {
        processedValue = 10000;
      } else if ((name === 'minSpace' || name === 'maxSpace') && numValue > 10000) {
        processedValue = 10000;
      } else {
        processedValue = numValue || 0;
      }
      
      // Don't allow negative numbers
      if (processedValue < 0) {
        processedValue = 0;
      }
    } else {
      // For text inputs, limit length
      if (name === 'name' && value.length > 50) {
        processedValue = value.substring(0, 50);
      } else if (name === 'description' && value.length > 500) {
        processedValue = value.substring(0, 500);
      } else {
        processedValue = value;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Space Type Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          maxLength={50}
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter space type name (max 100 characters)"
        />
        <div className="flex justify-between">
          {errors.name ? (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          ) : (
            <div></div>
          )}
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formData.name.length}/50
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          maxLength={500}
          required
          rows={3}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter space type description (max 500 characters)"
        />
        <div className="flex justify-between">
          {errors.description ? (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          ) : (
            <div></div>
          )}
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formData.description.length}/500
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Price (per sqm) *
          </label>
          <input
            type="number"
            name="basePricePerSqm"
            value={formData.basePricePerSqm}
            onChange={handleChange}
            min="0"
            max="10000"
            step="0.01"
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.basePricePerSqm ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00 - 10,000"
          />
          {errors.basePricePerSqm && (
            <p className="text-red-500 text-sm mt-1">{errors.basePricePerSqm}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Space (sqm)
          </label>
          <input
            type="number"
            name="minSpace"
            value={formData.minSpace}
            onChange={handleChange}
            min="0"
            max="10000"
            step="0.1"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minSpace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0 - 10,000"
          />
          {errors.minSpace && (
            <p className="text-red-500 text-sm mt-1">{errors.minSpace}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Space (sqm)
          </label>
          <input
            type="number"
            name="maxSpace"
            value={formData.maxSpace}
            onChange={handleChange}
            min="0"
            max="10000"
            step="0.1"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxSpace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0 - 10,000"
          />
          {errors.maxSpace && (
            <p className="text-red-500 text-sm mt-1">{errors.maxSpace}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="hasUtilities"
          name="hasUtilities"
          checked={formData.hasUtilities}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="hasUtilities" className="text-sm font-medium text-gray-700">
          Has Utilities Available
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {spaceType ? 'Update Space Type' : 'Create Space Type'}
        </Button>
      </div>
    </form>
  );
};