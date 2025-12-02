// components/units/HallTypeForm.tsx
import React, { useState, useEffect } from 'react';
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
      newErrors.name = 'Hall type name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.basePrice < 0) {
      newErrors.basePrice = 'Base price cannot be negative';
    }

    if (formData.capacity < 0) {
      newErrors.capacity = 'Capacity cannot be negative';
    }

    if (formData.minBookingHours < 0) {
      newErrors.minBookingHours = 'Minimum booking hours cannot be negative';
    }

    if (formData.maxBookingHours < 0) {
      newErrors.maxBookingHours = 'Maximum booking hours cannot be negative';
    }

    if (formData.maxBookingHours > 0 && formData.minBookingHours > 0 && 
        formData.maxBookingHours < formData.minBookingHours) {
      newErrors.maxBookingHours = 'Maximum hours must be greater than minimum hours';
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
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? parseFloat(value) || 0 
              : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hall Type Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter hall type name"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter hall type description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Price *
          </label>
          <input
            type="number"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.basePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter base price"
          />
          {errors.basePrice && (
            <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity (people) *
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="0"
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter capacity"
          />
          {errors.capacity && (
            <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Booking Hours
          </label>
          <input
            type="number"
            name="minBookingHours"
            value={formData.minBookingHours}
            onChange={handleChange}
            min="0"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minBookingHours ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Minimum hours"
          />
          {errors.minBookingHours && (
            <p className="text-red-500 text-sm mt-1">{errors.minBookingHours}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Booking Hours
          </label>
          <input
            type="number"
            name="maxBookingHours"
            value={formData.maxBookingHours}
            onChange={handleChange}
            min="0"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxBookingHours ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Maximum hours"
          />
          {errors.maxBookingHours && (
            <p className="text-red-500 text-sm mt-1">{errors.maxBookingHours}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Amenities</h4>
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
              Audio Equipment
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
              Video Equipment
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
              Catering Service
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
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {hallType ? 'Update Hall Type' : 'Create Hall Type'}
        </Button>
      </div>
    </form>
  );
};