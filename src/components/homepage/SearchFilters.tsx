import React, { useState, useEffect } from 'react';
import type { UnitSearchParams, RoomType, SpaceType, HallType, Branch, Building, Level } from '../../types/unit';
import { Button } from '../common/ui/Button';

interface SearchFiltersProps {
  onSearch: (params: UnitSearchParams) => void;
  onReset: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onReset }) => {
  // Filter states
  const [filters, setFilters] = useState<UnitSearchParams>({});
  
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
      const response = await fetch('http://localhost:8080/api/room-types');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      let roomTypesData = data;
      
      if (roomTypesData && roomTypesData.content) roomTypesData = roomTypesData.content;
      else if (roomTypesData && Array.isArray(roomTypesData.data)) roomTypesData = roomTypesData.data;
      
      setRoomTypes(roomTypesData || []);
    } catch (err: any) {
      console.error('Error loading room types:', err);
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const loadSpaceTypes = async () => {
    try {
      setLoadingSpaceTypes(true);
      const response = await fetch('http://localhost:8080/api/space-types/active');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      let spaceTypesData = data;
      
      if (spaceTypesData && spaceTypesData.content) spaceTypesData = spaceTypesData.content;
      else if (spaceTypesData && Array.isArray(spaceTypesData.data)) spaceTypesData = spaceTypesData.data;
      
      setSpaceTypes(spaceTypesData || []);
    } catch (err: any) {
      console.error('Error loading space types:', err);
    } finally {
      setLoadingSpaceTypes(false);
    }
  };

  const loadHallTypes = async () => {
    try {
      setLoadingHallTypes(true);
      const response = await fetch('http://localhost:8080/api/hall-types/active');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      let hallTypesData = data;
      
      if (hallTypesData && hallTypesData.content) hallTypesData = hallTypesData.content;
      else if (hallTypesData && Array.isArray(hallTypesData.data)) hallTypesData = hallTypesData.data;
      
      setHallTypes(hallTypesData || []);
    } catch (err: any) {
      console.error('Error loading hall types:', err);
    } finally {
      setLoadingHallTypes(false);
    }
  };

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await fetch('http://localhost:8080/api/branches');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      let branchesData = data;
      
      if (branchesData && branchesData.content) branchesData = branchesData.content;
      else if (branchesData && Array.isArray(branchesData.data)) branchesData = branchesData.data;
      
      setBranches(branchesData || []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadBuildings = async (branchId: number) => {
    try {
      setLoadingBuildings(true);
      const response = await fetch(`http://localhost:8080/api/buildings/by-branch/${branchId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      let buildingsData = data;
      
      if (buildingsData && buildingsData.content) buildingsData = buildingsData.content;
      else if (buildingsData && Array.isArray(buildingsData.data)) buildingsData = buildingsData.data;
      
      setBuildings(buildingsData || []);
    } catch (err: any) {
      console.error('Error loading buildings:', err);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const loadLevels = async (buildingId: number) => {
    try {
      setLoadingLevels(true);
      const response = await fetch(`http://localhost:8080/api/levels/by-building/${buildingId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      let levelsData = data;
      
      if (levelsData && levelsData.content) levelsData = levelsData.content;
      else if (levelsData && Array.isArray(levelsData.data)) levelsData = levelsData.data;
      
      setLevels(levelsData || []);
    } catch (err: any) {
      console.error('Error loading levels:', err);
    } finally {
      setLoadingLevels(false);
    }
  };

  const handleFilterChange = (key: keyof UnitSearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters when parent changes
    if (key === 'branchId') {
      delete newFilters.buildingId;
      delete newFilters.levelId;
      setBuildings([]);
      setLevels([]);
    }
    if (key === 'buildingId') {
      delete newFilters.levelId;
      setLevels([]);
    }
    if (key === 'unitType') {
      // Reset type-specific filters when unit type changes
      delete newFilters.roomTypeId;
      delete newFilters.spaceTypeId;
      delete newFilters.hallTypeId;
    }
    
    console.log(`🔧 Filter changed: ${key} = ${value}`, newFilters);
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleReset = () => {
    console.log('🔄 Resetting filters');
    setFilters({});
    setBuildings([]);
    setLevels([]);
    onReset();
  };

  const activeFiltersCount = Object.values(filters).filter(val => 
    val !== undefined && val !== '' && val !== null
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

  return (
    <div className="space-y-6">
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
                onChange={(e) => handleFilterChange('minSpace', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            {/* Max Space */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Max Space (sqm)</label>
              <input
                type="number"
                value={filters.maxSpace || ''}
                onChange={(e) => handleFilterChange('maxSpace', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
                placeholder="1000"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Rent */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Min Rent (MMK)</label>
              <input
                type="number"
                value={filters.minRent || ''}
                onChange={(e) => handleFilterChange('minRent', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            {/* Max Rent */}
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Max Rent (MMK)</label>
              <input
                type="number"
                value={filters.maxRent || ''}
                onChange={(e) => handleFilterChange('maxRent', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
                placeholder="1000000"
                min="0"
                step="1000"
              />
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Availability</label>
            <select
              value={filters.isAvailable !== undefined ? filters.isAvailable.toString() : ''}
              onChange={(e) => handleFilterChange('isAvailable', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
            >
              <option value="">All</option>
              <option value="true">Available Only</option>
              <option value="false">Occupied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters & Reset Button */}
      <div className="flex justify-between items-center pt-6 border-t border-[#E5E8EB]">
        <div className="text-sm text-[#0D1B2A] opacity-70">
          <span className="font-medium">{activeFiltersCount}</span> active filter{activeFiltersCount !== 1 ? 's' : ''}
          {activeFiltersCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.branchId && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Branch: {branches.find(b => b.id === filters.branchId)?.branchName || filters.branchId}
                </span>
              )}
              {filters.buildingId && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Building: {buildings.find(b => b.id === filters.buildingId)?.buildingName || filters.buildingId}
                </span>
              )}
              {filters.levelId && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Floor: {levels.find(l => l.id === filters.levelId)?.levelName || filters.levelId}
                </span>
              )}
              {filters.unitType && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Type: {filters.unitType}
                </span>
              )}
              {filters.minSpace && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Min Space: {filters.minSpace} sqm
                </span>
              )}
              {filters.maxSpace && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Max Space: {filters.maxSpace} sqm
                </span>
              )}
              {filters.minRent && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
                  Min Rent: {filters.minRent.toLocaleString()} MMK
                </span>
              )}
              {filters.maxRent && (
                <span className="bg-[#E5E8EB] text-[#0D1B2A] text-xs px-3 py-1 rounded-full">
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
            onClick={() => onSearch(filters)} 
            variant="primary" 
            size="sm"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
