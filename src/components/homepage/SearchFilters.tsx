import React, { useState, useEffect } from 'react';
import type { UnitSearchParams, RoomType, SpaceType, HallType, Branch, Building, Level } from '../../types/unit';
import { Button } from '../common/ui/Button';

interface SearchFiltersProps {
  onSearch: (params: UnitSearchParams) => void; // Called on filter change (pending)
  onReset: () => void;
  onApplySearch: () => void; // New: Called when Apply Filters is clicked
  pendingFilters?: UnitSearchParams; // The pending (not yet applied) filters
  activeFilters?: UnitSearchParams; // The currently active filters
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onSearch, 
  onReset, 
  onApplySearch,
  pendingFilters = {},
  activeFilters = {}
}) => {
  // Filter states - initialize with pendingFilters if provided
  const [filters, setFilters] = useState<UnitSearchParams>(pendingFilters || {});
  
  // Data for dropdowns
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [hallTypes, setHallTypes] = useState<HallType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  
  // Loading states
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [loadingSpaceTypes, setLoadingSpaceTypes] = useState(false);
  const [loadingHallTypes, setLoadingHallTypes] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  
  // Validation errors - fixed initialization
  const [validationErrors, setValidationErrors] = useState<{
    minSpace?: string;
    maxSpace?: string;
    minRent?: string;
    maxRent?: string;
  }>({});

  // Helper function for public API calls
  const publicFetch = async (url: string): Promise<any> => {
    try {
      const response = await fetch(url);
      
      // Handle 401/403 gracefully for public endpoints
      if (response.status === 401 || response.status === 403) {
        console.warn(`Public endpoint ${url} returned auth error, returning empty array`);
        return [];
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.content)) {
        return data.content;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else if (data) {
        return [data];
      }
      
      return [];
    } catch (err) {
      console.error('Error in publicFetch:', err);
      return [];
    }
  };

  // Update local filters when pendingFilters prop changes
  useEffect(() => {
    if (pendingFilters) {
      console.log('🔄 Updating filters from props:', pendingFilters);
      setFilters(pendingFilters);
      
      // Load dependent data if needed
      if (pendingFilters.branchId && !pendingFilters.buildingId) {
        loadBuildings(pendingFilters.branchId);
      }
      if (pendingFilters.buildingId && !pendingFilters.levelId) {
        loadLevels(pendingFilters.buildingId);
      }
    }
  }, [pendingFilters]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load buildings when branch is selected
  useEffect(() => {
    if (filters.branchId) {
      loadBuildings(filters.branchId);
    } else {
      setBuildings([]);
      setLevels([]);
    }
  }, [filters.branchId]);

  // Load levels when building is selected
  useEffect(() => {
    if (filters.buildingId) {
      loadLevels(filters.buildingId);
    } else {
      setLevels([]);
    }
  }, [filters.buildingId]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadRoomTypes(),
        loadSpaceTypes(),
        loadHallTypes(),
        loadBranches()
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load filter data');
    }
  };

  const loadRoomTypes = async () => {
    try {
      setLoadingRoomTypes(true);
      const data = await publicFetch('http://localhost:8080/api/room-types');
      setRoomTypes(data || []);
    } catch (err: any) {
      console.error('Error loading room types:', err);
      setRoomTypes([]);
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const loadSpaceTypes = async () => {
    try {
      setLoadingSpaceTypes(true);
      const data = await publicFetch('http://localhost:8080/api/space-types/active');
      setSpaceTypes(data || []);
    } catch (err: any) {
      console.error('Error loading space types:', err);
      setSpaceTypes([]);
    } finally {
      setLoadingSpaceTypes(false);
    }
  };

  const loadHallTypes = async () => {
    try {
      setLoadingHallTypes(true);
      const data = await publicFetch('http://localhost:8080/api/hall-types/active');
      setHallTypes(data || []);
    } catch (err: any) {
      console.error('Error loading hall types:', err);
      setHallTypes([]);
    } finally {
      setLoadingHallTypes(false);
    }
  };

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const data = await publicFetch('http://localhost:8080/api/branches');
      setBranches(data || []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadBuildings = async (branchId: number) => {
    try {
      setLoadingBuildings(true);
      const data = await publicFetch(`http://localhost:8080/api/buildings/branch/${branchId}`);
      setBuildings(data || []);
    } catch (err: any) {
      console.error('Error loading buildings:', err);
      setBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const loadLevels = async (buildingId: number) => {
    try {
      setLoadingLevels(true);
      const data = await publicFetch(`http://localhost:8080/api/levels/building/${buildingId}`);
      setLevels(data || []);
    } catch (err: any) {
      console.error('Error loading levels:', err);
      setLevels([]);
    } finally {
      setLoadingLevels(false);
    }
  };

  // Fixed validation function
  const validateNumericField = (
    field: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent',
    value: number | undefined,
    relatedField?: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent'
  ): string | null => {
    // Allow empty values
    if (value === undefined || value === null || value === 0) {
      return null;
    }
    
    // Handle string values if any
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }
    
    // Check for negative values
    if (numValue < 0) {
      return 'Value cannot be negative';
    }
    
    // Check for maximum limits
    if (field.includes('Space') && numValue > 10000) {
      return 'Space value is too large (max: 10,000 sqm)';
    }
    
    if (field.includes('Rent') && numValue > 100000000) {
      return 'Rent value is too large (max: 100,000,000 MMK)';
    }
    
    // Only check min/max relationship if both values exist
    if (field.includes('min') && relatedField && filters[relatedField]) {
      const maxValue = filters[relatedField] as number;
      // Only validate if maxValue is a valid number and greater than 0
      if (maxValue && !isNaN(maxValue) && maxValue > 0) {
        if (numValue > maxValue) {
          return `Minimum cannot be greater than maximum`;
        }
      }
    }
    
    if (field.includes('max') && relatedField && filters[relatedField]) {
      const minValue = filters[relatedField] as number;
      // Only validate if minValue is a valid number and greater than 0
      if (minValue && !isNaN(minValue) && minValue > 0) {
        if (numValue < minValue) {
          return `Maximum cannot be less than minimum`;
        }
      }
    }
    
    return null;
  };

  const handleNumericFilterChange = (
    field: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent',
    value: string
  ) => {
    // Parse the value
    const numValue = value === '' ? undefined : parseFloat(value);
    
    // Validate the field
    let validationError: string | null = null;
    let relatedField: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent' | undefined;
    
    if (field === 'minSpace') relatedField = 'maxSpace';
    if (field === 'maxSpace') relatedField = 'minSpace';
    if (field === 'minRent') relatedField = 'maxRent';
    if (field === 'maxRent') relatedField = 'minRent';
    
    // Only validate if we have a value
    if (numValue !== undefined && !isNaN(numValue)) {
      validationError = validateNumericField(field, numValue, relatedField);
    }
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [field]: validationError || undefined
    }));
    
    // Update filters
    handleFilterChange(field, numValue);
  };

  const handleFilterChange = (key: keyof UnitSearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters when parent changes
    if (key === 'branchId') {
      delete newFilters.buildingId;
      delete newFilters.levelId;
      // Note: Don't clear buildings/levels arrays, just the filter values
    }
    if (key === 'buildingId') {
      delete newFilters.levelId;
    }
    if (key === 'unitType') {
      // Reset type-specific filters when unit type changes
      delete newFilters.roomTypeId;
      delete newFilters.spaceTypeId;
      delete newFilters.hallTypeId;
    }
    
    console.log(`🔧 Filter changed: ${key} = ${value}`, newFilters);
    setFilters(newFilters);
    
    // Notify parent about pending filter changes
    onSearch(newFilters);
  };

  const handleReset = () => {
    console.log('🔄 Resetting filters');
    setFilters({});
    setValidationErrors({});
    onReset(); // This will clear both pending and active filters
  };

  // Fixed handleApply function
  const handleApply = () => {
    console.log('✅ Applying filters:', filters);
    console.log('✅ Validation errors state:', validationErrors);
    
    // Re-validate all fields before applying
    const errors: typeof validationErrors = {};
    
    // Validate min/max space if they exist
    if (filters.minSpace !== undefined && filters.minSpace !== 0) {
      const minSpaceError = validateNumericField('minSpace', filters.minSpace, 'maxSpace');
      if (minSpaceError) errors.minSpace = minSpaceError;
    }
    
    if (filters.maxSpace !== undefined && filters.maxSpace !== 0) {
      const maxSpaceError = validateNumericField('maxSpace', filters.maxSpace, 'minSpace');
      if (maxSpaceError) errors.maxSpace = maxSpaceError;
    }
    
    // Validate min/max rent if they exist
    if (filters.minRent !== undefined && filters.minRent !== 0) {
      const minRentError = validateNumericField('minRent', filters.minRent, 'maxRent');
      if (minRentError) errors.minRent = minRentError;
    }
    
    if (filters.maxRent !== undefined && filters.maxRent !== 0) {
      const maxRentError = validateNumericField('maxRent', filters.maxRent, 'minRent');
      if (maxRentError) errors.maxRent = maxRentError;
    }
    
    console.log('✅ Post-validation errors:', errors);
    
    // Check if there are any blocking errors
    const hasBlockingErrors = Object.values(errors).some(error => error !== undefined);
    
    if (hasBlockingErrors) {
      console.error('❌ Cannot apply filters - validation errors:', errors);
      
      // Update UI with new errors
      setValidationErrors(errors);
      
      // Find the first error message to show
      const firstError = Object.values(errors).find(error => error);
      if (firstError) {
        alert(`Please fix: ${firstError}`);
      }
      
      return;
    }
    
    // Clear any validation errors
    setValidationErrors({});
    
    console.log('✅ Validation passed, calling onApplySearch');
    
    // Call parent to actually apply the search
    onApplySearch();
  };

  const activeFiltersCount = Object.values(filters).filter(val => 
    val !== undefined && val !== '' && val !== null && val !== 0
  ).length;

  const getTypeSpecificFilter = () => {
    switch (filters.unitType) {
      case 'ROOM':
        return (
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Room Type</label>
            <select
              value={filters.roomTypeId || ''}
              onChange={(e) => handleFilterChange('roomTypeId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
              disabled={loadingRoomTypes}
            >
              <option value="">All Room Types</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>{type.typeName}</option>
              ))}
            </select>
            {loadingRoomTypes && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Loading...</p>}
          </div>
        );
      case 'SPACE':
        return (
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Space Type</label>
            <select
              value={filters.spaceTypeId || ''}
              onChange={(e) => handleFilterChange('spaceTypeId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
              disabled={loadingSpaceTypes}
            >
              <option value="">All Space Types</option>
              {spaceTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {loadingSpaceTypes && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Loading...</p>}
          </div>
        );
      case 'HALL':
        return (
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Hall Type</label>
            <select
              value={filters.hallTypeId || ''}
              onChange={(e) => handleFilterChange('hallTypeId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
              disabled={loadingHallTypes}
            >
              <option value="">All Hall Types</option>
              {hallTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {loadingHallTypes && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Loading...</p>}
          </div>
        );
      default:
        return null;
    }
  };

  // Debug: Log validation errors
  useEffect(() => {
    console.log('🔍 Validation errors updated:', validationErrors);
    console.log('🔍 Apply button should be disabled?', Object.keys(validationErrors).filter(key => validationErrors[key as keyof typeof validationErrors]).length > 0);
  }, [validationErrors]);

  // Debug: Log filters
  useEffect(() => {
    console.log('🔍 Filters updated:', filters);
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="text-sm">
          {Object.keys(activeFilters).length > 0 ? (
            <span className="text-green-600 font-medium">
              ✓ Search filters applied
            </span>
          ) : (
            <span className="text-gray-600">
              No active search filters
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className="font-medium">{activeFiltersCount}</span> pending filter{activeFiltersCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Location Filters */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0D1B2A] border-b pb-2">Location</h3>
          
          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Branch</label>
            <select
              value={filters.branchId || ''}
              onChange={(e) => handleFilterChange('branchId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
              disabled={loadingBranches}
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.branchName}</option>
              ))}
            </select>
            {loadingBranches && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Loading...</p>}
          </div>

          {/* Building Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Building</label>
            <select
              value={filters.buildingId || ''}
              onChange={(e) => handleFilterChange('buildingId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
              disabled={loadingBuildings || !filters.branchId}
            >
              <option value="">All Buildings</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>{building.buildingName}</option>
              ))}
            </select>
            {loadingBuildings && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Loading...</p>}
            {!filters.branchId && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Select a branch first</p>}
          </div>

          {/* Level/Floor Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Floor</label>
            <select
              value={filters.levelId || ''}
              onChange={(e) => handleFilterChange('levelId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
              disabled={loadingLevels || !filters.buildingId}
            >
              <option value="">All Floors</option>
              {levels.map(level => (
                <option key={level.id} value={level.id}>{level.levelName} (Level {level.levelNumber})</option>
              ))}
            </select>
            {loadingLevels && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Loading...</p>}
            {!filters.buildingId && <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">Select a building first</p>}
          </div>
        </div>

        {/* Unit Type Filters */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0D1B2A] border-b pb-2">Unit Type</h3>
          
          {/* Unit Type Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Unit Type</label>
            <select
              value={filters.unitType || ''}
              onChange={(e) => handleFilterChange('unitType', e.target.value || undefined)}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
            >
              <option value="">All Unit Types</option>
              <option value="ROOM">Room</option>
              <option value="SPACE">Space</option>
              <option value="HALL">Hall</option>
            </select>
          </div>

          {/* Type-specific Filter */}
          {getTypeSpecificFilter()}
        </div>

        {/* Space & Price Filters */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0D1B2A] border-b pb-2">Space & Price</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Min Space */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Min Space (sqm)</label>
              <input
                type="number"
                value={filters.minSpace || ''}
                onChange={(e) => handleNumericFilterChange('minSpace', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.minSpace 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E5E8EB] focus:ring-[#D32F2F] focus:border-[#D32F2F]'
                }`}
                placeholder="0"
                min="0"
                max="10000"
                step="0.5"
              />
              {validationErrors.minSpace && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.minSpace}</p>
              )}
            </div>

            {/* Max Space */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Max Space (sqm)</label>
              <input
                type="number"
                value={filters.maxSpace || ''}
                onChange={(e) => handleNumericFilterChange('maxSpace', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.maxSpace 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E5E8EB] focus:ring-[#D32F2F] focus:border-[#D32F2F]'
                }`}
                placeholder="1000"
                min="0"
                max="10000"
                step="0.5"
              />
              {validationErrors.maxSpace && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.maxSpace}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Rent */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Min Rent (MMK)</label>
              <input
                type="number"
                value={filters.minRent || ''}
                onChange={(e) => handleNumericFilterChange('minRent', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.minRent 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E5E8EB] focus:ring-[#D32F2F] focus:border-[#D32F2F]'
                }`}
                placeholder="0"
                min="0"
                max="100000000"
                step="1000"
              />
              {validationErrors.minRent && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.minRent}</p>
              )}
            </div>

            {/* Max Rent */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Max Rent (MMK)</label>
              <input
                type="number"
                value={filters.maxRent || ''}
                onChange={(e) => handleNumericFilterChange('maxRent', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.maxRent 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E5E8EB] focus:ring-[#D32F2F] focus:border-[#D32F2F]'
                }`}
                placeholder="1000000"
                min="0"
                max="100000000"
                step="1000"
              />
              {validationErrors.maxRent && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.maxRent}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-[#E5E8EB]">
        <div className="text-sm text-[#0D1B2A] opacity-70">
          {activeFiltersCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.branchId && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  Branch: {branches.find(b => b.id === filters.branchId)?.branchName || filters.branchId}
                </span>
              )}
              {filters.buildingId && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  Building: {buildings.find(b => b.id === filters.buildingId)?.buildingName || filters.buildingId}
                </span>
              )}
              {filters.levelId && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  Floor: {levels.find(l => l.id === filters.levelId)?.levelName || filters.levelId}
                </span>
              )}
              {filters.unitType && (
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                  Type: {filters.unitType}
                </span>
              )}
              {filters.minSpace && filters.minSpace !== 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full">
                  Min Space: {filters.minSpace} sqm
                </span>
              )}
              {filters.maxSpace && filters.maxSpace !== 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full">
                  Max Space: {filters.maxSpace} sqm
                </span>
              )}
              {filters.minRent && filters.minRent !== 0 && (
                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full">
                  Min Rent: {filters.minRent.toLocaleString()} MMK
                </span>
              )}
              {filters.maxRent && filters.maxRent !== 0 && (
                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full">
                  Max Rent: {filters.maxRent.toLocaleString()} MMK
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleReset} 
            variant="secondary" 
            size="sm"
            className="border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
          >
            Reset Filters
          </Button>
          <Button 
            onClick={handleApply} 
            variant="primary" 
            size="sm"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            // Fixed: Only disable if there are actual validation errors
            disabled={Object.keys(validationErrors).filter(key => validationErrors[key as keyof typeof validationErrors]).length > 0}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};