import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Level, Building, LevelRequest } from '../types';
import { levelApi } from '../api/LevelAPI';
import { buildingApi } from '../api/BuildingAPI';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

interface LevelFormProps {
  level?: Level | null;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

interface ValidationErrors {
  buildingId?: string;
  levelName?: string;
  levelNumber?: string;
  totalUnits?: string;
  [key: string]: string | undefined;
}

const LevelForm: React.FC<LevelFormProps> = ({ level, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<LevelRequest>({
    buildingId: 0,
    levelName: '',
    levelNumber: 0,
    totalUnits: 0,
  });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [existingLevels, setExistingLevels] = useState<Level[]>([]);
  const [buildingStats, setBuildingStats] = useState<{
    usedFloors: number;
    remainingFloors: number;
    isFull: boolean;
  }>({
    usedFloors: 0,
    remainingFloors: 0,
    isFull: false,
  });
  
  const { showSuccess, showError, showWarning } = useNotification();
  const { t } = useTranslation();

  useEffect(() => {
    loadBuildings();
    if (level) {
      setFormData({
        buildingId: level.buildingId,
        levelName: level.levelName,
        levelNumber: level.levelNumber,
        totalUnits: level.totalUnits || 0,
      });
      // Find the building for the existing level
      const building = buildings.find(b => b.id === level.buildingId);
      if (building) {
        setSelectedBuilding(building);
        loadExistingLevels(building.id);
      }
    }
  }, [level]);

  // Update selected building when buildingId changes
  useEffect(() => {
    if (formData.buildingId > 0) {
      const building = buildings.find(b => b.id === formData.buildingId);
      if (building) {
        setSelectedBuilding(building);
        loadExistingLevels(building.id);
      }
    } else {
      setSelectedBuilding(null);
      setExistingLevels([]);
      setBuildingStats({
        usedFloors: 0,
        remainingFloors: 0,
        isFull: false,
      });
    }
  }, [formData.buildingId, buildings]);

  useEffect(() => {
    if (selectedBuilding && existingLevels.length >= 0) {
      const usedFloors = existingLevels.length;
      const remainingFloors = selectedBuilding.totalFloors - usedFloors;
      const isFull = remainingFloors <= 0;
      
      setBuildingStats({
        usedFloors,
        remainingFloors,
        isFull,
      });
      
      // Show warning if building is full (only for new level creation)
      if (isFull && !level) {
        showWarning(t('forms.level.validation.buildingFull', { floors: selectedBuilding.totalFloors }));
      }
    }
  }, [selectedBuilding, existingLevels]);

  const loadBuildings = async () => {
    try {
      const response = await buildingApi.getAll();
      setBuildings(response.data);
      
      // If we have a level, find its building after loading buildings
      if (level) {
        const building = response.data.find((b: Building) => b.id === level.buildingId);
        if (building) {
          setSelectedBuilding(building);
          loadExistingLevels(building.id);
        }
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
      showError('Failed to load buildings');
    }
  };

  const loadExistingLevels = async (buildingId: number) => {
    try {
      const response = await levelApi.getByBuildingId(buildingId);
      setExistingLevels(response.data);
    } catch (error) {
      console.error('Error loading existing levels:', error);
      setExistingLevels([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Building ID validation
    if (!formData.buildingId || formData.buildingId <= 0) {
      newErrors.buildingId = t('forms.level.validation.buildingRequired');
    }

    // Check if building is full (only for new level creation)
    if (!level && selectedBuilding && buildingStats.isFull) {
      newErrors.buildingId = t('forms.level.validation.buildingFull', { floors: selectedBuilding.totalFloors });
    }

    // Level Name validation (matches DTO)
    if (!formData.levelName.trim()) {
      newErrors.levelName = t('forms.level.validation.nameRequired');
    } else if (formData.levelName.length > 20) {
      newErrors.levelName = t('forms.level.validation.nameMax');
    }

    // Check for duplicate level name (frontend validation)
    if (formData.levelName.trim() && selectedBuilding) {
      const isDuplicateName = existingLevels.some(
        l => l.levelName.toLowerCase() === formData.levelName.toLowerCase() && 
             (!level || l.id !== level.id)
      );
      if (isDuplicateName) {
        newErrors.levelName = t('forms.level.validation.nameDuplicate', { name: formData.levelName });
      }
    }

    // Level Number validation (matches DTO) - Max 2 digits (99)
    if (formData.levelNumber < 0) {
      newErrors.levelNumber = t('forms.level.validation.numberNegative');
    } else if (formData.levelNumber > 99) {
      newErrors.levelNumber = t('forms.level.validation.numberMax');
    } else if (formData.levelNumber > 2147483647) { // Max int value
      newErrors.levelNumber = t('forms.level.validation.numberTooLarge');
    } else if (formData.levelNumber < -2147483648) { // Min int value
      newErrors.levelNumber = t('forms.level.validation.numberNegative');
    }

    // Check for duplicate level number (frontend validation)
    if (selectedBuilding && formData.levelNumber >= 0) {
      const isDuplicateNumber = existingLevels.some(
        l => l.levelNumber === formData.levelNumber && 
             (!level || l.id !== level.id)
      );
      if (isDuplicateNumber) {
        newErrors.levelNumber = t('forms.level.validation.numberDuplicate', { number: formData.levelNumber });
      }
    }

    // Total Units validation (matches DTO) - Max 4 digits (9999)
    if (formData.totalUnits < 0) {
      newErrors.totalUnits = t('forms.level.validation.unitsNegative');
    } else if (formData.totalUnits > 9999) {
      newErrors.totalUnits = t('forms.level.validation.unitsMax');
    } else if (formData.totalUnits > 2147483647) { // Max int value
      newErrors.totalUnits = t('forms.level.validation.unitsTooLarge');
    }

    // Check if totalUnits is 0 or empty (now required)
    if (formData.totalUnits === 0) {
      newErrors.totalUnits = t('forms.level.validation.unitsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to capitalize each word in a string
  const capitalizeWords = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Frontend validation
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      setLoading(false);
      return;
    }

    try {
      // Ensure values are integers before sending
      const levelData = {
        ...formData,
        levelNumber: Math.floor(formData.levelNumber), // Ensure integer
        totalUnits: Math.floor(formData.totalUnits), // Ensure integer
      };

      let message = '';
      if (level) {
        await levelApi.update(level.id, levelData);
        message = 'Floor updated successfully!';
        showSuccess('Floor updated successfully!');
      } else {
        await levelApi.create(levelData);
        message = 'Floor created successfully!';
        showSuccess('Floor created successfully!');
      }
      
      onSubmit(message);
      onClose();
      
    } catch (error: any) {
      console.error('Error saving floor:', error);
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const newErrors: ValidationErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          newErrors[key] = backendErrors[key];
        });
        
        setErrors(newErrors);
        showError('Please fix the validation errors');
      } 
      else if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Handle integer out of range error
        if (errorMessage.includes('out of range of int') || 
            errorMessage.includes('Numeric value') ||
            errorMessage.includes('2147483647')) {
          
          showError('The value entered is too large. Please enter a smaller number.');
          
          // Try to determine which field caused the error
          if (errorMessage.includes('levelNumber') || errorMessage.toLowerCase().includes('level')) {
            setErrors(prev => ({ 
              ...prev, 
              levelNumber: 'Floor number is too large. Maximum is 2,147,483,647' 
            }));
          } else if (errorMessage.includes('totalUnits') || errorMessage.toLowerCase().includes('unit')) {
            setErrors(prev => ({ 
              ...prev, 
              totalUnits: 'Total units is too large. Maximum is 2,147,483,647' 
            }));
          }
        } 
        // Handle building full error
        else if (errorMessage.includes('Cannot create more floors') || 
                 errorMessage.includes('maximum capacity')) {
          setErrors(prev => ({ 
            ...prev, 
            buildingId: errorMessage 
          }));
          showError(errorMessage);
        }
        else {
          showError(errorMessage);
        }
      } 
      else if (error.message?.includes('Network Error')) {
        showError('Network error. Please check your connection and try again.');
      }
      else {
        const errorMsg = level ? 'Failed to update floor' : 'Failed to create floor';
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Handle numeric fields
    if (name === 'buildingId' || name === 'levelNumber' || name === 'totalUnits') {
      // For empty value, set to 0
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }));
      } else {
        // Parse the number - this will automatically remove leading zeros
        const numValue = parseFloat(value);
        
        // Check if it's a valid number and within reasonable bounds
        if (!isNaN(numValue)) {
          // Use parseInt to ensure integer values
          const intValue = parseInt(value, 10);
          
          // Prevent extremely large numbers
          if (!isNaN(intValue)) {
            // NEW: Limit based on field type
            if (name === 'levelNumber') {
              // Limit floor number to 2 digits (0-99)
              if (value.length <= 2 && intValue <= 99) {
                setFormData(prev => ({
                  ...prev,
                  [name]: intValue
                }));
              }
            } else if (name === 'totalUnits') {
              // Limit total units to 4 digits (0-9999)
              if (value.length <= 4 && intValue <= 9999) {
                setFormData(prev => ({
                  ...prev,
                  [name]: intValue
                }));
              }
            } else if (name === 'buildingId') {
              // For building ID, use existing logic
              if (Math.abs(intValue) <= 1000000) {
                setFormData(prev => ({
                  ...prev,
                  [name]: intValue
                }));
              }
            }
          }
        }
      }
    } else if (name === 'levelName') {
      // Auto-capitalize level name
      const capitalizedValue = capitalizeWords(value);
      setFormData(prev => ({
        ...prev,
        [name]: capitalizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200">
          <div className="flex justify-between items-center p-6 sm:p-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {level ? t('forms.level.edit') : t('forms.level.add')}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                {level ? 'Update floor details' : 'Create a new floor for your building'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8 pt-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t('forms.level.building')} *
              </label>
              <select
                name="buildingId"
                value={formData.buildingId}
                onChange={handleChange}
                disabled={loading}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm sm:text-base transition duration-150 bg-white shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                  errors.buildingId ? 'border-red-500' : 'border-stone-300'
                }`}
              >
                <option value={0}>{t('forms.common.select')} {t('forms.level.building').toLowerCase()}</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingName} - {building.branchName} (Max: {building.totalFloors})
                  </option>
                ))}
              </select>
              {errors.buildingId && (
                <p className="mt-1 text-xs text-red-600">{errors.buildingId}</p>
              )}
              {selectedBuilding && (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex flex-col">
                    <p className="text-xs text-stone-500">
                      {t('forms.level.selected')}: {selectedBuilding.buildingName}
                    </p>
                    <p className={`text-xs font-medium ${
                      buildingStats.isFull ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {buildingStats.isFull ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {t('forms.level.full')} ({buildingStats.usedFloors}/{selectedBuilding.totalFloors})
                        </span>
                      ) : (
                        `${t('forms.level.capacity')}: ${buildingStats.usedFloors}/${selectedBuilding.totalFloors} (${buildingStats.remainingFloors} ${t('forms.level.remaining')})`
                      )}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-blue-600">
                    {t('forms.level.totalAllowed')}: {selectedBuilding.totalFloors}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-stone-700">
                  {t('forms.level.floorName')} *
                </label>
                <span className="text-xs text-stone-500">
                  {t('forms.common.autoCapitalized')}
                </span>
              </div>
              <input
                type="text"
                name="levelName"
                value={formData.levelName}
                onChange={handleChange}
                maxLength={20}
                disabled={loading}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm sm:text-base transition duration-150 shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                  errors.levelName ? 'border-red-500' : 'border-stone-300'
                }`}
                placeholder={t('forms.level.hints.floorName')}
              />
              {errors.levelName && (
                <p className="mt-1 text-xs text-red-600">{errors.levelName}</p>
              )}
              <p className="text-xs text-stone-500 mt-1">
                {t('forms.common.characterCount', { count: formData.levelName.length, max: 20 })}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-stone-700">
                  {t('forms.level.floorNumber')} *
                </label>
                <span className="text-xs text-stone-500">
                  0-99 {t('forms.common.allowed')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  name="levelNumber"
                  value={formData.levelNumber || ''}
                  onChange={handleChange}
                  min="0"
                  max="99"
                  maxLength={2}
                  disabled={loading || (!level && buildingStats.isFull)}
                  className={`w-32 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm sm:text-base transition duration-150 shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                    errors.levelNumber ? 'border-red-500' : 'border-stone-300'
                  }`}
                  placeholder="0"
                />
                <div className="flex-1">
                  {errors.levelNumber && (
                    <p className="text-xs text-red-600">{errors.levelNumber}</p>
                  )}
                  {!errors.levelNumber && (
                    <p className="text-xs text-stone-500">
                      {t('forms.level.hints.floorNumber')}
                    </p>
                  )}
                  {!level && selectedBuilding && buildingStats.isFull && !errors.levelNumber && (
                    <p className="text-xs text-red-600 mt-1">
                      {t('forms.level.hints.capacityFull')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-stone-700">
                  {t('forms.level.totalUnits')} *
                </label>
                <span className="text-xs text-red-500 font-medium">
                  {t('forms.common.required')}
                </span>
              </div>
              <input
                type="number"
                name="totalUnits"
                value={formData.totalUnits || ''}
                onChange={handleChange}
                min="0"
                max="9999"
                maxLength={4}
                disabled={loading}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm sm:text-base transition duration-150 shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                  errors.totalUnits ? 'border-red-500' : 'border-stone-300'
                }`}
                placeholder={t('forms.level.hints.totalUnits')}
              />
              {errors.totalUnits && (
                <p className="mt-1 text-xs text-red-600">{errors.totalUnits}</p>
              )}
              <p className="text-xs text-stone-500 mt-1">
                {t('forms.level.hints.unitsDescription')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('forms.common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || (!level && buildingStats.isFull)}
                className="px-6 py-3 bg-[#1E40AF] text-white rounded-lg shadow-lg hover:bg-blue-800 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-blue-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('forms.common.saving')}
                  </>
                ) : level ? t('forms.common.update') : t('forms.common.create')}
              </button>
            </div>

            <div className="text-xs text-stone-500 pt-4 border-t border-stone-100">
              <p className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>{t('forms.level.hints.description')}</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LevelForm;