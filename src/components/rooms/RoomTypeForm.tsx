import React, { useState, useEffect } from 'react';
import { Button } from '../common/ui/Button';
import type { RoomType, RoomTypeRequest } from '../../types/room';

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
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
      [name]: value
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
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.typeName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter room type name"
        />
        {errors.typeName && (
          <p className="text-red-500 text-sm mt-1">{errors.typeName}</p>
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
          placeholder="Enter room type description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
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