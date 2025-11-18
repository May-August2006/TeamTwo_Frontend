// components/rooms/RoomEditForm.tsx (Complete Fixed Version)
import React, { useState, useEffect } from 'react';
import { roomTypeApi } from '../../api/RoomAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { Room } from '../../types/room';

interface RoomEditFormProps {
  room: Room;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RoomEditForm: React.FC<RoomEditFormProps> = ({ 
  room, 
  onSubmit, 
  onCancel, 
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomTypeId: '',
    roomSpace: '',
    meterType: 'ELECTRICITY',
    rentalFee: '',
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load room types
  useEffect(() => {
    const loadRoomTypes = async () => {
      setTypesLoading(true);
      try {
        const response = await roomTypeApi.getAll();
        setRoomTypes(response.data);
      } catch (error) {
        console.error('Error loading room types:', error);
      } finally {
        setTypesLoading(false);
      }
    };

    loadRoomTypes();
  }, []);

  // Set initial data when component mounts
  useEffect(() => {
    if (room) {
      console.log('Editing room:', room);
      
      const initialData = {
        roomNumber: room.roomNumber || '',
        roomTypeId: room.roomType?.id?.toString() || '',
        roomSpace: room.roomSpace?.toString() || '',
        meterType: room.meterType || 'ELECTRICITY',
        rentalFee: room.rentalFee?.toString() || '',
      };
      
      setFormData(initialData);
      setExistingImages(room.imageUrls || []);
      setImagesToRemove([]);
    }
  }, [room]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    setSelectedImages(prev => [...prev, ...newImages]);

    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Mark image for removal (only remove on submit)
  const markImageForRemoval = (index: number) => {
    const imageUrlToRemove = existingImages[index];
    
    if (!imageUrlToRemove) return;

    // Add to removal list and remove from display
    setImagesToRemove(prev => [...prev, imageUrlToRemove]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Restore removed image
  const restoreImage = (imageUrl: string, index: number) => {
    setImagesToRemove(prev => prev.filter(url => url !== imageUrl));
    setExistingImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 0, imageUrl);
      return newImages;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }

    if (!formData.roomTypeId) {
      newErrors.roomTypeId = 'Please select a room type';
    }

    if (!formData.roomSpace || parseFloat(formData.roomSpace) <= 0) {
      newErrors.roomSpace = 'Room space must be greater than 0';
    }

    if (!formData.rentalFee || parseFloat(formData.rentalFee) < 0) {
      newErrors.rentalFee = 'Rental fee cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Create FormData for file upload
      const submitFormData = new FormData();
      
      // Append all required fields including levelId
      submitFormData.append('roomNumber', formData.roomNumber);
      submitFormData.append('levelId', room.level?.id?.toString() || '');
      submitFormData.append('roomTypeId', formData.roomTypeId);
      submitFormData.append('roomSpace', formData.roomSpace);
      submitFormData.append('meterType', formData.meterType);
      submitFormData.append('rentalFee', formData.rentalFee);
      
      // Append selected images
      selectedImages.forEach((image) => {
        submitFormData.append('images', image);
      });

      // Append images to remove (as JSON string)
      if (imagesToRemove.length > 0) {
        submitFormData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      console.log('Submitting edit form data:');
      console.log('Images to remove:', imagesToRemove);
      
      // Submit FormData
      onSubmit(submitFormData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Reset form when canceling
  const handleCancel = () => {
    // Clean up preview URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    // Reset all state
    setSelectedImages([]);
    setImagePreviews([]);
    setImagesToRemove([]);
    
    // Call the original onCancel
    onCancel();
  };

  if (typesLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Location Info (Read-only) */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Location Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Branch:</span>
            <span className="ml-2 font-medium">{room.level?.building?.branchName}</span>
          </div>
          <div>
            <span className="text-gray-500">Building:</span>
            <span className="ml-2 font-medium">{room.level?.building?.buildingName}</span>
          </div>
          <div>
            <span className="text-gray-500">Level:</span>
            <span className="ml-2 font-medium">{room.level?.levelName} (Floor {room.level?.levelNumber})</span>
          </div>
          <div>
            <span className="text-gray-500">Current Room:</span>
            <span className="ml-2 font-medium">{room.roomNumber}</span>
          </div>
        </div>
      </div>

      {/* Room Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Room Number *
        </label>
        <input
          type="text"
          name="roomNumber"
          value={formData.roomNumber}
          onChange={handleChange}
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.roomNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter room number"
        />
        {errors.roomNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Type *
          </label>
          <select
            name="roomTypeId"
            value={formData.roomTypeId}
            onChange={handleChange}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.roomTypeId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Room Type</option>
            {roomTypes.map(type => (
              <option key={type.id} value={type.id}>{type.typeName}</option>
            ))}
          </select>
          {errors.roomTypeId && (
            <p className="text-red-500 text-sm mt-1">{errors.roomTypeId}</p>
          )}
        </div>

        {/* Meter Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meter Type *
          </label>
          <select
            name="meterType"
            value={formData.meterType}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ELECTRICITY">Electricity</option>
            <option value="WATER">Water</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room Space */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Space (sqm) *
          </label>
          <input
            type="number"
            name="roomSpace"
            value={formData.roomSpace}
            onChange={handleChange}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.roomSpace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter room space"
            min="0"
            step="0.1"
          />
          {errors.roomSpace && (
            <p className="text-red-500 text-sm mt-1">{errors.roomSpace}</p>
          )}
        </div>

        {/* Rental Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rental Fee (MMK) *
          </label>
          <input
            type="number"
            name="rentalFee"
            value={formData.rentalFee}
            onChange={handleChange}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.rentalFee ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter rental fee"
            min="0"
            step="0.01"
          />
          {errors.rentalFee && (
            <p className="text-red-500 text-sm mt-1">{errors.rentalFee}</p>
          )}
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Room Images
        </label>
        
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((imageUrl, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Room ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => markImageForRemoval(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images marked for removal */}
        {imagesToRemove.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Images to be removed ({imagesToRemove.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagesToRemove.map((imageUrl, index) => (
                <div key={`removed-${index}`} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`To remove ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => restoreImage(imageUrl, index)}
                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  >
                    ↶
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              These images will be permanently deleted when you click "Update Room"
            </p>
          </div>
        )}

        {/* Add New Images */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="room-images"
          />
          <label
            htmlFor="room-images"
            className="cursor-pointer block"
          >
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">
              Click to add more images
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG up to 10MB each
            </p>
          </label>
        </div>

        {/* New Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">New Images to Add</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={`preview-${index}`} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          onClick={handleCancel}
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
          Update Room
        </Button>
      </div>
    </form>
  );
};