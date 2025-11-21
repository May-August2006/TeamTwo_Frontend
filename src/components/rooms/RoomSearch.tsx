import React, { useState, useEffect } from 'react';
import type { RoomSearchParams, RoomType } from '../../types/room';
import { branchApi } from '../../api/BranchAPI';
import { buildingApi } from '../../api/BuildingAPI';
import { levelApi } from '../../api/LevelAPI';
import { roomTypeApi } from '../../api/RoomAPI';
import { Button } from '../common/ui/Button';
import type { Branch, Building, Level } from '../../types';

interface RoomSearchProps {
  onSearch: (params: RoomSearchParams) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const RoomSearch: React.FC<RoomSearchProps> = ({ 
  onSearch, 
  onReset, 
  isLoading = false 
}) => {
  const [searchParams, setSearchParams] = useState<RoomSearchParams>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [branchesData, roomTypesData] = await Promise.all([
          branchApi.getAllBranches(),
          roomTypeApi.getAll()
        ]);
        setBranches(branchesData.data);
        setRoomTypes(roomTypesData.data);
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
                : value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Search Rooms</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          {isExpanded ? 'Show Less' : 'Show More Filters'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              name="branchId"
              value={searchParams.branchId || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.branchName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select
              name="roomTypeId"
              value={searchParams.roomTypeId || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>{type.typeName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="isAvailable"
              value={searchParams.isAvailable?.toString() || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Available</option>
              <option value="false">Occupied</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              Search
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <select
                name="buildingId"
                value={searchParams.buildingId || ''}
                onChange={handleChange}
                disabled={!searchParams.branchId}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Buildings</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>{building.buildingName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                name="levelId"
                value={searchParams.levelId || ''}
                onChange={handleChange}
                disabled={!searchParams.buildingId}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level.id} value={level.id}>{level.levelName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Space (sqm)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Space (sqm)</label>
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
            Reset Filters
          </Button>
          
          {isExpanded && (
            <div className="text-sm text-gray-500">
              {Object.values(searchParams).filter(val => val !== undefined && val !== '').length} active filters
            </div>
          )}
        </div>
      </form>
    </div>
  );
};