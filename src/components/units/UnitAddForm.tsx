// components/units/UnitAddForm.tsx
import React, { useState, useEffect } from 'react';
import { branchApi } from '../../api/BranchAPI';
import { buildingApi } from '../../api/BuildingAPI';
import { levelApi } from '../../api/LevelAPI';
import { roomTypeApi, spaceTypeApi, hallTypeApi } from '../../api/UnitAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { type UtilityType, UnitType } from '../../types/unit';

interface UnitAddFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UnitAddForm: React.FC<UnitAddFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    unitNumber: '',
    unitType: UnitType.ROOM,
    hasMeter: true,
    levelId: '',
    roomTypeId: '',
    spaceTypeId: '',
    hallTypeId: '',
    unitSpace: '',
    rentalFee: '',
    branchId: '',
    buildingId: ''
  });

  const [selectedUtilityIds, setSelectedUtilityIds] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [branches, setBranches] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<any[]>([]);
  const [hallTypes, setHallTypes] = useState<any[]>([]);
  const [utilities, setUtilities] = useState<UtilityType[]>([]);
  
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);
  const [spaceTypesLoading, setSpaceTypesLoading] = useState(false);
  const [hallTypesLoading, setHallTypesLoading] = useState(false);
  const [utilitiesLoading, setUtilitiesLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setBranchesLoading(true);
      setRoomTypesLoading(true);
      setSpaceTypesLoading(true);
      setHallTypesLoading(true);
      setUtilitiesLoading(true);
      
      try {
        const [branchesData, roomTypesData, spaceTypesData, hallTypesData, utilitiesData] = await Promise.all([
          branchApi.getAllBranches(),
          roomTypeApi.getAll(),
          spaceTypeApi.getActive(),
          hallTypeApi.getActive(),
          utilityApi.getAll()
        ]);
        setBranches(branchesData.data);
        setRoomTypes(roomTypesData.data);
        setSpaceTypes(spaceTypesData.data);
        setHallTypes(hallTypesData.data);
        setUtilities(utilitiesData.data);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setBranchesLoading(false);
        setRoomTypesLoading(false);
        setSpaceTypesLoading(false);
        setHallTypesLoading(false);
        setUtilitiesLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load buildings when branchId changes
  useEffect(() => {
    if (formData.branchId) {
      loadBuildings(parseInt(formData.branchId));
    } else {
      setBuildings([]);
      setLevels([]);
      setFormData(prev => ({ ...prev, buildingId: '', levelId: '' }));
    }
  }, [formData.branchId]);

  // Load levels when buildingId changes
  useEffect(() => {
    if (formData.buildingId) {
      loadLevels(parseInt(formData.buildingId));
    } else {
      setLevels([]);
      setFormData(prev => ({ ...prev, levelId: '' }));
    }
  }, [formData.buildingId]);

  // Update hasMeter based on unitType
  useEffect(() => {
    const hasMeter = formData.unitType !== UnitType.SPACE;
    setFormData(prev => ({ ...prev, hasMeter }));
  }, [formData.unitType]);

  const loadBuildings = async (branchId: number) => {
    setBuildingsLoading(true);
    try {
      const response = await buildingApi.getBuildingsByBranch(branchId);
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
      setBuildings([]);
    } finally {
      setBuildingsLoading(false);
    }
  };

  const loadLevels = async (buildingId: number) => {
    setLevelsLoading(true);
    try {
      const response = await levelApi.getLevelsByBuilding(buildingId);
      setLevels(response.data);
    } catch (error) {
      console.error('Error loading levels:', error);
      setLevels([]);
    } finally {
      setLevelsLoading(false);
    }
  };

  const handleUtilityToggle = (utilityId: number) => {
    setSelectedUtilityIds(prev => 
      prev.includes(utilityId)
        ? prev.filter(id => id !== utilityId)
        : [...prev, utilityId]
    );
  };

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
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'Unit number is required';
    }

    if (!formData.levelId) {
      newErrors.levelId = 'Please select a level';
    }

    // Validate type-specific selection
    switch (formData.unitType) {
      case UnitType.ROOM:
        if (!formData.roomTypeId) {
          newErrors.roomTypeId = 'Please select a room type';
        }
        break;
      case UnitType.SPACE:
        if (!formData.spaceTypeId) {
          newErrors.spaceTypeId = 'Please select a space type';
        }
        break;
      case UnitType.HALL:
        if (!formData.hallTypeId) {
          newErrors.hallTypeId = 'Please select a hall type';
        }
        break;
    }

    if (!formData.unitSpace || parseFloat(formData.unitSpace) <= 0) {
      newErrors.unitSpace = 'Unit space must be greater than 0';
    }

    if (!formData.rentalFee || parseFloat(formData.rentalFee) < 0) {
      newErrors.rentalFee = 'Rental fee cannot be negative';
    }

    if (!formData.branchId) {
      newErrors.branchId = 'Please select a branch';
    }

    if (!formData.buildingId) {
      newErrors.buildingId = 'Please select a building';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Create FormData for file upload
      const submitFormData = new FormData();
      
      // Append all form fields
      submitFormData.append('unitNumber', formData.unitNumber);
      submitFormData.append('unitType', formData.unitType);
      submitFormData.append('hasMeter', formData.hasMeter.toString());
      submitFormData.append('levelId', formData.levelId);
      submitFormData.append('unitSpace', formData.unitSpace);
      submitFormData.append('rentalFee', formData.rentalFee);
      
      // Append type-specific ID
      switch (formData.unitType) {
        case UnitType.ROOM:
          submitFormData.append('roomTypeId', formData.roomTypeId);
          break;
        case UnitType.SPACE:
          submitFormData.append('spaceTypeId', formData.spaceTypeId);
          break;
        case UnitType.HALL:
          submitFormData.append('hallTypeId', formData.hallTypeId);
          break;
      }
      
      // Append utility type IDs
      selectedUtilityIds.forEach((utilityId) => {
        submitFormData.append('utilityTypeIds', utilityId.toString());
      });
      
      // Append selected images
      selectedImages.forEach((image) => {
        submitFormData.append('images', image);
      });

      console.log('Submitting unit data:', {
        unitType: formData.unitType,
        hasMeter: formData.hasMeter,
        utilityIds: selectedUtilityIds
      });

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

  const allLoading = branchesLoading || roomTypesLoading || spaceTypesLoading || hallTypesLoading || utilitiesLoading;

  if (allLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderTypeSpecificFields = () => {
    switch (formData.unitType) {
      case UnitType.ROOM:
        return (
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
        );

      case UnitType.SPACE:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Space Type *
            </label>
            <select
              name="spaceTypeId"
              value={formData.spaceTypeId}
              onChange={handleChange}
              required
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.spaceTypeId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Space Type</option>
              {spaceTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {errors.spaceTypeId && (
              <p className="text-red-500 text-sm mt-1">{errors.spaceTypeId}</p>
            )}
          </div>
        );

      case UnitType.HALL:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hall Type *
            </label>
            <select
              name="hallTypeId"
              value={formData.hallTypeId}
              onChange={handleChange}
              required
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.hallTypeId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Hall Type</option>
              {hallTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {errors.hallTypeId && (
              <p className="text-red-500 text-sm mt-1">{errors.hallTypeId}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Branch Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Branch *
        </label>
        <select
          name="branchId"
          value={formData.branchId}
          onChange={handleChange}
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.branchId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Branch</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>
              {branch.branchName}
            </option>
          ))}
        </select>
        {errors.branchId && (
          <p className="text-red-500 text-sm mt-1">{errors.branchId}</p>
        )}
      </div>

      {/* Building Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Building *
        </label>
        <select
          name="buildingId"
          value={formData.buildingId}
          onChange={handleChange}
          required
          disabled={!formData.branchId || buildingsLoading}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.buildingId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Building</option>
          {buildings.map(building => (
            <option key={building.id} value={building.id}>
              {building.buildingName}
            </option>
          ))}
        </select>
        {buildingsLoading && (
          <p className="text-blue-500 text-sm mt-1">Loading buildings...</p>
        )}
        {errors.buildingId && (
          <p className="text-red-500 text-sm mt-1">{errors.buildingId}</p>
        )}
      </div>

      {/* Level Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level *
        </label>
        <select
          name="levelId"
          value={formData.levelId}
          onChange={handleChange}
          required
          disabled={!formData.buildingId || levelsLoading}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.levelId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Level</option>
          {levels.map(level => (
            <option key={level.id} value={level.id}>
              {level.levelName} (Floor {level.levelNumber})
            </option>
          ))}
        </select>
        {levelsLoading && (
          <p className="text-blue-500 text-sm mt-1">Loading levels...</p>
        )}
        {errors.levelId && (
          <p className="text-red-500 text-sm mt-1">{errors.levelId}</p>
        )}
      </div>

      {/* Unit Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unit Number *
        </label>
        <input
          type="text"
          name="unitNumber"
          value={formData.unitNumber}
          onChange={handleChange}
          required
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.unitNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter unit number"
        />
        {errors.unitNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.unitNumber}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Type *
          </label>
          <select
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={UnitType.ROOM}>Room</option>
            <option value={UnitType.SPACE}>Space</option>
            <option value={UnitType.HALL}>Hall</option>
          </select>
        </div>

        {/* Has Meter (auto-set for SPACE) */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasMeter"
            name="hasMeter"
            checked={formData.hasMeter}
            onChange={(e) => setFormData(prev => ({ ...prev, hasMeter: e.target.checked }))}
            disabled={formData.unitType === UnitType.SPACE}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="hasMeter" className={`text-sm font-medium ${
            formData.unitType === UnitType.SPACE ? 'text-gray-400' : 'text-gray-700'
          }`}>
            Has Meter
            {formData.unitType === UnitType.SPACE && ' (Disabled for Spaces)'}
          </label>
        </div>
      </div>

      {/* Type-specific fields */}
      {renderTypeSpecificFields()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Space */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Space (sqm) *
          </label>
          <input
            type="number"
            name="unitSpace"
            value={formData.unitSpace}
            onChange={handleChange}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unitSpace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter unit space"
            min="0"
            step="0.1"
          />
          {errors.unitSpace && (
            <p className="text-red-500 text-sm mt-1">{errors.unitSpace}</p>
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
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {utilities.map(utility => (
            <div key={utility.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                id={`utility-${utility.id}`}
                checked={selectedUtilityIds.includes(utility.id)}
                onChange={() => handleUtilityToggle(utility.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor={`utility-${utility.id}`}
                  className="block text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {utility.utilityName}
                </label>
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
          ))}
        </div>
        {selectedUtilityIds.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {selectedUtilityIds.length} utility type(s) selected
          </p>
        )}
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Unit Images
        </label>
        
        {/* Image Upload Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="unit-images"
          />
          <label
            htmlFor="unit-images"
            className="cursor-pointer block"
          >
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">
              Click to upload images or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG up to 10MB each
            </p>
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Selected Images
            </h4>
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
            <p className="text-xs text-gray-500 mt-2">
              {selectedImages.length} image(s) selected
            </p>
          </div>
        )}
      </div>

      {/* Form Buttons */}
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
          Create Unit
        </Button>
      </div>
    </form>
  );
};