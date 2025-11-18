import React, { useState } from 'react';
import { RoomDetail } from './RoomDetail';
import type { Room } from '../../types/room';
import { Button } from '../common/ui/Button';


interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (id: number) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDelete }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const primaryImage = room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls[0] : null;

  const openDetailModal = () => {
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        {/* Image Section */}
        <div 
          className="cursor-pointer relative" 
          onClick={openDetailModal}
        >
          {primaryImage ? (
            <div className="h-48 bg-gray-200 overflow-hidden">
              <img
                src={primaryImage}
                alt={`Room ${room.roomNumber}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Image Count Badge */}
          {room.imageUrls && room.imageUrls.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
              +{room.imageUrls.length - 1}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
              View Details
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{room.roomNumber}</h3>
              <p className="text-gray-600 text-sm mt-1">
                {room.level.building.buildingName} - {room.level.levelName}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              room.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {room.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Room Type</p>
              <p className="font-medium text-gray-900">{room.roomType.typeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Space</p>
              <p className="font-medium text-gray-900">{room.roomSpace} sqm</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Rental Fee</p>
              <p className="font-medium text-gray-900">{room.rentalFee} MMK</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => onEdit(room)}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDelete(room.id)}
              variant="danger"
              size="sm"
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              onClick={openDetailModal}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Quick View
            </Button>
          </div>
        </div>
      </div>

      {/* Room Detail Modal */}
      <RoomDetail
        roomId={room.id}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};