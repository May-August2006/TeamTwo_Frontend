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
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
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
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {imageUrls.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                  index === selectedImage ? 'border-blue-500' : 'border-gray-300'
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

        {/* Rest of your existing RoomDetailModal content remains the same */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Space:</span>
              <span className="ml-2 text-gray-600">{room.roomSpace} sqm</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Rental Fee:</span>
              <span className="ml-2 text-gray-600">{room.rentalFee} MMK/month</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Building:</span>
              <span className="ml-2 text-gray-600">{room.level?.building?.buildingName}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Floor:</span>
              <span className="ml-2 text-gray-600">{room.level?.levelName} (Level {room.level?.levelNumber})</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Branch:</span>
              <span className="ml-2 text-gray-600">{room.level?.building?.branchName}</span>
            </div>
          </div>
        </div>

        {/* Utilities Section - Add this after the Description section */}
{room.utilities && room.utilities.filter(util => util.isActive).length > 0 && (
  <div>
    <h4 className="font-semibold text-gray-900 mb-2">Available Utilities</h4>
    <div className="grid grid-cols-2 gap-2">
      {room.utilities
        .filter(utility => utility.isActive)
        .map((utility) => (
          <div 
            key={utility.id}
            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">{utility.utilityName}</span>
          </div>
        ))
      }
    </div>
  </div>
)}

        {/* Description */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
          <p className="text-gray-600 text-sm">
            This {room.roomSpace} sqm space is perfect for {getBusinessSuggestion(room.roomSpace, room.roomType.typeName)}. 
            Located in {room.level?.building?.buildingName} on {room.level?.levelName}, this space offers excellent visibility 
            and accessibility for your business.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={handleBookAppointment}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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