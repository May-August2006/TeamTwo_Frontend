// src/components/homepage/RoomCard.tsx
import React from 'react';
import type { Room } from '../../types/room';
import { Button } from '../common/ui/Button';

interface RoomCardProps {
  room: Room;
  onViewDetails: (room: Room) => void;
  onAppointment: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onViewDetails, onAppointment }) => {
  // Safe data access with comprehensive fallbacks
  const primaryImage = room.imageUrls?.[0] || 'https://via.placeholder.com/400x300?text=Retail+Space';
  const roomNumber = room.roomNumber || 'N/A';
  const roomSpace = room.roomSpace || 0;
  const rentalFee = room.rentalFee || 0;
  const roomTypeName = room.roomType?.typeName || 'Retail Space';
  const buildingName = room.level?.building?.buildingName || 'Shopping Mall';
  const levelName = room.level?.levelName || 'Ground Floor';
  const meterType = room.meterType || 'ELECTRICITY';

  const getBusinessSuggestion = (space: number, roomType: string) => {
    if (space < 20) return "kiosks, small retail, or service businesses";
    if (space < 50) return "boutiques, small cafes, or specialty stores";
    if (space < 100) return "restaurants, medium retail, or showrooms";
    return "large retail stores, supermarkets, or entertainment venues";
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('🖼️ Image failed to load, using placeholder');
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Retail+Space';
  };

  console.log(`🎯 Rendering RoomCard: ${roomNumber}`, {
    id: room.id,
    hasImages: room.imageUrls?.length > 0,
    type: roomTypeName,
    building: buildingName
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#0D1B2A]/10 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-[#0D1B2A]/20">
      <div className="relative">
        <img
          src={primaryImage}
          alt={`Room ${roomNumber}`}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onViewDetails(room)}
          onError={handleImageError}
        />
        <div className="absolute top-4 right-4">
          <span className="bg-[#D32F2F] text-white px-3 py-1 rounded-full text-xs font-medium">
            Available
          </span>
        </div>
        
        {/* Hover Overlay */}
        <div 
          className="absolute inset-0 bg-[#0D1B2A] bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center cursor-pointer"
          onClick={() => onViewDetails(room)}
        >
          <div className="bg-[#0D1B2A] bg-opacity-80 text-white px-4 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 text-sm font-medium">
            View Details
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-[#0D1B2A]">{roomNumber}</h3>
          <span className="text-2xl font-bold text-[#D32F2F]">
            {rentalFee.toLocaleString()} MMK/mo
          </span>
        </div>
        
        {/* Location Info */}
        <div className="flex items-center text-[#0D1B2A] opacity-80 mb-3">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm truncate">{buildingName} - {levelName}</span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-[#0D1B2A] opacity-80">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{roomSpace} sqm</span>
          </div>
          <div className="flex items-center text-[#0D1B2A] opacity-80">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{roomTypeName}</span>
          </div>
          <div className="flex items-center text-[#0D1B2A] opacity-80">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="capitalize">{meterType.toLowerCase()} Meter</span>
          </div>
        </div>

        <p className="text-[#0D1B2A] opacity-80 text-sm mb-4 line-clamp-2">
          Perfect for {getBusinessSuggestion(roomSpace, roomTypeName)}
        </p>

        <div className="flex space-x-3">
          <Button
            onClick={() => onViewDetails(room)}
            variant="secondary"
            className="flex-1 border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
          >
            View Details
          </Button>
          <Button
            onClick={() => onAppointment(room)}
            className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};