// components/units/SpaceTypeForm.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      newErrors.name = t('spaceType.errors.nameRequired');
    } else if (formData.name.length > 50) {
      newErrors.name = t('spaceType.errors.nameTooLong');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('spaceType.errors.descriptionRequired');
    } else if (formData.description.length > 500) {
      newErrors.description = t('spaceType.errors.descriptionTooLong');
    }

    if (formData.basePricePerSqm < 0) {
      newErrors.basePricePerSqm = t('spaceType.errors.basePriceNegative');
    } else if (formData.basePricePerSqm > 10000) {
      newErrors.basePricePerSqm = t('spaceType.errors.basePriceTooHigh');
    }

    if (formData.minSpace < 0) {
      newErrors.minSpace = t('spaceType.errors.minSpaceNegative');
    } else if (formData.minSpace > 10000) {
      newErrors.minSpace = t('spaceType.errors.minSpaceTooHigh');
    }

    if (formData.maxSpace < 0) {
      newErrors.maxSpace = t('spaceType.errors.maxSpaceNegative');
    } else if (formData.maxSpace > 10000) {
      newErrors.maxSpace = t('spaceType.errors.maxSpaceTooHigh');
    }

    if (formData.maxSpace > 0 && formData.minSpace > 0 && formData.maxSpace < formData.minSpace) {
      newErrors.maxSpace = t('spaceType.errors.maxLessThanMin');
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
          {t('spaceType.labels.name')} *
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
          placeholder={t('spaceType.placeholders.name')}
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
          {t('spaceType.labels.description')} *
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
          placeholder={t('spaceType.placeholders.description')}
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
            {t('spaceType.labels.basePrice')} *
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
            placeholder={t('spaceType.placeholders.basePrice')}
          />
          {errors.basePricePerSqm && (
            <p className="text-red-500 text-sm mt-1">{errors.basePricePerSqm}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('spaceType.labels.minSpace')}
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
            placeholder={t('spaceType.placeholders.minSpace')}
          />
          {errors.minSpace && (
            <p className="text-red-500 text-sm mt-1">{errors.minSpace}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('spaceType.labels.maxSpace')}
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
            placeholder={t('spaceType.placeholders.maxSpace')}
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
          {t('spaceType.labels.hasUtilities')}
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {spaceType ? t('spaceType.buttons.update') : t('spaceType.buttons.create')}
        </Button>
      </div>
    </form>
  );
};