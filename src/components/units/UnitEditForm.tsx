// components/units/UnitEditForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { roomTypeApi, spaceTypeApi, hallTypeApi, unitApi } from '../../api/UnitAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { buildingApi } from '../../api/BuildingAPI';
import { levelApi } from '../../api/LevelAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { UnitType, type Unit, type UtilityType } from '../../types/unit';

interface UnitEditFormProps {
  unit: Unit;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UnitEditForm: React.FC<UnitEditFormProps> = ({ 
  unit, 
  onSubmit, 
  onCancel, 
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    unitNumber: '',
    unitType: UnitType.ROOM,
    hasMeter: true,
    roomTypeId: '',
    spaceTypeId: '',
    hallTypeId: '',
    unitSpace: '',
    rentalFee: '',
    levelId: '',
  });

  // 🔥 Use Set for utilities to automatically handle duplicates
  const [originalUtilityIds, setOriginalUtilityIds] = useState<Set<number>>(new Set());
  const [currentUtilityIds, setCurrentUtilityIds] = useState<Set<number>>(new Set());
  
  // New state for capacity validation
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [levelUnitsCount, setLevelUnitsCount] = useState<number>(0);
  const [buildingUsedArea, setBuildingUsedArea] = useState<number>(0);
  const [originalUnitSpace, setOriginalUnitSpace] = useState<number>(0);
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<any[]>([]);
  const [hallTypes, setHallTypes] = useState<any[]>([]);
  const [utilities, setUtilities] = useState<UtilityType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);
  const [spaceTypesLoading, setSpaceTypesLoading] = useState(false);
  const [hallTypesLoading, setHallTypesLoading] = useState(false);
  const [utilitiesLoading, setUtilitiesLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Uppercase unit number validation
  const validateUnitNumber = (value: string): string => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return 'Unit number is required';
    }
    
    // Check if it contains only valid characters (letters, numbers, dash, underscore)
    const isValidFormat = /^[A-Z0-9_-]+$/.test(trimmed);
    if (!isValidFormat) {
      return 'Unit number can only contain letters, numbers, dash (-) and underscore (_)';
    }
    
    // Check length
    if (trimmed.length > 20) {
      return 'Unit number cannot exceed 20 characters';
    }
    
    return '';
  };

  // Validate level capacity
  const validateLevelCapacity = (): boolean => {
    if (!selectedLevel || selectedLevel.totalUnits === null || selectedLevel.totalUnits === undefined) {
      return true; // No limit set
    }
    
    // Count existing units in this level (excluding current unit if level didn't change)
    const adjustedCount = formData.levelId === unit.level?.id?.toString() 
      ? Math.max(0, levelUnitsCount - 1) // Subtract current unit if it's in the same level
      : levelUnitsCount;
    
    if (adjustedCount >= selectedLevel.totalUnits) {
      setErrors(prev => ({
        ...prev,
        levelId: `Level is at full capacity. Maximum ${selectedLevel.totalUnits} units allowed. Current: ${adjustedCount} units.`
      }));
      return false;
    }
    
    return true;
  };

  // Validate building area capacity
  const validateBuildingArea = (unitSpace: number): boolean => {
    if (!selectedBuilding || selectedBuilding.totalLeasableArea === null || selectedBuilding.totalLeasableArea === undefined) {
      return true; // No limit set
    }
    
    // Adjust building used area: subtract original unit space if building didn't change, add new unit space
    let adjustedUsedArea = buildingUsedArea;
    
    if (formData.levelId === unit.level?.id?.toString()) {
      // Same building, subtract original unit space, add new unit space
      adjustedUsedArea = buildingUsedArea - originalUnitSpace + unitSpace;
    } else {
      // Different building, just add new unit space
      adjustedUsedArea = buildingUsedArea + unitSpace;
    }
    
    if (adjustedUsedArea > selectedBuilding.totalLeasableArea) {
      const availableArea = selectedBuilding.totalLeasableArea - buildingUsedArea;
      setErrors(prev => ({
        ...prev,
        unitSpace: `Exceeds building's leasable area. Available: ${availableArea.toFixed(2)} sqm, Required: ${unitSpace.toFixed(2)} sqm`
      }));
      return false;
    }
    
    return true;
  };

  // Load all data types
  useEffect(() => {
    const loadData = async () => {
      setRoomTypesLoading(true);
      setSpaceTypesLoading(true);
      setHallTypesLoading(true);
      setUtilitiesLoading(true);
      try {
        const [roomTypesData, spaceTypesData, hallTypesData, utilitiesData] = await Promise.all([
          roomTypeApi.getAll(),
          spaceTypeApi.getAll(),
          hallTypeApi.getAll(),
          utilityApi.getAll()
        ]);
        setRoomTypes(roomTypesData.data);
        setSpaceTypes(spaceTypesData.data);
        setHallTypes(hallTypesData.data);
        setUtilities(utilitiesData.data);
        
        // Load level and building info for validation
        if (unit.level?.id) {
          await fetchLevelAndBuildingInfo(unit.level.id);
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setRoomTypesLoading(false);
        setSpaceTypesLoading(false);
        setHallTypesLoading(false);
        setUtilitiesLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch level and building info for capacity validation
  const fetchLevelAndBuildingInfo = async (levelId: number) => {
    try {
      // Get level details
      const levelResponse = await levelApi.getById(levelId);
      setSelectedLevel(levelResponse.data);
      setFormData(prev => ({ ...prev, levelId: levelId.toString() }));
      
      // Get current units count in this level
      const unitsInLevelResponse = await unitApi.search({ levelId });
      const currentUnitsInLevel = unitsInLevelResponse.data
        .filter((u: any) => u.id !== unit.id) // Exclude current unit from count
        .length;
      setLevelUnitsCount(currentUnitsInLevel);
      
      // Get building details
      if (levelResponse.data?.buildingId) {
        const buildingResponse = await buildingApi.getById(levelResponse.data.buildingId);
        setSelectedBuilding(buildingResponse.data);
        
        // Get current units count in building for area calculation
        const unitsInBuildingResponse = await unitApi.search({ buildingId: levelResponse.data.buildingId });
        const totalArea = unitsInBuildingResponse.data
          .filter((u: any) => u.id !== unit.id) // Exclude current unit
          .reduce((sum: number, unitData: any) => 
            sum + (parseFloat(unitData.unitSpace) || 0), 0
          );
        setBuildingUsedArea(totalArea);
      }
    } catch (error) {
      console.error('Error fetching level/building info:', error);
    }
  };

  // Initialize form data from unit
  useEffect(() => {
    if (unit && dataLoaded) {
      console.log('Editing unit:', unit);
      
      // Ensure unit number is uppercase
      const unitNumber = unit.unitNumber ? unit.unitNumber.toUpperCase() : '';
      
      const initialData = {
        unitNumber: unitNumber,
        unitType: unit.unitType || UnitType.ROOM,
        hasMeter: unit.hasMeter !== undefined ? unit.hasMeter : unit.unitType !== UnitType.SPACE,
        roomTypeId: unit.roomType?.id?.toString() || '',
        spaceTypeId: unit.spaceType?.id?.toString() || '',
        hallTypeId: unit.hallType?.id?.toString() || '',
        unitSpace: unit.unitSpace?.toString() || '',
        rentalFee: unit.rentalFee?.toString() || '',
        levelId: unit.level?.id?.toString() || '',
      };
      
      setFormData(initialData);
      setExistingImages(unit.imageUrls || []);
      setImagesToRemove([]);
      
      // Store original unit space for validation
      const originalSpace = parseFloat(unit.unitSpace?.toString() || '0');
      setOriginalUnitSpace(originalSpace);
      
      // 🔥 FIXED: Use Set to automatically remove duplicates
      if (unit.utilities && unit.utilities.length > 0) {
        const utilityIds = unit.utilities.map(utility => utility.id);
        const uniqueUtilityIds = new Set(utilityIds); // Set automatically removes duplicates
        
        console.log('Raw utility IDs from unit:', utilityIds);
        console.log('Unique utility IDs (Set):', Array.from(uniqueUtilityIds));
        
        setOriginalUtilityIds(new Set(uniqueUtilityIds));
        setCurrentUtilityIds(new Set(uniqueUtilityIds));
      } else {
        console.log('No utilities found in unit data');
        setOriginalUtilityIds(new Set());
        setCurrentUtilityIds(new Set());
      }
    }
  }, [unit, dataLoaded]);

  // Update hasMeter based on unitType
  useEffect(() => {
    const hasMeter = formData.unitType !== UnitType.SPACE;
    setFormData(prev => ({ ...prev, hasMeter }));
  }, [formData.unitType]);

  // Re-validate when level changes
  useEffect(() => {
    if (formData.levelId && formData.levelId !== unit.level?.id?.toString()) {
      fetchLevelAndBuildingInfo(parseInt(formData.levelId));
    }
  }, [formData.levelId]);

  // Re-validate unit space when constraints change
  useEffect(() => {
    if (formData.unitSpace && (selectedLevel || selectedBuilding)) {
      validateUnitSpaceField(formData.unitSpace);
    }
  }, [selectedLevel, selectedBuilding]);

  // 🔥 FIXED: Use Set operations for changes
  const getUtilityChanges = useCallback(() => {
    const added = Array.from(currentUtilityIds).filter(id => !originalUtilityIds.has(id));
    const removed = Array.from(originalUtilityIds).filter(id => !currentUtilityIds.has(id));
    
    console.log('Utility changes - Added:', added, 'Removed:', removed);
    console.log('Original:', Array.from(originalUtilityIds), 'Current:', Array.from(currentUtilityIds));
    
    return { added, removed };
  }, [currentUtilityIds, originalUtilityIds]);

  // Check for duplicate unit number
  const checkDuplicateUnitNumber = async (unitNumber: string, levelId: string) => {
    if (!unitNumber || !levelId) return false;
    
    // Don't check if unit number hasn't changed and it's the same level
    if (unitNumber.toUpperCase() === unit.unitNumber.toUpperCase() && 
        levelId === unit.level?.id?.toString()) {
      return false;
    }
    
    setIsCheckingDuplicate(true);
    try {
      const response = await unitApi.checkDuplicate(unitNumber, parseInt(levelId));
      return response.data.exists;
    } catch (error) {
      console.error('Error checking duplicate unit number:', error);
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Unit space validation
  const validateUnitSpaceField = (value: string) => {
    const trimmed = value.trim();
    const space = parseFloat(trimmed);
    
    if (!trimmed) {
      setErrors(prev => ({ ...prev, unitSpace: 'Unit space is required' }));
      return false;
    }
    
    if (isNaN(space)) {
      setErrors(prev => ({ ...prev, unitSpace: 'Please enter a valid number' }));
      return false;
    }
    
    if (space <= 0) {
      setErrors(prev => ({ ...prev, unitSpace: 'Unit space must be greater than 0' }));
      return false;
    }
    
    if (space < 0.1) {
      setErrors(prev => ({ ...prev, unitSpace: 'Unit space must be at least 0.1 sqm' }));
      return false;
    }
    
    if (space > 10000) {
      setErrors(prev => ({ ...prev, unitSpace: 'Unit space cannot exceed 10000 sqm' }));
      return false;
    }
    
    // Check building area capacity
    if (!validateBuildingArea(space)) {
      return false;
    }
    
    // Clear error if all validations pass
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.unitSpace;
      return newErrors;
    });
    return true;
  };

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

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validate unit number
    const unitNumberError = validateUnitNumber(formData.unitNumber);
    if (unitNumberError) {
      newErrors.unitNumber = unitNumberError;
    } else if (formData.levelId) {
      // Check for duplicates
      const isDuplicate = await checkDuplicateUnitNumber(formData.unitNumber, formData.levelId);
      if (isDuplicate) {
        newErrors.unitNumber = 'Unit number already exists on this level';
      }
    }

    // Validate level capacity
    if (!formData.levelId) {
      newErrors.levelId = 'Please select a level';
    } else if (selectedLevel) {
      // Validate level capacity
      if (!validateLevelCapacity()) {
        newErrors.levelId = errors.levelId || '';
      }
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

    // Validate unit space
    const space = parseFloat(formData.unitSpace);
    if (!formData.unitSpace) {
      newErrors.unitSpace = 'Unit space is required';
    } else if (isNaN(space) || space <= 0) {
      newErrors.unitSpace = 'Unit space must be greater than 0';
    } else if (space < 0.1) {
      newErrors.unitSpace = 'Unit space must be at least 0.1 sqm';
    } else if (space > 10000) {
      newErrors.unitSpace = 'Unit space cannot exceed 10000 sqm';
    } else {
      // Validate building area capacity
      if (selectedBuilding && selectedBuilding.totalLeasableArea !== null && selectedBuilding.totalLeasableArea !== undefined) {
        if (!validateBuildingArea(space)) {
          newErrors.unitSpace = errors.unitSpace || '';
        }
      }
    }

    // Validate rental fee
    const rentalFee = parseFloat(formData.rentalFee);
    if (!formData.rentalFee) {
      newErrors.rentalFee = 'Rental fee is required';
    } else if (isNaN(rentalFee)) {
      newErrors.rentalFee = 'Please enter a valid rental fee';
    } else if (rentalFee < 0) {
      newErrors.rentalFee = 'Rental fee cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (isValid) {
      const submitFormData = new FormData();
      
      // Ensure unit number is uppercase before submission
      submitFormData.append('unitNumber', formData.unitNumber.toUpperCase());
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

      console.log('Submitting edit form data:', {
        unitNumber: formData.unitNumber.toUpperCase(),
        unitType: formData.unitType,
        hasMeter: formData.hasMeter,
        levelId: formData.levelId,
        utilities: finalUtilityIds
      });
      
      onSubmit(submitFormData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for unit number
    if (name === 'unitNumber') {
      // Convert to uppercase immediately
      const uppercaseValue = value.toUpperCase();
      
      setFormData(prev => ({
        ...prev,
        [name]: uppercaseValue
      }));

      // Validate unit number
      const unitNumberError = validateUnitNumber(uppercaseValue);
      setErrors(prev => ({
        ...prev,
        [name]: unitNumberError
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      // Special handling for unit space - validate immediately if value exists
      if (name === 'unitSpace' && value) {
        validateUnitSpaceField(value);
      }
    }
  };

  const handleUnitNumberBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const uppercaseValue = value.toUpperCase();
    
    // Ensure uppercase on blur
    if (value !== uppercaseValue) {
      setFormData(prev => ({
        ...prev,
        unitNumber: uppercaseValue
      }));
    }

    // Validate unit number on blur
    const unitNumberError = validateUnitNumber(uppercaseValue);
    if (unitNumberError) {
      setErrors(prev => ({
        ...prev,
        unitNumber: unitNumberError
      }));
      return;
    }

    // Check for duplicates when user leaves the field (only if valid)
    if (formData.levelId && uppercaseValue) {
      setIsCheckingDuplicate(true);
      try {
        const isDuplicate = await checkDuplicateUnitNumber(uppercaseValue, formData.levelId);
        if (isDuplicate) {
          setErrors(prev => ({
            ...prev,
            unitNumber: 'Unit number already exists on this level'
          }));
        } else {
          // Clear duplicate error if it exists
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.unitNumber === 'Unit number already exists on this level') {
              delete newErrors.unitNumber;
            }
            return newErrors;
          });
        }
      } catch (error) {
        console.error('Error checking duplicate:', error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }
  };

  const handleUnitSpaceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    validateUnitSpaceField(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { name } = e.currentTarget;
    
    if (name === 'unitNumber') {
      // Allow only alphanumeric, dash, underscore, and backspace
      const char = String.fromCharCode(e.charCode);
      if (!/^[A-Za-z0-9_-]$/.test(char) && e.charCode !== 0) {
        e.preventDefault();
      }
    }
  };

  const handleCancel = () => {
    console.log('Canceling - restoring original state');
    
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setSelectedImages([]);
    setImagePreviews([]);
    setImagesToRemove([]);
    setExistingImages(unit.imageUrls || []);
    setCurrentUtilityIds(new Set(originalUtilityIds)); // Restore original utilities
    
    onCancel();
  };

  const hasChanges = useCallback(() => {
    const { added, removed } = getUtilityChanges();
    return added.length > 0 || removed.length > 0 || 
           selectedImages.length > 0 || 
           imagesToRemove.length > 0 ||
           formData.unitNumber.toUpperCase() !== unit.unitNumber.toUpperCase() ||
           formData.unitType !== unit.unitType ||
           formData.hasMeter !== unit.hasMeter ||
           formData.roomTypeId !== unit.roomType?.id?.toString() ||
           formData.spaceTypeId !== unit.spaceType?.id?.toString() ||
           formData.hallTypeId !== unit.hallType?.id?.toString() ||
           formData.unitSpace !== unit.unitSpace?.toString() ||
           formData.rentalFee !== unit.rentalFee?.toString() ||
           formData.levelId !== unit.level?.id?.toString();
  }, [getUtilityChanges, selectedImages, imagesToRemove, formData, unit]);

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

  const { added, removed } = getUtilityChanges();

  if (roomTypesLoading || spaceTypesLoading || hallTypesLoading || utilitiesLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Branch:</span>
            <span className="ml-2 font-medium">{unit.level?.building?.branchName}</span>
          </div>
          <div>
            <span className="text-gray-500">Building:</span>
            <span className="ml-2 font-medium">{unit.level?.building?.buildingName}</span>
          </div>
          <div>
            <span className="text-gray-500">Floor:</span>
            <span className="ml-2 font-medium">{unit.level?.levelName} (Floor {unit.level?.levelNumber})</span>
          </div>
          <div>
            <span className="text-gray-500">Current Unit:</span>
            <span className="ml-2 font-medium">{unit.unitNumber.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-gray-500">Current Type:</span>
            <span className="ml-2 font-medium capitalize">{unit.unitType.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Level Selection with Capacity Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level *
        </label>
        <div className="relative">
          <input
            type="text"
            value={`${unit.level?.levelName || ''} (Floor ${unit.level?.levelNumber || ''})`}
            readOnly
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
          />
          <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
            <span className="text-gray-500 text-sm">Cannot change level</span>
          </div>
        </div>
        <input type="hidden" name="levelId" value={formData.levelId} />
        
        {/* Level capacity info */}
        {selectedLevel && selectedLevel.totalUnits !== null && selectedLevel.totalUnits !== undefined && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Level Capacity:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{levelUnitsCount}/{selectedLevel.totalUnits} units</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${Math.min((levelUnitsCount / selectedLevel.totalUnits) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            {levelUnitsCount >= selectedLevel.totalUnits && (
              <p className="text-red-600 text-xs mt-1">Level is at full capacity!</p>
            )}
          </div>
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
        <div className="relative">
          <input
            type="text"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleChange}
            onBlur={handleUnitNumberBlur}
            onKeyPress={handleKeyPress}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
              errors.unitNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter unit number (e.g., A-101, B_202)"
            style={{ textTransform: 'uppercase' }}
            maxLength={20}
            disabled={isCheckingDuplicate}
          />
          {isCheckingDuplicate && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">
            Use letters, numbers, dash (-) or underscore (_). Will be converted to uppercase.
          </p>
          <span className="text-xs text-gray-400">
            {formData.unitNumber.length}/20
          </span>
        </div>
        {errors.unitNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.unitNumber}</p>
        )}
        {!errors.unitNumber && formData.unitNumber && (
          <p className="text-green-500 text-sm mt-1">✓ Unit number format is valid</p>
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
            onBlur={handleUnitSpaceBlur}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unitSpace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter unit space"
            min="0.1"
            step="0.1"
          />
          
          {/* Building area capacity info */}
          {selectedBuilding && selectedBuilding.totalLeasableArea !== null && selectedBuilding.totalLeasableArea !== undefined && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-700">Building Leasable Area:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {(selectedBuilding.totalLeasableArea - buildingUsedArea).toFixed(2)}/{selectedBuilding.totalLeasableArea} sqm available
                  </span>
                </div>
              </div>
              <div className="mt-1 text-xs text-blue-600">
                Currently used: {buildingUsedArea.toFixed(2)} sqm
                {originalUnitSpace > 0 && (
                  <span className="ml-2">(Current unit: {originalUnitSpace.toFixed(2)} sqm)</span>
                )}
              </div>
            </div>
          )}
          
          {errors.unitSpace && (
            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.unitSpace}
              </p>
            </div>
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
            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.rentalFee}
              </p>
            </div>
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

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Unit Images
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
                    alt={`Unit ${index + 1}`}
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
              These images will be permanently deleted when you click "Update Unit"
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
            id="unit-images"
          />
          <label
            htmlFor="unit-images"
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
          disabled={isLoading || !hasChanges() || isCheckingDuplicate}
        >
          Update Unit
        </Button>
      </div>
    </form>
  );
};