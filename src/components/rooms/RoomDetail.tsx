import React, { useState, useEffect } from 'react';
import type { Room } from '../../types/room';
import { roomApi } from '../../api/RoomAPI';
import { LoadingSpinner } from '../manager/LoadingSpinner';
import { Button } from '../common/ui/Button';

interface RoomDetailProps {
  roomId: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (room: Room) => void;
  onDelete: (id: number) => void;
}

export const RoomDetail: React.FC<RoomDetailProps> = ({
  roomId,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [updatingUtility, setUpdatingUtility] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomDetails();
    }
  }, [isOpen, roomId]);

  const fetchRoomDetails = async () => {
    setIsLoading(true);
    try {
      const response = await roomApi.getById(roomId);
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Always show all utilities, not just active ones
  const toggleUtilityStatus = async (utilityTypeId: number, currentStatus: boolean) => {
    setUpdatingUtility(utilityTypeId);
    try {
      await roomApi.toggleRoomUtility(roomId, utilityTypeId, !currentStatus);
      
      // Re-fetch the complete room data to get updated utilities
      await fetchRoomDetails();
      
    } catch (error) {
      console.error('Error toggling utility status:', error);
    } finally {
      setUpdatingUtility(null);
    }
  };

  const openImageModal = (index: number = 0) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const nextImage = () => {
    if (room?.imageUrls) {
      setSelectedImageIndex((prev) => 
        prev === room.imageUrls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (room?.imageUrls) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? room.imageUrls!.length - 1 : prev - 1
      );
    }
  };

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
  };

  const handleEdit = () => {
    if (room) {
      onEdit(room);
      onClose();
    }
  };

  const handleDelete = () => {
    if (room) {
      onDelete(room.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Room Detail Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isLoading ? 'Loading...' : `Room ${room?.roomNumber}`}
              </h2>
              {!isLoading && room && (
                <p className="text-gray-600 mt-1">
                  {room.level.building.buildingName} • {room.level.levelName} • Floor {room.level.levelNumber}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : room ? (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Gallery Section */}
                  <div>
                    {/* Main Image */}
                    <div 
                      className="bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => room.imageUrls && room.imageUrls.length > 0 && openImageModal(0)}
                    >
                      {room.imageUrls && room.imageUrls.length > 0 ? (
                        <img
                          src={room.imageUrls[0]}
                          alt={`Room ${room.roomNumber}`}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500 mt-2">No images available</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {room.imageUrls && room.imageUrls.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {room.imageUrls.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => openImageModal(index)}
                            className="relative rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-16 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Room Details Section */}
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                        room.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {room.isAvailable ? 'Available for Rent' : 'Currently Occupied'}
                      </span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{room.rentalFee} MMK/month</p>
                        <p className="text-sm text-gray-500">Rental fee</p>
                      </div>
                    </div>

                    {/* Room Specifications */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Room Specifications</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Room Number</p>
                          <p className="font-medium">{room.roomNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Room Type</p>
                          <p className="font-medium">{room.roomType.typeName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Space Area</p>
                          <p className="font-medium">{room.roomSpace} sqm</p>
                        </div>
                      </div>
                    </div>

                    {/* ✅ FIXED: Utilities Section - Show ALL utilities regardless of isActive status */}
                    {room.utilities && room.utilities.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Utilities ({room.utilities.filter(u => u.isActive).length} active / {room.utilities.length} total)
                        </h3>
                        <div className="space-y-3">
                          {room.utilities.map((utility) => (
                            <div 
                              key={utility.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                utility.isActive 
                                  ? 'bg-white border-green-200' 
                                  : 'bg-gray-50 border-gray-300 opacity-70'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  utility.isActive ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                                <div>
                                  <p className={`font-medium ${
                                    utility.isActive ? 'text-gray-900' : 'text-gray-500'
                                  }`}>
                                    {utility.utilityName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {utility.ratePerUnit} MMK per unit • {utility.calculationMethod}
                                  </p>
                                  {!utility.isActive && (
                                    <p className="text-xs text-red-500 mt-1">Currently inactive</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => toggleUtilityStatus(utility.id, utility.isActive)}
                                variant={utility.isActive ? "secondary" : "primary"}
                                size="sm"
                                disabled={updatingUtility === utility.id}
                              >
                                {updatingUtility === utility.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : utility.isActive ? (
                                  'Deactivate'  
                                ) : (
                                  'Activate'    
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Building Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Branch</span>
                          <span className="font-medium">{room.level.building.branchName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Building</span>
                          <span className="font-medium">{room.level.building.buildingName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Level</span>
                          <span className="font-medium">{room.level.levelName} (Floor {room.level.levelNumber})</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Type Description */}
                    {room.roomType.description && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Type Description</h3>
                        <p className="text-gray-700">{room.roomType.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                  <Button
                    onClick={onClose}
                    variant="secondary"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant="primary"
                  >
                    Edit Room
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="danger"
                  >
                    Delete Room
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-red-500">Failed to load room details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageModalOpen && room?.imageUrls && room.imageUrls.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {room.imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={room.imageUrls[selectedImageIndex]}
                alt={`Room ${room.roomNumber} - Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {room.imageUrls.length}
            </div>

            {/* Thumbnail Strip */}
            {room.imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
                {room.imageUrls.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleThumbnailClick(index, e)}
                    className={`w-12 h-12 rounded border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-white ring-2 ring-blue-400' 
                        : 'border-gray-400 hover:border-white'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};