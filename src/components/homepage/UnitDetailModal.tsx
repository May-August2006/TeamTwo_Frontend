// src/components/homepage/UnitDetailModal.tsx
import React, { useState } from 'react';
import { Modal } from '../common/ui/Modal';
import type { Unit } from '../../types/unit';
import { Button } from '../common/ui/Button';
import { useAuth } from '../../context/AuthContext';

interface UnitDetailModalProps {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
  onAppointment: (unit: Unit) => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  isOpen,
  onClose,
  onAppointment,
}) => {
  const { isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const imageUrls = unit.imageUrls || [];
  const currentImage = imageUrls[selectedImage] || 'https://via.placeholder.com/600x400?text=Retail+Space';

  const handleBookAppointment = () => {
    // Simply call onAppointment - parent (HomePage) will handle login check
    onAppointment(unit);
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

  const getBusinessSuggestion = (space: number, unitType: string) => {
    if (space < 20) return "kiosks, small retail, or service businesses";
    if (space < 50) return "boutiques, small cafes, or specialty stores";
    if (space < 100) return "restaurants, medium retail, or showrooms";
    return "large retail stores, supermarkets, or entertainment venues";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${unit.unitNumber}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Image Gallery */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={currentImage}
            alt={`${unit.unitNumber} - Image ${selectedImage + 1}`}
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

        {/* Unit Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Space:</span>
              <span className="ml-2 text-gray-600">{unit.unitSpace} sqm</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Rental Fee:</span>
              {isAuthenticated ? (
                <span className="ml-2 text-gray-600">{unit.rentalFee.toLocaleString()} MMK/month</span>
              ) : (
                <span className="ml-2 text-gray-500 italic">Login to see price</span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Building:</span>
              <span className="ml-2 text-gray-600">{unit.level?.building?.buildingName || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Floor:</span>
              <span className="ml-2 text-gray-600">{unit.level?.levelName || 'N/A'} (Level {unit.level?.levelNumber || 'N/A'})</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Branch:</span>
              <span className="ml-2 text-gray-600">
                {unit.level?.building?.branch?.branchName || 
                 unit.level?.building?.branchName || 
                 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Utilities Section */}
        {unit.utilities && unit.utilities.filter(util => util.isActive).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Available Utilities</h4>
            <div className="grid grid-cols-2 gap-2">
              {unit.utilities
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
            This {unit.unitSpace} sqm space is perfect for {getBusinessSuggestion(unit.unitSpace, unit.unitType)}. 
            Located in {unit.level?.building?.buildingName || 'the building'} on {unit.level?.levelName || 'this floor'}, 
            this space offers excellent visibility and accessibility for your business.
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
            {isAuthenticated ? 'Book Appointment' : 'Login to Book'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};