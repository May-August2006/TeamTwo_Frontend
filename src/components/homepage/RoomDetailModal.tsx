// src/components/homepage/RoomDetailModal.tsx
import React, { useState } from 'react';
import { Modal } from '../common/ui/Modal';
import type { Room } from '../../types/room';
import { Button } from '../common/ui/Button';

interface RoomDetailModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onAppointment: (room: Room) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  isOpen,
  onClose,
  onAppointment,
  isLoggedIn,
  onLoginRequired
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const imageUrls = room.imageUrls || [];
  const currentImage = imageUrls[selectedImage] || '/api/placeholder/600/400';

  const handleBookAppointment = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    onAppointment(room);
    onClose();
  };

  const nextImage = () => {
    if (imageUrls.length > 1) {
      setSelectedImage((prev) => (prev + 1) % imageUrls.length);
    }
  };

  const prevImage = () => {
    if (imageUrls.length > 1) {
      setSelectedImage((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${room.roomNumber} - ${room.roomType.typeName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Image Gallery */}
        <div className="relative bg-[#E5E8EB] rounded-lg overflow-hidden border border-[#0D1B2A]/10">
          <img
            src={currentImage}
            alt={`${room.roomNumber} - Image ${selectedImage + 1}`}
            className="w-full h-64 object-cover"
          />
          
          {/* Navigation Arrows */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-[#0D1B2A] bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-90 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#0D1B2A] bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-90 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-[#0D1B2A] bg-opacity-80 text-white px-3 py-1 rounded-full text-sm font-medium">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {imageUrls.length > 1 && (
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                  index === selectedImage ? 'border-[#D32F2F]' : 'border-[#E5E8EB] hover:border-[#0D1B2A]/30'
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Room Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#E5E8EB]">
              <span className="font-semibold text-[#0D1B2A]">Space:</span>
              <span className="text-[#0D1B2A] font-medium">{room.roomSpace} sqm</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#E5E8EB]">
              <span className="font-semibold text-[#0D1B2A]">Rental Fee:</span>
              <span className="text-[#D32F2F] font-bold">{room.rentalFee.toLocaleString()} MMK/month</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#E5E8EB]">
              <span className="font-semibold text-[#0D1B2A]">Meter Type:</span>
              <span className="text-[#0D1B2A] font-medium capitalize">{room.meterType.toLowerCase()}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#E5E8EB]">
              <span className="font-semibold text-[#0D1B2A]">Building:</span>
              <span className="text-[#0D1B2A] font-medium">{room.level?.building?.buildingName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#E5E8EB]">
              <span className="font-semibold text-[#0D1B2A]">Floor:</span>
              <span className="text-[#0D1B2A] font-medium">{room.level?.levelName} (Level {room.level?.levelNumber})</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#E5E8EB]">
              <span className="font-semibold text-[#0D1B2A]">Branch:</span>
              <span className="text-[#0D1B2A] font-medium">{room.level?.building?.branchName}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#F8F9FA] rounded-lg p-4 border border-[#E5E8EB]">
          <h4 className="font-semibold text-[#0D1B2A] mb-3">Description</h4>
          <p className="text-[#0D1B2A] opacity-80 text-sm leading-relaxed">
            This {room.roomSpace} sqm {room.roomType.typeName.toLowerCase()} is perfect for {getBusinessSuggestion(room.roomSpace, room.roomType.typeName)}. 
            Located in {room.level?.building?.buildingName} on {room.level?.levelName}, this premium space offers excellent visibility 
            and accessibility to help your business thrive in a high-traffic environment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-[#E5E8EB]">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1 border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
          >
            Close
          </Button>
          <Button
            onClick={handleBookAppointment}
            className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          >
            {isLoggedIn ? 'Book Appointment' : 'Login to Book'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Helper function
const getBusinessSuggestion = (space: number, roomType: string) => {
  if (space < 20) return "kiosks, small retail, or service businesses";
  if (space < 50) return "boutiques, small cafes, or specialty stores";
  if (space < 100) return "restaurants, medium retail, or showrooms";
  return "large retail stores, supermarkets, or entertainment venues";
};