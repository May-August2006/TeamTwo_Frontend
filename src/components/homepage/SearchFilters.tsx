// src/components/homepage/SearchFilters.tsx
import React, { useState, useEffect } from 'react';
import type { RoomSearchParams, RoomType } from '../../types/room';
import { Button } from '../common/ui/Button';

interface SearchFiltersProps {
  onSearch: (params: RoomSearchParams) => void;
  onReset: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onReset }) => {
  const [filters, setFilters] = useState<RoomSearchParams>({});
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading room types (public endpoint)...');
      
      // ✅ Use fetch API to avoid axios interceptors
      const response = await fetch('http://localhost:8080/api/room-types');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Room types response:', data);
      
      let roomTypesData = data;
      
      // Handle different response structures
      if (roomTypesData && roomTypesData.content) {
        roomTypesData = roomTypesData.content;
      } else if (roomTypesData && Array.isArray(roomTypesData.data)) {
        roomTypesData = roomTypesData.data;
      } else if (roomTypesData && Array.isArray(roomTypesData)) {
        roomTypesData = roomTypesData;
      }
      
      console.log(`✅ Loaded ${roomTypesData.length} room types`);
      setRoomTypes(roomTypesData);
      
    } catch (err: any) {
      console.error('❌ Error loading room types:', err);
      let errorMessage = 'Failed to load room types';
      
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      // Set empty array as fallback - filters will still work without room types
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof RoomSearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    console.log(`🔧 Filter changed: ${key} = ${value}`, newFilters);
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleReset = () => {
    console.log('🔄 Resetting filters');
    setFilters({});
    onReset();
  };

  const activeFiltersCount = Object.values(filters).filter(val => val !== undefined && val !== '').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Min Space (sqm)</label>
          <input
            type="number"
            value={filters.minSpace || ''}
            onChange={(e) => handleFilterChange('minSpace', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Max Space (sqm)</label>
          <input
            type="number"
            value={filters.maxSpace || ''}
            onChange={(e) => handleFilterChange('maxSpace', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
            placeholder="1000"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Min Rent (MMK)</label>
          <input
            type="number"
            value={filters.minRent || ''}
            onChange={(e) => handleFilterChange('minRent', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Max Rent (MMK)</label>
          <input
            type="number"
            value={filters.maxRent || ''}
            onChange={(e) => handleFilterChange('maxRent', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200"
            placeholder="10000"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-2">Space Type</label>
          <select
            value={filters.roomTypeId || ''}
            onChange={(e) => handleFilterChange('roomTypeId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-[#E5E8EB] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-all duration-200 bg-white"
            disabled={loading}
          >
            <option value="">All Types</option>
            {roomTypes.map(type => (
              <option key={type.id} value={type.id}>{type.typeName}</option>
            ))}
          </select>
          {loading && (
            <p className="text-[#D32F2F] text-xs mt-2 font-medium">Loading types...</p>
          )}
          {error && (
            <p className="text-amber-600 text-xs mt-2 font-medium">{error}</p>
          )}
          {!loading && roomTypes.length === 0 && !error && (
            <p className="text-[#0D1B2A] opacity-60 text-xs mt-2">No space types available</p>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-[#E5E8EB]">
        <div className="text-sm text-[#0D1B2A] opacity-70">
          <span className="font-medium">{activeFiltersCount}</span> active filter{activeFiltersCount !== 1 ? 's' : ''}
        </div>
        <Button 
          onClick={handleReset} 
          variant="secondary" 
          size="sm"
          className="border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};