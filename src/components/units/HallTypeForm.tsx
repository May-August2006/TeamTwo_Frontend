// components/units/HallTypeForm.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/ui/Button';
import type { HallType, HallTypeRequest } from '../../types/unit';

interface HallTypeFormProps {
  hallType?: HallType;
  onSubmit: (data: HallTypeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const HallTypeForm: React.FC<HallTypeFormProps> = ({
  hallType,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<HallTypeRequest>({
    name: '',
    description: '',
    basePrice: 0,
    capacity: 0,
    minBookingHours: 0,
    maxBookingHours: 0,
    hasAudioEquipment: false,
    hasVideoEquipment: false,
    hasCatering: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hallType) {
      setFormData({
        name: hallType.name,
        description: hallType.description,
        basePrice: hallType.basePrice,
        capacity: hallType.capacity,
        minBookingHours: hallType.minBookingHours,
        maxBookingHours: hallType.maxBookingHours,
        hasAudioEquipment: hallType.hasAudioEquipment,
        hasVideoEquipment: hallType.hasVideoEquipment,
        hasCatering: hallType.hasCatering
      });
    }
  }, [hallType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('hallType.errors.nameRequired');
    } else if (formData.name.length > 50) {
      newErrors.name = t('hallType.errors.nameTooLong');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('hallType.errors.descriptionRequired');
    } else if (formData.description.length > 500) {
      newErrors.description = t('hallType.errors.descriptionTooLong');
    }

    if (formData.basePrice < 0) {
      newErrors.basePrice = t('hallType.errors.basePriceNegative');
    } else if (formData.basePrice > 100000) {
      newErrors.basePrice = t('hallType.errors.basePriceTooHigh');
    }

    if (formData.capacity < 0) {
      newErrors.capacity = t('hallType.errors.capacityNegative');
    } else if (formData.capacity > 10000) {
      newErrors.capacity = t('hallType.errors.capacityTooHigh');
    }

    if (formData.minBookingHours < 0) {
      newErrors.minBookingHours = t('hallType.errors.minHoursNegative');
    } else if (formData.minBookingHours > 24) {
      newErrors.minBookingHours = t('hallType.errors.minHoursTooHigh');
    }

    if (formData.maxBookingHours < 0) {
      newErrors.maxBookingHours = t('hallType.errors.maxHoursNegative');
    } else if (formData.maxBookingHours > 720) { // 30 days
      newErrors.maxBookingHours = t('hallType.errors.maxHoursTooHigh');
    }

    if (formData.maxBookingHours > 0 && formData.minBookingHours > 0 && 
        formData.maxBookingHours < formData.minBookingHours) {
      newErrors.maxBookingHours = t('hallType.errors.maxLessThanMin');
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
      if (name === 'basePrice' && numValue > 100000) {
        processedValue = 100000;
      } else if (name === 'capacity' && numValue > 10000) {
        processedValue = 10000;
      } else if (name === 'minBookingHours' && numValue > 24) {
        processedValue = 24;
      } else if (name === 'maxBookingHours' && numValue > 720) {
        processedValue = 720;
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
          {t('hallType.labels.name')} *
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
          placeholder={t('hallType.placeholders.name')}
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
          {t('hallType.labels.description')} *
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
          placeholder={t('hallType.placeholders.description')}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('hallType.labels.basePrice')} *
          </label>
          <input
            type="number"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleChange}
            min="0"
            max="100000"
            step="0.01"
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.basePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('hallType.placeholders.basePrice')}
          />
          {errors.basePrice && (
            <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('hallType.labels.capacity')} *
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="0"
            max="10000"
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('hallType.placeholders.capacity')}
          />
          {errors.capacity && (
            <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('hallType.labels.minBookingHours')}
          </label>
          <input
            type="number"
            name="minBookingHours"
            value={formData.minBookingHours}
            onChange={handleChange}
            min="0"
            max="24"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minBookingHours ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('hallType.placeholders.minBookingHours')}
          />
          {errors.minBookingHours && (
            <p className="text-red-500 text-sm mt-1">{errors.minBookingHours}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('hallType.labels.maxBookingHours')}
          </label>
          <input
            type="number"
            name="maxBookingHours"
            value={formData.maxBookingHours}
            onChange={handleChange}
            min="0"
            max="720"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxBookingHours ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('hallType.placeholders.maxBookingHours')}
          />
          {errors.maxBookingHours && (
            <p className="text-red-500 text-sm mt-1">{errors.maxBookingHours}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">
          {t('hallType.labels.amenities')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasAudioEquipment"
              name="hasAudioEquipment"
              checked={formData.hasAudioEquipment}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasAudioEquipment" className="text-sm font-medium text-gray-700">
              {t('hallType.amenities.audioEquipment')}
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasVideoEquipment"
              name="hasVideoEquipment"
              checked={formData.hasVideoEquipment}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasVideoEquipment" className="text-sm font-medium text-gray-700">
              {t('hallType.amenities.videoEquipment')}
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasCatering"
              name="hasCatering"
              checked={formData.hasCatering}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasCatering" className="text-sm font-medium text-gray-700">
              {t('hallType.amenities.catering')}
            </label>
          </div>
        </div>
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
          {hallType ? t('hallType.buttons.update') : t('hallType.buttons.create')}
        </Button>
      </div>
    </form>
  );
};