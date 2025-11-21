import React from 'react';
import type { Room } from '../../types/room';
import { RoomCard } from './RoomCard';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';

interface RoomListProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  onEdit,
  onDelete,
  isLoading = false,
  viewMode = 'grid'
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
        <p className="text-gray-500">Try adjusting your search filters or create a new room.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 p-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1'
    }`}>
      {rooms.map(room => (
        <RoomCard
          key={room.id}
          room={room}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};