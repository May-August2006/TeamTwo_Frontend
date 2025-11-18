// src/components/homepage/AvailableRoomsSection.tsx
import React, { useState, useEffect } from 'react';
import type { Room, RoomSearchParams } from '../../types/room';
import { RoomCard } from './RoomCard';
import { SearchFilters } from './SearchFilters';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import { Button } from '../common/ui/Button';

interface AvailableRoomsSectionProps {
  onRoomDetail?: (room: Room) => void;
  onAppointment?: (room: Room) => void;
}

export const AvailableRoomsSection: React.FC<AvailableRoomsSectionProps> = ({ 
  onRoomDetail, 
  onAppointment 
}) => {
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<RoomSearchParams>({});
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

  useEffect(() => {
    loadAvailableRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchParams, availableRooms]);

  const loadAvailableRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading available rooms (public endpoint)...');
      
      // ✅ Use fetch API to avoid axios interceptors
      const response = await fetch('http://localhost:8080/api/rooms/available');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Public API Response received:', data);
      
      // Handle different response structures
      let processedData = data;
      
      if (processedData && processedData.content) {
        processedData = processedData.content;
        console.log('📄 Spring Pageable structure detected');
      } else if (processedData && Array.isArray(processedData.data)) {
        processedData = processedData.data;
        console.log('📦 Custom wrapper structure detected');
      } else if (processedData && Array.isArray(processedData)) {
        processedData = processedData;
        console.log('🎯 Direct array structure detected');
      }
      
      console.log('🔧 Processed data:', processedData);
      
      if (!Array.isArray(processedData)) {
        console.error('❌ Expected array but got:', typeof processedData, processedData);
        setError('Invalid data format received from server');
        setAvailableRooms([]);
        return;
      }
      
      console.log(`✅ Loaded ${processedData.length} available rooms`);
      setAvailableRooms(processedData);
      
    } catch (err: any) {
      console.error('❌ Error loading available rooms:', err);
      let errorMessage = 'Failed to load available rooms';
      
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = availableRooms;

    if (searchParams.minSpace) {
      filtered = filtered.filter(room => room.roomSpace >= searchParams.minSpace!);
    }
    if (searchParams.maxSpace) {
      filtered = filtered.filter(room => room.roomSpace <= searchParams.maxSpace!);
    }
    if (searchParams.minRent) {
      filtered = filtered.filter(room => room.rentalFee >= searchParams.minRent!);
    }
    if (searchParams.maxRent) {
      filtered = filtered.filter(room => room.rentalFee <= searchParams.maxRent!);
    }
    if (searchParams.roomTypeId) {
      filtered = filtered.filter(room => room.roomType.id === searchParams.roomTypeId);
    }

    console.log(`🔍 Filtered ${availableRooms.length} rooms to ${filtered.length} rooms`);
    setFilteredRooms(filtered);
  };

  const handleRoomDetail = (room: Room) => {
    console.log('👁️ Viewing room details:', room.roomNumber);
    if (onRoomDetail) {
      onRoomDetail(room);
    }
  };

  const handleAppointment = (room: Room) => {
    console.log('📅 Booking appointment for room:', room.roomNumber);
    if (onAppointment) {
      onAppointment(room);
    }
  };

  return (
    <section id="available-rooms" className="py-16 bg-[#E5E8EB]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-4">
            Available Retail Spaces
          </h2>
          <p className="text-lg text-[#0D1B2A] opacity-80 max-w-2xl mx-auto">
            Browse through our carefully curated selection of retail spaces. 
            Each location is designed to help your business thrive.
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-[#0D1B2A]/10 p-6 mb-8">
          <SearchFilters 
            onSearch={setSearchParams}
            onReset={() => setSearchParams({})}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-[#0D1B2A]/10">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-[#0D1B2A]">Loading available spaces...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-[#D32F2F] mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#B71C1C] mb-2">Unable to Load Spaces</h3>
            <p className="text-[#D32F2F] mb-4">{error}</p>
            <Button onClick={loadAvailableRooms} variant="secondary" className="border-[#0D1B2A]">
              Try Again
            </Button>
          </div>
        )}

        {/* Success State */}
        {!loading && !error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[#0D1B2A] opacity-80">
                Showing {filteredRooms.length} of {availableRooms.length} available spaces
              </p>
              {availableRooms.length > 0 && (
                <Button
                  onClick={loadAvailableRooms}
                  variant="secondary"
                  size="sm"
                  className="border-[#0D1B2A]"
                >
                  Refresh
                </Button>
              )}
            </div>

            {filteredRooms.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-[#0D1B2A]/10">
                <div className="text-[#0D1B2A] opacity-40 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">
                  {availableRooms.length === 0 ? 'No spaces available' : 'No spaces match your criteria'}
                </h3>
                <p className="text-[#0D1B2A] opacity-80 mb-4">
                  {availableRooms.length === 0 
                    ? 'Check back later for new available spaces.' 
                    : 'Try adjusting your filters to see more options.'
                  }
                </p>
                <Button onClick={() => setSearchParams({})} variant="secondary" className="border-[#0D1B2A]">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRooms.map(room => (
                  <RoomCard 
                    key={room.id}
                    room={room}
                    onViewDetails={handleRoomDetail}
                    onAppointment={handleAppointment}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};