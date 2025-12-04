import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Level, Building, LevelRequest } from '../types';
import { levelApi } from '../api/LevelAPI';
import { buildingApi } from '../api/BuildingAPI';
import { useNotification } from '../context/NotificationContext';

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
  
  const { showSuccess, showError, showWarning } = useNotification();

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
      if (building) setSelectedBuilding(building);
    }
  }, [level]);

  // Update selected building when buildingId changes
  useEffect(() => {
    if (formData.buildingId > 0) {
      const building = buildings.find(b => b.id === formData.buildingId);
      setSelectedBuilding(building || null);
    } else {
      setSelectedBuilding(null);
    }
  }, [formData.buildingId, buildings]);

  const loadBuildings = async () => {
    try {
      const response = await buildingApi.getAll();
      setBuildings(response.data);
      
      // If we have a level, find its building after loading buildings
      if (level) {
        const building = response.data.find((b: Building) => b.id === level.buildingId);
        if (building) setSelectedBuilding(building);
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
      showError('Failed to load buildings');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Building ID validation
    if (!formData.buildingId || formData.buildingId <= 0) {
      newErrors.buildingId = 'Please select a building';
    }

    // Level Name validation (matches DTO)
    if (!formData.levelName.trim()) {
      newErrors.levelName = 'Floor name is required';
    } else if (formData.levelName.length > 20) {
      newErrors.levelName = 'Floor name cannot exceed 20 characters';
    }

    // Level Number validation (matches DTO)
    if (formData.levelNumber < 0) {
      newErrors.levelNumber = 'Floor number cannot be negative';
    } else if (formData.levelNumber > 2147483647) { // Max int value
      newErrors.levelNumber = 'Floor number is too large';
    } else if (formData.levelNumber < -2147483648) { // Min int value
      newErrors.levelNumber = 'Floor number cannot be negative';
    }

    // Check if level number exceeds building's total floors
    if (selectedBuilding && formData.levelNumber > selectedBuilding.totalFloors) {
      newErrors.levelNumber = `Floor number cannot exceed building's total floors (${selectedBuilding.totalFloors})`;
    }

    // Total Units validation (matches DTO)
    if (formData.totalUnits < 0) {
      newErrors.totalUnits = 'Total units cannot be negative';
    } else if (formData.totalUnits > 2147483647) { // Max int value
      newErrors.totalUnits = 'Total units is too large';
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
        } else {
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
        if (!isNaN(numValue) && numValue <= 1000000 && numValue >= -1000000) {
          // Use parseInt to ensure integer values
          const intValue = parseInt(value, 10);
          
          // Prevent extremely large numbers
          if (!isNaN(intValue) && Math.abs(intValue) <= 1000000) {
            setFormData(prev => ({
              ...prev,
              [name]: intValue
            }));
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
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              {level ? 'Edit Floor' : 'Add New Floor'}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Building *
            </label>
            <select
              name="buildingId"
              value={formData.buildingId}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 bg-white shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                errors.buildingId ? 'border-red-500' : 'border-stone-300'
              }`}
            >
              <option value={0}>Select a building</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingName} - {building.branchName} (Max Floors: {building.totalFloors})
                </option>
              ))}
            </select>
            {errors.buildingId && (
              <p className="mt-1 text-xs text-red-600">{errors.buildingId}</p>
            )}
            {selectedBuilding && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-stone-500">
                  Selected: {selectedBuilding.buildingName}
                </p>
                <p className="text-xs font-medium text-blue-600">
                  Total Floors: {selectedBuilding.totalFloors}
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-stone-700">
                Floor Name *
              </label>
              <span className="text-xs text-stone-500">
                Auto-capitalized
              </span>
            </div>
            <input
              type="text"
              name="levelName"
              value={formData.levelName}
              onChange={handleChange}
              maxLength={20}
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                errors.levelName ? 'border-red-500' : 'border-stone-300'
              }`}
              placeholder="e.g., Ground Floor, First Floor"
            />
            {errors.levelName && (
              <p className="mt-1 text-xs text-red-600">{errors.levelName}</p>
            )}
            <p className="text-xs text-stone-500 mt-1">
              {formData.levelName.length}/20 characters
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-stone-700">
                Floor Number *
              </label>
              <span className="text-xs text-stone-500">
                {selectedBuilding ? `Max: ${selectedBuilding.totalFloors}` : 'Select building first'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                name="levelNumber"
                value={formData.levelNumber || ''}
                onChange={handleChange}
                min="0"
                disabled={loading || !selectedBuilding}
                className={`w-32 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
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
                    Floor number (0 for Ground, 1 for First, etc.)
                  </p>
                )}
                {!level && selectedBuilding && !errors.levelNumber && (
                  <p className="text-xs text-blue-600 mt-1">
                    Valid range: 0 to {selectedBuilding.totalFloors}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-stone-700">
                Total Units
              </label>
              <span className="text-xs text-stone-500">
                Optional
              </span>
            </div>
            <input
              type="number"
              name="totalUnits"
              value={formData.totalUnits || ''}
              onChange={handleChange}
              min="0"
              max="1000000"
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm disabled:bg-stone-100 disabled:cursor-not-allowed ${
                errors.totalUnits ? 'border-red-500' : 'border-stone-300'
              }`}
              placeholder="Enter number of units (optional)"
            />
            {errors.totalUnits && (
              <p className="mt-1 text-xs text-red-600">{errors.totalUnits}</p>
            )}
            <p className="text-xs text-stone-500 mt-1">
              Number of rooms, shops, or units on this floor
            </p>
          </div>

          {/* Preview Section */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium text-stone-700 mb-2">Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Building:</span>
                <span className="font-medium">
                  {selectedBuilding ? selectedBuilding.buildingName : 'Not selected'}
                </span>
              </div>
              {selectedBuilding && (
                <div className="flex justify-between">
                  <span className="text-stone-600">Building's Total Floors:</span>
                  <span className={`font-medium ${selectedBuilding.totalFloors === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedBuilding.totalFloors} {selectedBuilding.totalFloors === 0 && '(Please update building)'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">Floor Name:</span>
                <span className="font-medium">{formData.levelName || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Floor Number:</span>
                <span className={`font-medium ${
                  selectedBuilding && formData.levelNumber > selectedBuilding.totalFloors 
                    ? 'text-red-600' 
                    : ''
                }`}>
                  {formData.levelNumber === 0 ? 'Ground' : 
                   formData.levelNumber === 1 ? '1st' :
                   formData.levelNumber === 2 ? '2nd' :
                   formData.levelNumber === 3 ? '3rd' :
                   `${formData.levelNumber}th`} Floor
                  {selectedBuilding && formData.levelNumber > selectedBuilding.totalFloors && 
                    ' ⚠️ Exceeds limit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Total Units:</span>
                <span className="font-medium">{formData.totalUnits || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : level ? 'Update Floor' : 'Create Floor'}
            </button>
          </div>

          <div className="text-xs text-stone-500 pt-4 border-t border-stone-100">
            <p className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Floor names are automatically capitalized for consistency. Floor numbers cannot exceed the building's total floors limit.</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LevelForm;