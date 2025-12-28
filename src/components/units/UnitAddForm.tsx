// components/units/UnitAddForm.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { branchApi } from '../../api/BranchAPI';
import { buildingApi } from '../../api/BuildingAPI';
import { levelApi } from '../../api/LevelAPI';
import { roomTypeApi, spaceTypeApi, hallTypeApi, unitApi } from '../../api/UnitAPI';
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    unitNumber: 'UN-',
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
  const [rentalFeePreview, setRentalFeePreview] = useState<string>('');
  const [selectedSpaceType, setSelectedSpaceType] = useState<any>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  const [selectedHallType, setSelectedHallType] = useState<any>(null);
  
  // New state for capacity validation
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [levelUnitsCount, setLevelUnitsCount] = useState<number>(0);
  const [buildingUsedArea, setBuildingUsedArea] = useState<number>(0);

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
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Add this constant for image limit
  const MAX_IMAGES = 5;

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
      setSelectedBuilding(null);
      setSelectedLevel(null);
      setBuildingUsedArea(0);
      setLevelUnitsCount(0);
    }
  }, [formData.branchId]);

  // Load levels and building info when buildingId changes
  useEffect(() => {
    if (formData.buildingId) {
      loadLevels(parseInt(formData.buildingId));
    } else {
      setLevels([]);
      setFormData(prev => ({ ...prev, levelId: '' }));
      setSelectedLevel(null);
      setSelectedBuilding(null);
      setBuildingUsedArea(0);
      setLevelUnitsCount(0);
    }
  }, [formData.buildingId]);

  // Update hasMeter based on unitType
  useEffect(() => {
    const hasMeter = formData.unitType !== UnitType.SPACE;
    setFormData(prev => ({ ...prev, hasMeter }));
  }, [formData.unitType]);

  // Fetch space type details when spaceTypeId changes
  useEffect(() => {
    if (formData.unitType === UnitType.SPACE && formData.spaceTypeId) {
      fetchSpaceTypeDetails(parseInt(formData.spaceTypeId));
    } else {
      setSelectedSpaceType(null);
    }
  }, [formData.spaceTypeId, formData.unitType]);

  // Fetch room type details when roomTypeId changes
  useEffect(() => {
    if (formData.unitType === UnitType.ROOM && formData.roomTypeId) {
      const roomType = roomTypes.find(rt => rt.id === parseInt(formData.roomTypeId));
      setSelectedRoomType(roomType || null);
    } else {
      setSelectedRoomType(null);
    }
  }, [formData.roomTypeId, formData.unitType, roomTypes]);

  // Fetch hall type details when hallTypeId changes
  useEffect(() => {
    if (formData.unitType === UnitType.HALL && formData.hallTypeId) {
      const hallType = hallTypes.find(ht => ht.id === parseInt(formData.hallTypeId));
      setSelectedHallType(hallType || null);
    } else {
      setSelectedHallType(null);
    }
  }, [formData.hallTypeId, formData.unitType, hallTypes]);

  // Calculate rental fee when unit space or type-specific data changes
  useEffect(() => {
    calculateRentalFee();
  }, [formData.unitSpace, formData.unitType, selectedSpaceType, selectedRoomType, selectedHallType]);

  // Re-validate unit space when constraints change
  useEffect(() => {
    if (formData.unitSpace && (selectedSpaceType || selectedRoomType || selectedHallType || selectedLevel || selectedBuilding)) {
      validateUnitSpaceField(formData.unitSpace);
    }
  }, [selectedSpaceType, selectedRoomType, selectedHallType, selectedLevel, selectedBuilding]);

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
      // Load levels for this building
      const response = await levelApi.getLevelsByBuilding(buildingId);
      setLevels(response.data);
      
      // Also load the building details for area validation
      const buildingResponse = await buildingApi.getById(buildingId);
      setSelectedBuilding(buildingResponse.data);
      
      // Get current units count in building for area calculation
      const unitsResponse = await unitApi.search({ buildingId });
      const totalArea = unitsResponse.data.reduce((sum: number, unit: any) => 
        sum + (unit.unitSpace || 0), 0
      );
      setBuildingUsedArea(totalArea);
    } catch (error) {
      console.error('Error loading levels:', error);
      setLevels([]);
      setSelectedBuilding(null);
      setBuildingUsedArea(0);
    } finally {
      setLevelsLoading(false);
    }
  };

  // Fetch level details and count units in that level
  const fetchLevelDetails = async (levelId: number) => {
    try {
      const response = await levelApi.getById(levelId);
      setSelectedLevel(response.data);
      
      // Get current units count in this level
      const unitsResponse = await unitApi.search({ levelId });
      setLevelUnitsCount(unitsResponse.data.length);
    } catch (error) {
      console.error('Error fetching level details:', error);
      setSelectedLevel(null);
      setLevelUnitsCount(0);
    }
  };

  const fetchSpaceTypeDetails = async (spaceTypeId: number) => {
    try {
      const response = await spaceTypeApi.getById(spaceTypeId);
      setSelectedSpaceType(response.data);
    } catch (error) {
      console.error('Error fetching space type details:', error);
      setSelectedSpaceType(null);
    }
  };

  // Validate unit number with UN- prefix format
  const validateUnitNumber = (value: string): string => {
    const trimmed = value.trim().toUpperCase();
    
    if (!trimmed) {
      return t('unit.errors.unitNumberRequired');
    }
    
    // Check for UN- prefix
    if (!trimmed.startsWith('UN-')) {
      return t('unit.errors.unitNumberPrefix');
    }
    
    // Check for UN- prefix and number format
    const isValidFormat = /^UN-\d{1,3}$/.test(trimmed);
    if (!isValidFormat) {
      return t('unit.errors.unitNumberFormat');
    }
    
    // Extract the number part
    const numberPart = trimmed.substring(3);
    if (numberPart === '') {
      return t('unit.errors.unitNumberBetween');
    }
    
    const number = parseInt(numberPart, 10);
    
    // Check if number is between 1 and 999
    if (number < 1 || number > 999) {
      return t('unit.errors.unitNumberRange');
    }
    
    return '';
  };

  // Validate level capacity
  const validateLevelCapacity = (): boolean => {
    if (!selectedLevel || selectedLevel.totalUnits === null || selectedLevel.totalUnits === undefined) {
      return true; // No limit set
    }
    
    if (levelUnitsCount >= selectedLevel.totalUnits) {
      setErrors(prev => ({
        ...prev,
        levelId: t('unit.errors.levelFullCapacity', {
          maxUnits: selectedLevel.totalUnits,
          currentUnits: levelUnitsCount
        })
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
    
    const newTotalArea = buildingUsedArea + unitSpace;
    
    if (newTotalArea > selectedBuilding.totalLeasableArea) {
      const availableArea = selectedBuilding.totalLeasableArea - buildingUsedArea;
      setErrors(prev => ({
        ...prev,
        unitSpace: t('unit.errors.buildingAreaExceeded', {
          available: availableArea.toFixed(2),
          required: unitSpace.toFixed(2)
        })
      }));
      return false;
    }
    
    return true;
  };

  // Unit space validation
  const validateUnitSpaceField = (value: string) => {
    const trimmed = value.trim();
    const space = parseFloat(trimmed);
    
    if (!trimmed) {
      setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.unitSpaceRequired') }));
      return false;
    }
    
    if (isNaN(space)) {
      setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.unitSpaceValid') }));
      return false;
    }
    
    if (space <= 0) {
      setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.unitSpaceGreaterThanZero') }));
      return false;
    }
    
    if (space < 0.1) {
      setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.unitSpaceMin') }));
      return false;
    }
    
    if (space > 10000) {
      setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.unitSpaceMax') }));
      return false;
    }
    
    // Check space type constraints
    if (formData.unitType === UnitType.SPACE && formData.spaceTypeId && selectedSpaceType) {
      if (selectedSpaceType.minSpace > 0 && space < selectedSpaceType.minSpace) {
        setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.minSpaceRequired', { minSpace: selectedSpaceType.minSpace }) }));
        return false;
      }
      
      if (selectedSpaceType.maxSpace > 0 && space > selectedSpaceType.maxSpace) {
        setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.maxSpaceAllowed', { maxSpace: selectedSpaceType.maxSpace }) }));
        return false;
      }
    }

    // Check room type constraints
    if (formData.unitType === UnitType.ROOM && formData.roomTypeId && selectedRoomType) {
      if (selectedRoomType.minSpace > 0 && space < selectedRoomType.minSpace) {
        setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.minSpaceRequired', { minSpace: selectedRoomType.minSpace }) }));
        return false;
      }
      
      if (selectedRoomType.maxSpace > 0 && space > selectedRoomType.maxSpace) {
        setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.maxSpaceAllowed', { maxSpace: selectedRoomType.maxSpace }) }));
        return false;
      }
    }

    // Check hall type constraints
    if (formData.unitType === UnitType.HALL && formData.hallTypeId && selectedHallType) {
      if (selectedHallType.minSpace > 0 && space < selectedHallType.minSpace) {
        setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.minSpaceRequired', { minSpace: selectedHallType.minSpace }) }));
        return false;
      }
      
      if (selectedHallType.maxSpace > 0 && space > selectedHallType.maxSpace) {
        setErrors(prev => ({ ...prev, unitSpace: t('unit.errors.maxSpaceAllowed', { maxSpace: selectedHallType.maxSpace }) }));
        return false;
      }
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

  // Check for duplicate unit number
  const checkDuplicateUnitNumber = async (unitNumber: string, levelId: string) => {
    if (!unitNumber || !levelId) return false;
    
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

  const calculateRentalFee = () => {
    const space = parseFloat(formData.unitSpace);
    
    if (!formData.unitSpace || isNaN(space) || space <= 0) {
      setRentalFeePreview('');
      if (formData.unitType === UnitType.SPACE) {
        setFormData(prev => ({ ...prev, rentalFee: '' }));
      }
      return;
    }

    let calculatedFee = '';

    switch (formData.unitType) {
      case UnitType.SPACE:
        if (selectedSpaceType?.basePricePerSqm) {
          const basePrice = parseFloat(selectedSpaceType.basePricePerSqm);
          if (!isNaN(basePrice) && basePrice >= 0) {
            calculatedFee = (space * basePrice).toFixed(2);
          }
        }
        break;

      case UnitType.ROOM:
        if (selectedRoomType?.basePrice) {
          const basePrice = parseFloat(selectedRoomType.basePrice);
          if (!isNaN(basePrice) && basePrice >= 0) {
            calculatedFee = (space * basePrice).toFixed(2);
          }
        }
        break;

      case UnitType.HALL:
        if (selectedHallType?.basePrice) {
          const basePrice = parseFloat(selectedHallType.basePrice);
          if (!isNaN(basePrice) && basePrice >= 0) {
            calculatedFee = (space * basePrice).toFixed(2);
          }
        }
        break;
    }

    setRentalFeePreview(calculatedFee);
    
    // Auto-fill rental fee for Space type only (optional)
    if (formData.unitType === UnitType.SPACE && calculatedFee) {
      setFormData(prev => ({ ...prev, rentalFee: calculatedFee }));
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
    
    // Check if adding new images would exceed the limit
    const totalImagesAfterAddition = selectedImages.length + newImages.length;
    if (totalImagesAfterAddition > MAX_IMAGES) {
      alert(t('unit.errors.imageLimitExceeded', {
        maxImages: MAX_IMAGES,
        existingImages: 0,
        selectedImages: selectedImages.length
      }));
      e.target.value = ''; // Reset the file input
      return;
    }

    setSelectedImages(prev => [...prev, ...newImages]);

    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Reset the file input
    e.target.value = '';
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validate unit number
    const unitNumberError = validateUnitNumber(formData.unitNumber);
    if (unitNumberError) {
      newErrors.unitNumber = unitNumberError;
    } else if (formData.levelId) {
      // Check for duplicates - only within same level
      const isDuplicate = await checkDuplicateUnitNumber(formData.unitNumber, formData.levelId);
      if (isDuplicate) {
        newErrors.unitNumber = t('unit.errors.unitNumberDuplicateFloor');
      }
    }

    if (!formData.levelId) {
      newErrors.levelId = t('unit.errors.floorRequired');
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
          newErrors.roomTypeId = t('unit.errors.roomTypeRequired');
        }
        break;
      case UnitType.SPACE:
        if (!formData.spaceTypeId) {
          newErrors.spaceTypeId = t('unit.errors.spaceTypeRequired');
        }
        break;
      case UnitType.HALL:
        if (!formData.hallTypeId) {
          newErrors.hallTypeId = t('unit.errors.hallTypeRequired');
        }
        break;
    }

    // Validate unit space
    const space = parseFloat(formData.unitSpace);
    if (!formData.unitSpace) {
      newErrors.unitSpace = t('unit.errors.unitSpaceRequired');
    } else if (isNaN(space) || space <= 0) {
      newErrors.unitSpace = t('unit.errors.unitSpaceGreaterThanZero');
    } else if (space < 0.1) {
      newErrors.unitSpace = t('unit.errors.unitSpaceMin');
    } else if (space > 10000) {
      newErrors.unitSpace = t('unit.errors.unitSpaceMax');
    } else {
      // For SPACE type, validate against space type constraints
      if (formData.unitType === UnitType.SPACE && formData.spaceTypeId && selectedSpaceType) {
        if (selectedSpaceType.minSpace > 0 && space < selectedSpaceType.minSpace) {
          newErrors.unitSpace = t('unit.errors.minSpaceRequired', { minSpace: selectedSpaceType.minSpace });
        }
        
        if (selectedSpaceType.maxSpace > 0 && space > selectedSpaceType.maxSpace) {
          newErrors.unitSpace = t('unit.errors.maxSpaceAllowed', { maxSpace: selectedSpaceType.maxSpace });
        }
      }

      // For ROOM type, validate against room type constraints if they exist
      if (formData.unitType === UnitType.ROOM && formData.roomTypeId && selectedRoomType) {
        if (selectedRoomType.minSpace > 0 && space < selectedRoomType.minSpace) {
          newErrors.unitSpace = t('unit.errors.minSpaceRequired', { minSpace: selectedRoomType.minSpace });
        }
        
        if (selectedRoomType.maxSpace > 0 && space > selectedRoomType.maxSpace) {
          newErrors.unitSpace = t('unit.errors.maxSpaceAllowed', { maxSpace: selectedRoomType.maxSpace });
        }
      }

      // For HALL type, validate against hall type constraints if they exist
      if (formData.unitType === UnitType.HALL && formData.hallTypeId && selectedHallType) {
        if (selectedHallType.minSpace > 0 && space < selectedHallType.minSpace) {
          newErrors.unitSpace = t('unit.errors.minSpaceRequired', { minSpace: selectedHallType.minSpace });
        }
        
        if (selectedHallType.maxSpace > 0 && space > selectedHallType.maxSpace) {
          newErrors.unitSpace = t('unit.errors.maxSpaceAllowed', { maxSpace: selectedHallType.maxSpace });
        }
      }
      
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
      newErrors.rentalFee = t('unit.errors.rentalFeeRequired');
    } else if (isNaN(rentalFee)) {
      newErrors.rentalFee = t('unit.errors.rentalFeeValid');
    } else if (rentalFee < 0) {
      newErrors.rentalFee = t('unit.errors.rentalFeeNegative');
    }

    if (!formData.branchId) {
      newErrors.branchId = t('unit.errors.branchRequired');
    }

    if (!formData.buildingId) {
      newErrors.buildingId = t('unit.errors.buildingRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (isValid) {
      // Create FormData for file upload
      const submitFormData = new FormData();
      
      // Append all form fields
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
      
      // Append utility type IDs
      selectedUtilityIds.forEach((utilityId) => {
        submitFormData.append('utilityTypeIds', utilityId.toString());
      });
      
      // Append selected images
      selectedImages.forEach((image) => {
        submitFormData.append('images', image);
      });

      // Submit FormData
      onSubmit(submitFormData);
    }
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for unit number
    if (name === 'unitNumber') {
      let processedValue = value.toUpperCase();
      
      // Always ensure UN- prefix
      if (!processedValue.startsWith('UN-')) {
        processedValue = 'UN-' + processedValue.replace(/^UN/, '');
      }
      
      // Only allow digits after UN-
      if (processedValue.length > 3) {
        const prefix = processedValue.substring(0, 3); // UN-
        const numberPart = processedValue.substring(3);
        
        // Only keep digits in number part
        const digitsOnly = numberPart.replace(/\D/g, '');
        
        // Limit to 3 digits
        const limitedDigits = digitsOnly.substring(0, 3);
        
        // Reconstruct value
        processedValue = prefix + limitedDigits;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));

      // Mark field as touched
      handleFieldTouch(name);

      // Validate unit number immediately
      const unitNumberError = validateUnitNumber(processedValue);
      if (unitNumberError) {
        setErrors(prev => ({
          ...prev,
          [name]: unitNumberError
        }));
      } else {
        // Clear error if validation passes
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (name === 'levelId') {
      // Handle level change
      setFormData(prev => ({ ...prev, levelId: value }));
      handleFieldTouch(name);
      
      if (value) {
        await fetchLevelDetails(parseInt(value));
      } else {
        setSelectedLevel(null);
        setLevelUnitsCount(0);
      }
      
      // Clear error
      if (errors.levelId) {
        setErrors(prev => ({ ...prev, levelId: '' }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      handleFieldTouch(name);

      // Clear error when user starts typing
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
    let processedValue = value.toUpperCase();
    
    // Ensure UN- prefix
    if (!processedValue.startsWith('UN-')) {
      processedValue = 'UN-' + processedValue.replace(/^UN/, '');
    }
    
    // Format number part to 3 digits with leading zeros
    if (processedValue.startsWith('UN-')) {
      const numberPart = processedValue.substring(3);
      if (numberPart !== '') {
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number >= 1 && number <= 999) {
          // Pad with leading zeros to 3 digits
          processedValue = 'UN-' + number.toString().padStart(3, '0');
        } else if (numberPart === '') {
          // If empty after UN-, keep as is for error message
          processedValue = 'UN-';
        }
      }
    }
    
    // Update if value changed
    if (value !== processedValue) {
      setFormData(prev => ({
        ...prev,
        unitNumber: processedValue
      }));
    }

    // Mark field as touched
    handleFieldTouch('unitNumber');

    // Validate unit number on blur
    const unitNumberError = validateUnitNumber(processedValue);
    if (unitNumberError) {
      setErrors(prev => ({
        ...prev,
        unitNumber: unitNumberError
      }));
      return;
    }

    // Check for duplicates when user leaves the field (only if valid and has level selected)
    if (formData.levelId && processedValue && processedValue !== 'UN-') {
      setIsCheckingDuplicate(true);
      try {
        const isDuplicate = await checkDuplicateUnitNumber(processedValue, formData.levelId);
        if (isDuplicate) {
          setErrors(prev => ({
            ...prev,
            unitNumber: t('unit.errors.unitNumberDuplicateFloor')
          }));
        } else {
          // Clear duplicate error if it exists
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.unitNumber === t('unit.errors.unitNumberDuplicateFloor')) {
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
    handleFieldTouch('unitSpace');
    validateUnitSpaceField(value);
  };

  const handleUnitNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { selectionStart, value } = e.currentTarget;
    
    // Allow navigation keys (arrows, home, end, tab)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'].includes(e.key)) {
      return;
    }
    
    // Allow Ctrl/Command keys for shortcuts
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // If cursor is in the UN- prefix area (positions 0-2), prevent most actions
    if (selectionStart !== null && selectionStart < 3) {
      // Allow arrow keys (already handled above) but prevent typing/deleting
      if (e.key === 'Backspace' || e.key === 'Delete' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        // Move cursor to after the prefix if user tries to type
        if (e.key.length === 1) {
          e.currentTarget.setSelectionRange(3, 3);
        }
      }
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
              {t('unit.labels.roomType')} *
            </label>
            <select
              name="roomTypeId"
              value={formData.roomTypeId}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roomTypeId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('unit.placeholders.selectRoomType')}</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.typeName} {type.basePrice ? `(${type.basePrice} ${t('unit.labels.mmk')}/sqm)` : ''}
                </option>
              ))}
            </select>
            {touchedFields.roomTypeId && errors.roomTypeId && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.roomTypeId}
                </p>
              </div>
            )}
            {selectedRoomType && selectedRoomType.basePrice && (
              <div className="mt-2 text-sm text-gray-600">
                <p>{t('unit.labels.basePrice')}: <span className="font-semibold">{selectedRoomType.basePrice} {t('unit.labels.mmkPerSqm')}</span></p>
                {selectedRoomType.minSpace > 0 && (
                  <p>{t('unit.labels.minSpace')}: {selectedRoomType.minSpace} {t('unit.labels.sqm')}</p>
                )}
                {selectedRoomType.maxSpace > 0 && (
                  <p>{t('unit.labels.maxSpace')}: {selectedRoomType.maxSpace} {t('unit.labels.sqm')}</p>
                )}
              </div>
            )}
          </div>
        );

      case UnitType.SPACE:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('unit.labels.spaceType')} *
            </label>
            <select
              name="spaceTypeId"
              value={formData.spaceTypeId}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.spaceTypeId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('unit.placeholders.selectSpaceType')}</option>
              {spaceTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.basePricePerSqm}{t('unit.labels.mmkPerSqm')})
                </option>
              ))}
            </select>
            {touchedFields.spaceTypeId && errors.spaceTypeId && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.spaceTypeId}
                </p>
              </div>
            )}
            {selectedSpaceType && (
              <div className="mt-2 text-sm text-gray-600">
                <p>{t('unit.labels.basePrice')}: <span className="font-semibold">{selectedSpaceType.basePricePerSqm} {t('unit.labels.mmkPerSqm')}</span></p>
                {selectedSpaceType.minSpace > 0 && (
                  <p>{t('unit.labels.minSpace')}: {selectedSpaceType.minSpace} {t('unit.labels.sqm')}</p>
                )}
                {selectedSpaceType.maxSpace > 0 && (
                  <p>{t('unit.labels.maxSpace')}: {selectedSpaceType.maxSpace} {t('unit.labels.sqm')}</p>
                )}
                {selectedSpaceType.hasUtilities && (
                  <p className="text-green-600 font-medium">✓ {t('unit.messages.utilitiesAvailable')}</p>
                )}
              </div>
            )}
          </div>
        );

      case UnitType.HALL:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('unit.labels.hallType')} *
            </label>
            <select
              name="hallTypeId"
              value={formData.hallTypeId}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.hallTypeId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('unit.placeholders.selectHallType')}</option>
              {hallTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.basePrice ? `(${type.basePrice} ${t('unit.labels.mmk')}/sqm)` : ''}
                </option>
              ))}
            </select>
            {touchedFields.hallTypeId && errors.hallTypeId && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.hallTypeId}
                </p>
              </div>
            )}
            {selectedHallType && selectedHallType.basePrice && (
              <div className="mt-2 text-sm text-gray-600">
                <p>{t('unit.labels.basePrice')}: <span className="font-semibold">{selectedHallType.basePrice} {t('unit.labels.mmkPerSqm')}</span></p>
                {selectedHallType.minSpace > 0 && (
                  <p>{t('unit.labels.minSpace')}: {selectedHallType.minSpace} {t('unit.labels.sqm')}</p>
                )}
                {selectedHallType.maxSpace > 0 && (
                  <p>{t('unit.labels.maxSpace')}: {selectedHallType.maxSpace} {t('unit.labels.sqm')}</p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderCalculationPreview = () => {
    if (!rentalFeePreview || !formData.unitSpace) return null;

    const space = parseFloat(formData.unitSpace);
    let basePrice = 0;
    let unitTypeLabel = '';

    switch (formData.unitType) {
      case UnitType.SPACE:
        basePrice = selectedSpaceType?.basePricePerSqm || 0;
        unitTypeLabel = t('unit.types.space');
        break;
      case UnitType.ROOM:
        basePrice = selectedRoomType?.basePrice || 0;
        unitTypeLabel = t('unit.types.room');
        break;
      case UnitType.HALL:
        basePrice = selectedHallType?.basePrice || 0;
        unitTypeLabel = t('unit.types.hall');
        break;
    }

    if (basePrice <= 0) return null;

    return (
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-800">{t('unit.messages.calculatedRentalFee', { unitType: unitTypeLabel })}:</span>
          <span className="text-lg font-bold text-blue-700">
            {rentalFeePreview} {t('unit.labels.mmk')}
          </span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          {t('unit.messages.calculation', {
            space: space,
            basePrice: basePrice.toFixed(2),
            result: rentalFeePreview
          })}
        </p>
        {formData.rentalFee !== rentalFeePreview && formData.rentalFee && (
          <p className="text-xs text-amber-600 mt-1">
            {t('unit.messages.manualOverride', { calculatedValue: rentalFeePreview })}
          </p>
        )}
      </div>
    );
  };

  const renderRealTimeCalculation = () => {
    const space = parseFloat(formData.unitSpace);
    if (!space || space <= 0) return null;

    let basePrice = 0;
    
    switch (formData.unitType) {
      case UnitType.SPACE:
        basePrice = selectedSpaceType?.basePricePerSqm || 0;
        break;
      case UnitType.ROOM:
        basePrice = selectedRoomType?.basePrice || 0;
        break;
      case UnitType.HALL:
        basePrice = selectedHallType?.basePrice || 0;
        break;
    }

    if (basePrice <= 0) return null;

    return (
      <div className="text-sm text-gray-600 mt-1">
        <div className="flex items-center space-x-1">
          <span>{t('unit.messages.calculation')}:</span>
          <span className="font-medium">{space} {t('unit.labels.sqm')}</span>
          <span>×</span>
          <span className="font-medium">{basePrice.toFixed(2)}{t('unit.labels.mmkPerSqm')}</span>
          <span>=</span>
          <span className="font-bold text-green-600">
            {(space * basePrice).toFixed(2)} {t('unit.labels.mmk')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Branch Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('unit.labels.branch')} *
        </label>
        <select
          name="branchId"
          value={formData.branchId}
          onChange={handleChange}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.branchId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">{t('unit.placeholders.selectBranch')}</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>
              {branch.branchName}
            </option>
          ))}
        </select>
        {touchedFields.branchId && errors.branchId && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.branchId}
            </p>
          </div>
        )}
      </div>

      {/* Building Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('unit.labels.building')} *
        </label>
        <select
          name="buildingId"
          value={formData.buildingId}
          onChange={handleChange}
          disabled={!formData.branchId || buildingsLoading}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.buildingId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">{t('unit.placeholders.selectBuilding')}</option>
          {buildings.map(building => (
            <option key={building.id} value={building.id}>
              {building.buildingName}
              {building.totalLeasableArea !== null && building.totalLeasableArea !== undefined && 
                ` (${t('unit.labels.totalArea')}: ${building.totalLeasableArea} ${t('unit.labels.sqm')})`}
            </option>
          ))}
        </select>
        {buildingsLoading && (
          <p className="text-blue-500 text-sm mt-1">{t('unit.messages.loadingBuildings')}</p>
        )}
        {touchedFields.buildingId && errors.buildingId && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.buildingId}
            </p>
          </div>
        )}
      </div>

      {/* Level Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('unit.labels.floor')} *
        </label>
        <select
          name="levelId"
          value={formData.levelId}
          onChange={handleChange}
          disabled={!formData.buildingId || levelsLoading}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.levelId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">{t('unit.placeholders.selectFloor')}</option>
          {levels.map(level => (
            <option key={level.id} value={level.id}>
              {level.levelName} (Floor {level.levelNumber})
              {level.totalUnits !== null && level.totalUnits !== undefined && 
                ` - ${t('unit.labels.max')} ${level.totalUnits} ${t('unit.labels.units')}`}
            </option>
          ))}
        </select>
        {levelsLoading && (
          <p className="text-blue-500 text-sm mt-1">{t('unit.messages.loadingLevels')}</p>
        )}
        
        {/* Level capacity info */}
        {selectedLevel && selectedLevel.totalUnits !== null && selectedLevel.totalUnits !== undefined && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{t('unit.labels.levelCapacity')}:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{levelUnitsCount}/{selectedLevel.totalUnits} {t('unit.labels.units')}</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${Math.min((levelUnitsCount / selectedLevel.totalUnits) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            {levelUnitsCount >= selectedLevel.totalUnits && (
              <p className="text-red-600 text-xs mt-1">{t('unit.messages.floorFullCapacity')}</p>
            )}
          </div>
        )}
        
        {touchedFields.levelId && errors.levelId && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.levelId}
            </p>
          </div>
        )}
      </div>

      {/* Unit Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('unit.labels.unitNumber')} *
        </label>
        <div className="relative">
          <input
            type="text"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleChange}
            onKeyDown={handleUnitNumberKeyDown}
            onBlur={handleUnitNumberBlur}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
              errors.unitNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('unit.placeholders.unitNumber')}
            style={{ textTransform: 'uppercase' }}
            maxLength={7}
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
            {t('unit.messages.unitNumberFormat')}
          </p>
          <span className="text-xs text-gray-400">
            {formData.unitNumber.length}/7
          </span>
        </div>
        {touchedFields.unitNumber && errors.unitNumber && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.unitNumber}
            </p>
          </div>
        )}
        {!errors.unitNumber && formData.unitNumber && formData.levelId && !isCheckingDuplicate && formData.unitNumber !== 'UN-' && (
          <p className="text-green-500 text-sm mt-1">✓ {t('unit.messages.unitNumberValid')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('unit.labels.unitType')} *
          </label>
          <select
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={UnitType.ROOM}>{t('unit.types.room')}</option>
            <option value={UnitType.SPACE}>{t('unit.types.space')}</option>
            <option value={UnitType.HALL}>{t('unit.types.hall')}</option>
          </select>
        </div>

        {/* Has Meter (auto-set for SPACE) */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasMeter"
            name="hasMeter"
            checked={formData.hasMeter}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, hasMeter: e.target.checked }));
              handleFieldTouch('hasMeter');
            }}
            disabled={formData.unitType === UnitType.SPACE}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="hasMeter" className={`text-sm font-medium ${
            formData.unitType === UnitType.SPACE ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {t('unit.labels.hasMeter')}
            {formData.unitType === UnitType.SPACE && ` (${t('unit.messages.disabledForSpaces')})`}
          </label>
        </div>
      </div>

      {/* Type-specific fields */}
      {renderTypeSpecificFields()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Space */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('unit.labels.unitSpace')} *
          </label>
          <input
            type="number"
            name="unitSpace"
            value={formData.unitSpace}
            onChange={handleChange}
            onBlur={handleUnitSpaceBlur}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unitSpace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('unit.placeholders.unitSpace')}
            min="0.1"
            step="0.1"
          />
          
          {/* Building area capacity info */}
          {selectedBuilding && selectedBuilding.totalLeasableArea !== null && selectedBuilding.totalLeasableArea !== undefined && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-700">{t('unit.labels.buildingLeasableArea')}:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {(selectedBuilding.totalLeasableArea - buildingUsedArea).toFixed(2)}/{selectedBuilding.totalLeasableArea} {t('unit.labels.sqmAvailable')}
                  </span>
                </div>
              </div>
              <div className="mt-1 text-xs text-blue-600">
                {t('unit.labels.currentlyUsed')}: {buildingUsedArea.toFixed(2)} {t('unit.labels.sqm')}
              </div>
            </div>
          )}
          
          {renderRealTimeCalculation()}
          {touchedFields.unitSpace && errors.unitSpace && (
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
            {t('unit.labels.rentalFee')} *
          </label>
          
          {renderCalculationPreview()}
          
          <div className="relative">
            <input
              type="number"
              name="rentalFee"
              value={formData.rentalFee}
              onChange={handleChange}
              onBlur={() => handleFieldTouch('rentalFee')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.rentalFee ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={rentalFeePreview ? t('unit.placeholders.autoCalculated') : t('unit.placeholders.rentalFee')}
              min="0"
              step="0.01"
            />
            
            {rentalFeePreview && formData.rentalFee === rentalFeePreview && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">{t('unit.messages.auto')}</span>
              </div>
            )}
          </div>
          
          {touchedFields.rentalFee && errors.rentalFee && (
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
          {t('unit.labels.availableUtilities')}
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
                <div className="flex items-center mt-1 text-xs text-gray-600">
                  <span className="font-medium">
                    {utility.ratePerUnit?.toLocaleString() || '0'} {t('unit.labels.mmk')}
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
            {selectedUtilityIds.length} {t('unit.messages.utilitiesSelected')}
          </p>
        )}
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('unit.labels.unitImages')}
          <span className="ml-2 text-xs text-gray-500">
            ({t('unit.messages.maxImages', { maxImages: MAX_IMAGES })})
          </span>
        </label>
        
        {/* Show remaining image count */}
        {selectedImages.length > 0 && (
          <div className="mb-3 text-sm text-gray-600">
            <span className={`font-medium ${selectedImages.length >= MAX_IMAGES ? 'text-red-600' : 'text-blue-600'}`}>
              {selectedImages.length}/{MAX_IMAGES} {t('unit.labels.imagesSelected')}
            </span>
            {selectedImages.length >= MAX_IMAGES && (
              <span className="ml-2 text-red-500 text-xs">{t('unit.messages.maximumLimitReached')}</span>
            )}
          </div>
        )}
        
        {/* Image Upload Input */}
        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          selectedImages.length >= MAX_IMAGES 
            ? 'border-red-300 bg-red-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-gray-400'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="unit-images"
            disabled={selectedImages.length >= MAX_IMAGES}
          />
          <label
            htmlFor="unit-images"
            className={`block ${selectedImages.length >= MAX_IMAGES ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <svg className={`w-8 h-8 mx-auto ${
              selectedImages.length >= MAX_IMAGES ? 'text-red-400' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className={`text-sm mt-2 ${
              selectedImages.length >= MAX_IMAGES ? 'text-red-600' : 'text-gray-600'
            }`}>
              {selectedImages.length >= MAX_IMAGES 
                ? t('unit.messages.maximumImageLimitReached') 
                : t('unit.messages.clickToUploadImages')}
            </p>
            <p className="text-xs text-gray-500">
              {t('unit.messages.imageFormats')}
            </p>
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {t('unit.labels.selectedImages')}
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
              {selectedImages.length} {t('unit.messages.imagesSelectedCount')}
              {selectedImages.length >= MAX_IMAGES && (
                <span className="ml-2 text-red-500">({t('unit.messages.maximumLimitReached')})</span>
              )}
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
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading || isCheckingDuplicate}
        >
          {t('unit.buttons.create')}
        </Button>
      </div>
    </form>
  );
};