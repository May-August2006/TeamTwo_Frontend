// components/units/UnitSearch.tsx
import React, { useState, useEffect } from 'react';
import { UnitType, type UnitSearchParams } from '../../types/unit';
import { branchApi } from '../../api/BranchAPI';
import { buildingApi } from '../../api/BuildingAPI';
import { levelApi } from '../../api/LevelAPI';
import { Button } from '../common/ui/Button';
import type { Branch, Building, Level } from '../../types';
import { useTranslation } from 'react-i18next';

interface UnitSearchProps {
  onSearch: (params: UnitSearchParams) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const UnitSearch: React.FC<UnitSearchProps> = ({ 
  onSearch, 
  onReset, 
  isLoading = false 
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useState<UnitSearchParams>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const branchesData = await branchApi.getAllBranches();
        setBranches(branchesData.data);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchParams.branchId) {
      loadBuildings(searchParams.branchId);
    } else {
      setBuildings([]);
      setLevels([]);
      setSearchParams(prev => ({ ...prev, buildingId: undefined, levelId: undefined }));
    }
  }, [searchParams.branchId]);

  useEffect(() => {
    if (searchParams.buildingId) {
      loadLevels(searchParams.buildingId);
    } else {
      setLevels([]);
      setSearchParams(prev => ({ ...prev, levelId: undefined }));
    }
  }, [searchParams.buildingId]);

  const loadBuildings = async (branchId: number) => {
    try {
      const buildingsData = await buildingApi.getBuildingsByBranch(branchId);
      setBuildings(buildingsData.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const loadLevels = async (buildingId: number) => {
    try {
      const levelsData = await levelApi.getLevelsByBuilding(buildingId);
      setLevels(levelsData.data);
    } catch (error) {
      console.error('Error loading levels:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleReset = () => {
    setSearchParams({});
    setIsExpanded(false);
    onReset();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : value === '' ? undefined 
              : name.includes('Id') || name.includes('Space') || name.includes('Rent') 
                ? Number(value) 
                : name === 'unitType' ? value as UnitType
                : value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">{t('unit.search_units')}</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          {isExpanded ? t('unit.show_less') : t('unit.show_more_filters')}
          <svg 
            className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.branch')}</label>
            <select
              name="branchId"
              value={searchParams.branchId || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('unit.all_branches')}</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.branchName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.unit_type')}</label>
            <select
              name="unitType"
              value={searchParams.unitType || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('unit.all_types')}</option>
              <option value={UnitType.ROOM}>{t('unit.room')}</option>
              <option value={UnitType.SPACE}>{t('unit.space')}</option>
              <option value={UnitType.HALL}>{t('unit.hall')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.status')}</label>
            <select
              name="isAvailable"
              value={searchParams.isAvailable?.toString() || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('unit.all_status')}</option>
              <option value="true">{t('unit.available')}</option>
              <option value="false">{t('unit.occupied')}</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              {t('common.search')}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.building')}</label>
              <select
                name="buildingId"
                value={searchParams.buildingId || ''}
                onChange={handleChange}
                disabled={!searchParams.branchId}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">{t('unit.all_buildings')}</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>{building.buildingName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.floor')}</label>
              <select
                name="levelId"
                value={searchParams.levelId || ''}
                onChange={handleChange}
                disabled={!searchParams.buildingId}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">{t('unit.all_levels')}</option>
                {levels.map(level => (
                  <option key={level.id} value={level.id}>{level.levelName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.min_space')} ({t('unit.sqm')})</label>
              <input
                type="number"
                name="minSpace"
                value={searchParams.minSpace || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit.max_space')} ({t('unit.sqm')})</label>
              <input
                type="number"
                name="maxSpace"
                value={searchParams.maxSpace || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center space-y-4 space-y-reverse sm:space-y-0">
          <Button
            type="button"
            onClick={handleReset}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {t('unit.reset_filters')}
          </Button>
          
          {isExpanded && (
            <div className="text-sm text-gray-500">
              {Object.values(searchParams).filter(val => val !== undefined && val !== '').length} {t('unit.active_filters')}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};