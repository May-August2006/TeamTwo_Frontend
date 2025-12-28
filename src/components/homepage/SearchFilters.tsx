import React, { useState, useEffect } from 'react';
import type { UnitSearchParams, RoomType, SpaceType, HallType, Branch, Building, Level } from '../../types/unit';
import { Button } from '../common/ui/Button';
import { useTranslation } from 'react-i18next';

interface SearchFiltersProps {
  onSearch: (params: UnitSearchParams) => void;
  onReset: () => void;
  onApplySearch: () => void;
  pendingFilters?: UnitSearchParams;
  activeFilters?: UnitSearchParams;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onSearch, 
  onReset, 
  onApplySearch,
  pendingFilters = {},
  activeFilters = {}
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<UnitSearchParams>(pendingFilters || {});
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [hallTypes, setHallTypes] = useState<HallType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [loadingSpaceTypes, setLoadingSpaceTypes] = useState(false);
  const [loadingHallTypes, setLoadingHallTypes] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    minSpace?: string;
    maxSpace?: string;
    minRent?: string;
    maxRent?: string;
  }>({});

  const publicFetch = async (url: string): Promise<any> => {
    try {
      const response = await fetch(url);
      
      if (response.status === 401 || response.status === 403) {
        console.warn(`Public endpoint ${url} returned auth error, returning empty array`);
        return [];
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  useEffect(() => {
    if (pendingFilters) {
      setFilters(pendingFilters);
      
      if (pendingFilters.branchId && !pendingFilters.buildingId) {
        loadBuildings(pendingFilters.branchId);
      }
      if (pendingFilters.buildingId && !pendingFilters.levelId) {
        loadLevels(pendingFilters.buildingId);
      }
    }
  }, [pendingFilters]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filters.branchId) {
      loadBuildings(filters.branchId);
    } else {
      setBuildings([]);
      setLevels([]);
    }
  }, [filters.branchId]);

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

  const validateNumericField = (
    field: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent',
    value: number | undefined,
    relatedField?: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent'
  ): string | null => {
    if (value === undefined || value === null || value === 0) {
      return null;
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return t('common.errors.enterValidNumber');
    }
    
    if (numValue < 0) {
      return t('common.errors.cannotBeNegative');
    }
    
    if (field.includes('Space') && numValue > 10000) {
      return t('common.errors.spaceTooLarge');
    }
    
    if (field.includes('Rent') && numValue > 100000000) {
      return t('common.errors.rentTooLarge');
    }
    
    if (field.includes('min') && relatedField && filters[relatedField]) {
      const maxValue = filters[relatedField] as number;
      if (maxValue && !isNaN(maxValue) && maxValue > 0) {
        if (numValue > maxValue) {
          return t('common.errors.minGreaterThanMax');
        }
      }
    }
    
    if (field.includes('max') && relatedField && filters[relatedField]) {
      const minValue = filters[relatedField] as number;
      if (minValue && !isNaN(minValue) && minValue > 0) {
        if (numValue < minValue) {
          return t('common.errors.maxLessThanMin');
        }
      }
    }
    
    return null;
  };

  const handleNumericFilterChange = (
    field: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent',
    value: string
  ) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    let validationError: string | null = null;
    let relatedField: 'minSpace' | 'maxSpace' | 'minRent' | 'maxRent' | undefined;
    
    if (field === 'minSpace') relatedField = 'maxSpace';
    if (field === 'maxSpace') relatedField = 'minSpace';
    if (field === 'minRent') relatedField = 'maxRent';
    if (field === 'maxRent') relatedField = 'minRent';
    
    if (numValue !== undefined && !isNaN(numValue)) {
      validationError = validateNumericField(field, numValue, relatedField);
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: validationError || undefined
    }));
    
    handleFilterChange(field, numValue);
  };

  const handleFilterChange = (key: keyof UnitSearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    if (key === 'branchId') {
      delete newFilters.buildingId;
      delete newFilters.levelId;
    }
    if (key === 'buildingId') {
      delete newFilters.levelId;
    }
    if (key === 'unitType') {
      delete newFilters.roomTypeId;
      delete newFilters.spaceTypeId;
      delete newFilters.hallTypeId;
    }
    
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    setValidationErrors({});
    onReset();
  };

  const handleApply = () => {
    const errors: typeof validationErrors = {};
    
    if (filters.minSpace !== undefined && filters.minSpace !== 0) {
      const minSpaceError = validateNumericField('minSpace', filters.minSpace, 'maxSpace');
      if (minSpaceError) errors.minSpace = minSpaceError;
    }
    
    if (filters.maxSpace !== undefined && filters.maxSpace !== 0) {
      const maxSpaceError = validateNumericField('maxSpace', filters.maxSpace, 'minSpace');
      if (maxSpaceError) errors.maxSpace = maxSpaceError;
    }
    
    if (filters.minRent !== undefined && filters.minRent !== 0) {
      const minRentError = validateNumericField('minRent', filters.minRent, 'maxRent');
      if (minRentError) errors.minRent = minRentError;
    }
    
    if (filters.maxRent !== undefined && filters.maxRent !== 0) {
      const maxRentError = validateNumericField('maxRent', filters.maxRent, 'minRent');
      if (maxRentError) errors.maxRent = maxRentError;
    }
    
    const hasBlockingErrors = Object.values(errors).some(error => error !== undefined);
    
    if (hasBlockingErrors) {
      setValidationErrors(errors);
      const firstError = Object.values(errors).find(error => error);
      if (firstError) {
        alert(`Please fix: ${firstError}`);
      }
      return;
    }
    
    setValidationErrors({});
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
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.roomType')}
            </label>
            <select
              value={filters.roomTypeId || ''}
              onChange={(e) => handleFilterChange('roomTypeId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
              disabled={loadingRoomTypes}
            >
              <option value="">{t('homepage.searchFilters.allRoomTypes')}</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>{type.typeName}</option>
              ))}
            </select>
            {loadingRoomTypes && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.loading')}</p>}
          </div>
        );
      case 'SPACE':
        return (
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.spaceType')}
            </label>
            <select
              value={filters.spaceTypeId || ''}
              onChange={(e) => handleFilterChange('spaceTypeId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
              disabled={loadingSpaceTypes}
            >
              <option value="">{t('homepage.searchFilters.allSpaceTypes')}</option>
              {spaceTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {loadingSpaceTypes && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.loading')}</p>}
          </div>
        );
      case 'HALL':
        return (
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.hallType')}
            </label>
            <select
              value={filters.hallTypeId || ''}
              onChange={(e) => handleFilterChange('hallTypeId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
              disabled={loadingHallTypes}
            >
              <option value="">{t('homepage.searchFilters.allHallTypes')}</option>
              {hallTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {loadingHallTypes && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.loading')}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    console.log('🔍 Validation errors updated:', validationErrors);
  }, [validationErrors]);

  useEffect(() => {
    console.log('🔍 Filters updated:', filters);
  }, [filters]);

  return (
    <div className="space-y-8">
      {/* Status Indicator */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1E40AF]/5 to-[#3B82F6]/5 border border-[#1E40AF]/20 rounded-xl">
        <div className="text-sm">
          {Object.keys(activeFilters).length > 0 ? (
            <span className="text-[#1E40AF] font-medium">
              {t('homepage.searchFilters.filtersApplied')}
            </span>
          ) : (
            <span className="text-[#64748B]">
              {t('homepage.searchFilters.noActiveFilters')}
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className="font-medium text-[#0F172A]">{activeFiltersCount}</span> {t('homepage.searchFilters.pendingFilters', { count: activeFiltersCount })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Location Filters */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-[#0F172A] border-b pb-3">
            {t('homepage.searchFilters.location')}
          </h3>
          
          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.branch')}
            </label>
            <select
              value={filters.branchId || ''}
              onChange={(e) => handleFilterChange('branchId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
              disabled={loadingBranches}
            >
              <option value="">{t('homepage.searchFilters.allBranches')}</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.branchName}</option>
              ))}
            </select>
            {loadingBranches && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.loading')}</p>}
          </div>

          {/* Building Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.building')}
            </label>
            <select
              value={filters.buildingId || ''}
              onChange={(e) => handleFilterChange('buildingId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
              disabled={loadingBuildings || !filters.branchId}
            >
              <option value="">{t('homepage.searchFilters.allBuildings')}</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>{building.buildingName}</option>
              ))}
            </select>
            {loadingBuildings && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.loading')}</p>}
            {!filters.branchId && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.selectBranchFirst')}</p>}
          </div>

          {/* Level/Floor Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.floor')}
            </label>
            <select
              value={filters.levelId || ''}
              onChange={(e) => handleFilterChange('levelId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
              disabled={loadingLevels || !filters.buildingId}
            >
              <option value="">{t('homepage.searchFilters.allFloors')}</option>
              {levels.map(level => (
                <option key={level.id} value={level.id}>{level.levelName} ({t('homepage.unitDetail.level', { levelNumber: level.levelNumber || 'N/A' })})</option>
              ))}
            </select>
            {loadingLevels && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.loading')}</p>}
            {!filters.buildingId && <p className="text-[#64748B] text-xs mt-2">{t('homepage.searchFilters.selectBuildingFirst')}</p>}
          </div>
        </div>

        {/* Unit Type Filters */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-[#0F172A] border-b pb-3">
            {t('homepage.searchFilters.unitType')}
          </h3>
          
          {/* Unit Type Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">
              {t('homepage.searchFilters.unitType')}
            </label>
            <select
              value={filters.unitType || ''}
              onChange={(e) => handleFilterChange('unitType', e.target.value || undefined)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] transition-all duration-200 bg-white"
            >
              <option value="">{t('homepage.searchFilters.allUnitTypes')}</option>
              <option value="ROOM">{t('homepage.searchFilters.room')}</option>
              <option value="SPACE">{t('homepage.searchFilters.space')}</option>
              <option value="HALL">{t('homepage.searchFilters.hall')}</option>
            </select>
          </div>

          {/* Type-specific Filter */}
          {getTypeSpecificFilter()}
        </div>

        {/* Space & Price Filters */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-[#0F172A] border-b pb-3">
            {t('homepage.searchFilters.spaceAndPrice')}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Min Space */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-3">
                {t('homepage.searchFilters.minSpace')}
              </label>
              <input
                type="number"
                value={filters.minSpace || ''}
                onChange={(e) => handleNumericFilterChange('minSpace', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.minSpace 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E2E8F0] focus:ring-[#1E40AF] focus:border-[#1E40AF]'
                }`}
                placeholder="0"
                min="0"
                max="10000"
                step="0.5"
              />
              {validationErrors.minSpace && (
                <p className="text-red-500 text-xs mt-2">{validationErrors.minSpace}</p>
              )}
            </div>

            {/* Max Space */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-3">
                {t('homepage.searchFilters.maxSpace')}
              </label>
              <input
                type="number"
                value={filters.maxSpace || ''}
                onChange={(e) => handleNumericFilterChange('maxSpace', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.maxSpace 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E2E8F0] focus:ring-[#1E40AF] focus:border-[#1E40AF]'
                }`}
                placeholder="1000"
                min="0"
                max="10000"
                step="0.5"
              />
              {validationErrors.maxSpace && (
                <p className="text-red-500 text-xs mt-2">{validationErrors.maxSpace}</p>
              )}
            </div>
          </div>

          {/* <div className="grid grid-cols-2 gap-4"> */}
            {/* Min Rent */}
            {/* <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-3">
                {t('homepage.searchFilters.minRent')}
              </label>
              <input
                type="number"
                value={filters.minRent || ''}
                onChange={(e) => handleNumericFilterChange('minRent', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.minRent 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E2E8F0] focus:ring-[#1E40AF] focus:border-[#1E40AF]'
                }`}
                placeholder="0"
                min="0"
                max="100000000"
                step="1000"
              />
              {validationErrors.minRent && (
                <p className="text-red-500 text-xs mt-2">{validationErrors.minRent}</p>
              )}
            </div> */}

            {/* Max Rent */}
            {/* <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-3">
                {t('homepage.searchFilters.maxRent')}
              </label>
              <input
                type="number"
                value={filters.maxRent || ''}
                onChange={(e) => handleNumericFilterChange('maxRent', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.maxRent 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-[#E2E8F0] focus:ring-[#1E40AF] focus:border-[#1E40AF]'
                }`}
                placeholder="1000000"
                min="0"
                max="100000000"
                step="1000"
              />
              {validationErrors.maxRent && (
                <p className="text-red-500 text-xs mt-2">{validationErrors.maxRent}</p>
              )}
            </div> */}
          {/* </div> */}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pt-8 border-t border-[#E2E8F0] gap-6">
        <div className="text-sm text-[#64748B]">
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.branchId && (
                <span className="bg-gradient-to-r from-[#1E40AF]/10 to-[#3B82F6]/10 text-[#1E40AF] text-xs px-3 py-1.5 rounded-full border border-[#1E40AF]/20">
                  {t('homepage.searchFilters.branch')}: {branches.find(b => b.id === filters.branchId)?.branchName || filters.branchId}
                </span>
              )}
              {filters.buildingId && (
                <span className="bg-gradient-to-r from-[#1E40AF]/10 to-[#3B82F6]/10 text-[#1E40AF] text-xs px-3 py-1.5 rounded-full border border-[#1E40AF]/20">
                  {t('homepage.searchFilters.building')}: {buildings.find(b => b.id === filters.buildingId)?.buildingName || filters.buildingId}
                </span>
              )}
              {filters.levelId && (
                <span className="bg-gradient-to-r from-[#1E40AF]/10 to-[#3B82F6]/10 text-[#1E40AF] text-xs px-3 py-1.5 rounded-full border border-[#1E40AF]/20">
                  {t('homepage.searchFilters.floor')}: {levels.find(l => l.id === filters.levelId)?.levelName || filters.levelId}
                </span>
              )}
              {filters.unitType && (
                <span className="bg-gradient-to-r from-[#10B981]/10 to-[#34D399]/10 text-[#059669] text-xs px-3 py-1.5 rounded-full border border-[#10B981]/20">
                  {t('homepage.searchFilters.unitType')}: {filters.unitType}
                </span>
              )}
              {filters.minSpace && filters.minSpace !== 0 && (
                <span className="bg-gradient-to-r from-[#F59E0B]/10 to-[#FBBF24]/10 text-[#D97706] text-xs px-3 py-1.5 rounded-full border border-[#F59E0B]/20">
                  {t('homepage.searchFilters.minSpace')}: {filters.minSpace} {t('homepage.units.sqm')}
                </span>
              )}
              {filters.maxSpace && filters.maxSpace !== 0 && (
                <span className="bg-gradient-to-r from-[#F59E0B]/10 to-[#FBBF24]/10 text-[#D97706] text-xs px-3 py-1.5 rounded-full border border-[#F59E0B]/20">
                  {t('homepage.searchFilters.maxSpace')}: {filters.maxSpace} {t('homepage.units.sqm')}
                </span>
              )}
              {filters.minRent && filters.minRent !== 0 && (
                <span className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#A78BFA]/10 text-[#7C3AED] text-xs px-3 py-1.5 rounded-full border border-[#8B5CF6]/20">
                  {t('homepage.searchFilters.minRent')}: {filters.minRent.toLocaleString()} MMK
                </span>
              )}
              {filters.maxRent && filters.maxRent !== 0 && (
                <span className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#A78BFA]/10 text-[#7C3AED] text-xs px-3 py-1.5 rounded-full border border-[#8B5CF6]/20">
                  {t('homepage.searchFilters.maxRent')}: {filters.maxRent.toLocaleString()} MMK
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={handleReset} 
            variant="secondary" 
            size="md"
            className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-all duration-300"
          >
            {t('homepage.searchFilters.resetFilters')}
          </Button>
          <Button 
            onClick={handleApply} 
            variant="primary" 
            size="md"
            className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={Object.keys(validationErrors).filter(key => validationErrors[key as keyof typeof validationErrors]).length > 0}
          >
            {t('homepage.searchFilters.applyFilters')}
          </Button>
        </div>
      </div>
    </div>
  );
};