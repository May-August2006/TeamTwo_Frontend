import React, { useState, useEffect } from 'react';
import { Button } from '../common/ui/Button';
import type { RoomType, RoomTypeRequest } from '../../types/unit';

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSubmit: (data: RoomTypeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RoomTypeForm: React.FC<RoomTypeFormProps> = ({
  roomType,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<RoomTypeRequest>({
    typeName: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roomType) {
      setFormData({
        typeName: roomType.typeName,
        description: roomType.description
      });
    }
  }, [roomType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.typeName.trim()) {
      newErrors.typeName = 'Room type name is required';
    } else if (formData.typeName.length > 50) {
      newErrors.typeName = 'Room type name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
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
    let processedValue = value;
    
    // For text inputs, limit length
    if (name === 'typeName' && value.length > 50) {
      processedValue = value.substring(0, 50);
    } else if (name === 'description' && value.length > 500) {
      processedValue = value.substring(0, 500);
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
          Room Type Name *
        </label>
        <input
          type="text"
          name="typeName"
          value={formData.typeName}
          onChange={handleChange}
          maxLength={50}
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.typeName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter room type name (max 100 characters)"
        />
        <div className="flex justify-between">
          {errors.typeName ? (
            <p className="text-red-500 text-sm mt-1">{errors.typeName}</p>
          ) : (
            <div></div>
          )}
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formData.typeName.length}/50
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
          placeholder="Enter room type description (max 500 characters)"
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
          {roomType ? 'Update Room Type' : 'Create Room Type'}
        </Button>
      </div>
    </form>
  );
};