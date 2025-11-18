// components/rooms/RoomEditForm.tsx (COMPLETELY FIXED - No more duplicates)
import React, { useState, useEffect, useCallback } from 'react';
import { roomTypeApi } from '../../api/RoomAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../manager/LoadingSpinner';
import type { Room, UtilityType } from '../../types/room';

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
    rentalFee: '',
  });

  // 🔥 COMPLETELY FIXED: Use Set for utilities to automatically handle duplicates
  const [originalUtilityIds, setOriginalUtilityIds] = useState<Set<number>>(new Set());
  const [currentUtilityIds, setCurrentUtilityIds] = useState<Set<number>>(new Set());
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [utilities, setUtilities] = useState<UtilityType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [utilitiesLoading, setUtilitiesLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load room types and utilities
  useEffect(() => {
    const loadData = async () => {
      setTypesLoading(true);
      setUtilitiesLoading(true);
      try {
        const [typesData, utilitiesData] = await Promise.all([
          roomTypeApi.getAll(),
          utilityApi.getAll()
        ]);
        setRoomTypes(typesData.data);
        setUtilities(utilitiesData.data);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setTypesLoading(false);
        setUtilitiesLoading(false);
      }
    };

    loadData();
  }, []);

  // 🔥 COMPLETELY FIXED: Properly handle utility IDs with Set
  useEffect(() => {
    if (room && dataLoaded) {
      console.log('Editing room:', room);
      console.log('Room utilities:', room.utilities);
      
      const initialData = {
        roomNumber: room.roomNumber || '',
        roomTypeId: room.roomType?.id?.toString() || '',
        roomSpace: room.roomSpace?.toString() || '',
        rentalFee: room.rentalFee?.toString() || '',
      };
      
      setFormData(initialData);
      setExistingImages(room.imageUrls || []);
      setImagesToRemove([]);
      
      // 🔥 FIXED: Use Set to automatically remove duplicates
      if (room.utilities && room.utilities.length > 0) {
        const utilityIds = room.utilities.map(utility => utility.id);
        const uniqueUtilityIds = new Set(utilityIds); // Set automatically removes duplicates
        
        console.log('Raw utility IDs from room:', utilityIds);
        console.log('Unique utility IDs (Set):', Array.from(uniqueUtilityIds));
        
        setOriginalUtilityIds(new Set(uniqueUtilityIds));
        setCurrentUtilityIds(new Set(uniqueUtilityIds));
      } else {
        console.log('No utilities found in room data');
        setOriginalUtilityIds(new Set());
        setCurrentUtilityIds(new Set());
      }
    }
  }, [room, dataLoaded]);

  // 🔥 FIXED: Use Set operations for changes
  const getUtilityChanges = useCallback(() => {
    const added = Array.from(currentUtilityIds).filter(id => !originalUtilityIds.has(id));
    const removed = Array.from(originalUtilityIds).filter(id => !currentUtilityIds.has(id));
    
    console.log('Utility changes - Added:', added, 'Removed:', removed);
    console.log('Original:', Array.from(originalUtilityIds), 'Current:', Array.from(currentUtilityIds));
    
    return { added, removed };
  }, [currentUtilityIds, originalUtilityIds]);

  // 🔥 FIXED: Proper Set operations for toggling
  const handleUtilityToggle = (utilityId: number) => {
    setCurrentUtilityIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(utilityId)) {
        newSet.delete(utilityId);
      } else {
        newSet.add(utilityId);
      }
      console.log('Utility toggled. New selection:', Array.from(newSet));
      return newSet;
    });
  };

  // 🔥 FIXED: Check if utility is selected using Set
  const isUtilitySelected = (utilityId: number): boolean => {
    return currentUtilityIds.has(utilityId);
  };

  // 🔥 FIXED: Check if utility was originally selected using Set
  const wasUtilityOriginallySelected = (utilityId: number): boolean => {
    return originalUtilityIds.has(utilityId);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    setSelectedImages(prev => [...prev, ...newImages]);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForRemoval = (index: number) => {
    const imageUrlToRemove = existingImages[index];
    
    if (!imageUrlToRemove) return;

    setImagesToRemove(prev => [...prev, imageUrlToRemove]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

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
      const submitFormData = new FormData();
      
      submitFormData.append('roomNumber', formData.roomNumber);
      submitFormData.append('levelId', room.level?.id?.toString() || '');
      submitFormData.append('roomTypeId', formData.roomTypeId);
      submitFormData.append('roomSpace', formData.roomSpace);
      submitFormData.append('rentalFee', formData.rentalFee);
      
      // 🔥 FIXED: Convert Set to array for submission
      const finalUtilityIds = Array.from(currentUtilityIds);
      finalUtilityIds.forEach((utilityId) => {
        submitFormData.append('utilityTypeIds', utilityId.toString());
      });
      
      selectedImages.forEach((image) => {
        submitFormData.append('images', image);
      });

      if (imagesToRemove.length > 0) {
        submitFormData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      console.log('Submitting edit form data:');
      console.log('Final utility selection:', finalUtilityIds);
      console.log('Original utilities:', Array.from(originalUtilityIds));
      console.log('Utility changes:', getUtilityChanges());
      
      onSubmit(submitFormData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCancel = () => {
    console.log('Canceling - restoring original state');
    
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setSelectedImages([]);
    setImagePreviews([]);
    setImagesToRemove([]);
    setExistingImages(room.imageUrls || []);
    setCurrentUtilityIds(new Set(originalUtilityIds)); // Restore original utilities
    
    onCancel();
  };

  const hasChanges = useCallback(() => {
    const { added, removed } = getUtilityChanges();
    return added.length > 0 || removed.length > 0 || 
           selectedImages.length > 0 || 
           imagesToRemove.length > 0 ||
           formData.roomNumber !== room.roomNumber ||
           formData.roomTypeId !== room.roomType?.id?.toString() ||
           formData.roomSpace !== room.roomSpace?.toString() ||
           formData.rentalFee !== room.rentalFee?.toString();
  }, [getUtilityChanges, selectedImages, imagesToRemove, formData, room]);

  if (typesLoading || utilitiesLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { added, removed } = getUtilityChanges();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Changes Indicator */}
      {hasChanges() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-blue-700 font-medium">You have unsaved changes</span>
          </div>
          {(added.length > 0 || removed.length > 0) && (
            <div className="mt-2 text-sm text-blue-600">
              {added.length > 0 && <span>{added.length} utility(s) added </span>}
              {removed.length > 0 && <span>{removed.length} utility(s) removed</span>}
            </div>
          )}
        </div>
      )}

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

        <div></div>
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

      {/* Utility Types Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Utilities
          {added.length > 0 || removed.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-blue-600">
              ({added.length} added, {removed.length} removed)
            </span>
          ) : null}
        </label>
        {utilities.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No utilities available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {utilities.map(utility => {
                // 🔥 FIXED: Use Set methods for checking selection status
                const isOriginallySelected = wasUtilityOriginallySelected(utility.id);
                const isCurrentlySelected = isUtilitySelected(utility.id);
                const isAdded = !isOriginallySelected && isCurrentlySelected;
                const isRemoved = isOriginallySelected && !isCurrentlySelected;
                
                return (
                  <div 
                    key={`utility-${utility.id}`}
                    className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                      isCurrentlySelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${isAdded ? 'ring-2 ring-green-200' : ''} ${isRemoved ? 'ring-2 ring-red-200' : ''}`}
                  >
                    <input
                      type="checkbox"
                      id={`utility-${utility.id}`}
                      checked={isCurrentlySelected}
                      onChange={() => handleUtilityToggle(utility.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <label 
                          htmlFor={`utility-${utility.id}`}
                          className="block text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {utility.utilityName}
                        </label>
                        {isAdded && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Added
                          </span>
                        )}
                        {isRemoved && (
                          <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Removed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {utility.description}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-600">
                        <span className="font-medium">
                          {utility.ratePerUnit?.toLocaleString() || '0'} MMK
                        </span>
                        <span className="mx-2">•</span>
                        <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {utility.calculationMethod?.toLowerCase() || 'fixed'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {currentUtilityIds.size > 0 && (
              <p className="text-sm text-green-600 mt-2">
                {currentUtilityIds.size} utility type(s) selected
              </p>
            )}
          </>
        )}
      </div>

      {/* Rest of the image upload section remains the same */}
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
          disabled={isLoading || !hasChanges()}
        >
          Update Room
        </Button>
      </div>
    </form>
  );
};