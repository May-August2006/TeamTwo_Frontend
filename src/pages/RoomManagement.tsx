import React, { useState, useEffect } from 'react';
import { RoomAddForm } from '../components/rooms/RoomAddForm';
import { RoomEditForm } from '../components/rooms/RoomEditForm';
import { RoomTypeForm } from '../components/rooms/RoomTypeForm';
import { RoomSearch } from '../components/rooms/RoomSearch';
import { RoomList } from '../components/rooms/RoomList';
import { Button } from '../components/common/ui/Button';
import { roomTypeApi, roomApi } from '../api/RoomAPI';
import type { Room, RoomSearchParams, RoomType } from '../types/room';
import { useRooms } from '../hooks/useRooms';
import { getAccessToken, isTokenExpired, clearAuthData } from '../Auth';
import { Modal } from '../components/common/ui/Modal';

export const RoomManagement: React.FC = () => {
  const {
    filteredRooms,
    loading,
    error,
    searchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    resetSearch,
    setError
  } = useRooms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>();
  const [editingRoomType, setEditingRoomType] = useState<RoomType | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [roomTypeLoading, setRoomTypeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'roomTypes'>('rooms');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);

  // Simple auth check - useRoom hook ကနေ auto handle ဖြစ်သွားမယ်
  useEffect(() => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      console.log('Authentication required...');
      // useRoom hook ကနေ auto redirect ဖြစ်သွားမယ်
    }
  }, []);

  // Load room types
  useEffect(() => {
    if (activeTab === 'roomTypes') {
      loadRoomTypes();
    }
  }, [activeTab]);

  const loadRoomTypes = async () => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to load room types');
      return;
    }

    setRoomTypesLoading(true);
    try {
      const response = await roomTypeApi.getAll();
      setRoomTypes(response.data);
    } catch (err: any) {
      console.error('Error loading room types:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        clearAuthData();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        setError('Failed to load room types');
      }
    } finally {
      setRoomTypesLoading(false);
    }
  };

  // Handle room creation with FormData
  const handleCreateRoom = async (formData: FormData) => {
    setFormLoading(true);
    const success = await createRoom(formData);
    setFormLoading(false);
    
    if (success) {
      setIsModalOpen(false);
    }
  };

  // Handle room update with FormData
  const handleUpdateRoom = async (formData: FormData) => {
    if (!editingRoom) return;
    
    setFormLoading(true);
    const success = await updateRoom(editingRoom.id, formData);
    setFormLoading(false);
    
    if (success) {
      setIsModalOpen(false);
      setEditingRoom(undefined);
    }
  };

  // Handle image removal
  const handleImageRemove = async (roomId: number, imageUrl: string) => {
    try {
      await roomApi.removeImage(roomId, imageUrl);
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error removing image:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        clearAuthData();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      return Promise.reject(error);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    const success = await deleteRoom(id);
    if (success) {
      // Success handled in hook
    }
  };

  const handleCreateRoomType = async (roomTypeData: any) => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to create room types');
      return;
    }

    setRoomTypeLoading(true);
    try {
      await roomTypeApi.create(roomTypeData);
      setIsRoomTypeModalOpen(false);
      await loadRoomTypes();
    } catch (err: any) {
      console.error('Error creating room type:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        clearAuthData();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        setError('Failed to create room type');
      }
    } finally {
      setRoomTypeLoading(false);
    }
  };

  const handleUpdateRoomType = async (roomTypeData: any) => {
    if (!editingRoomType) return;
    
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to update room types');
      return;
    }

    setRoomTypeLoading(true);
    try {
      await roomTypeApi.update(editingRoomType.id, roomTypeData);
      setIsRoomTypeModalOpen(false);
      setEditingRoomType(undefined);
      await loadRoomTypes();
    } catch (err: any) {
      console.error('Error updating room type:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        clearAuthData();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        setError('Failed to update room type');
      }
    } finally {
      setRoomTypeLoading(false);
    }
  };

  const handleDeleteRoomType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room type? This action cannot be undone.')) {
      return;
    }

    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to delete room types');
      return;
    }

    try {
      await roomTypeApi.delete(id);
      await loadRoomTypes();
    } catch (err: any) {
      console.error('Error deleting room type:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        clearAuthData();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        setError('Failed to delete room type');
      }
    }
  };

  const handleSearch = async (searchParams: RoomSearchParams) => {
    await searchRooms(searchParams);
  };

  const openCreateModal = () => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to create rooms');
      return;
    }
    setEditingRoom(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to edit rooms');
      return;
    }
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const openCreateRoomTypeModal = () => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to create room types');
      return;
    }
    setEditingRoomType(undefined);
    setIsRoomTypeModalOpen(true);
  };

  const openEditRoomTypeModal = (roomType: RoomType) => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setError('Please login to edit room types');
      return;
    }
    setEditingRoomType(roomType);
    setIsRoomTypeModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsRoomTypeModalOpen(false);
    setEditingRoom(undefined);
    setEditingRoomType(undefined);
    setError(null);
  };

  // Render correct form based on context
  const renderRoomForm = () => {
    if (editingRoom) {
      return (
        <RoomEditForm
          room={editingRoom}
          onSubmit={handleUpdateRoom}
          onCancel={closeModal}
          isLoading={formLoading}
          onImageRemove={handleImageRemove}
        />
      );
    } else {
      return (
        <RoomAddForm
          onSubmit={handleCreateRoom}
          onCancel={closeModal}
          isLoading={formLoading}
        />
      );
    }
  };

  return (
    <div className="p-6">
      {/* Main Controls Section - Tabs and Add Button in same line */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 flex-1">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'rooms'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Rooms ({filteredRooms.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('roomTypes')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'roomTypes'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Room Types ({roomTypes.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Add Button - Changes based on active tab */}
        {activeTab === 'rooms' ? (
          <Button
            onClick={openCreateModal}
            size="sm"
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room
          </Button>
        ) : (
          <Button
            onClick={openCreateRoomTypeModal}
            size="sm"
            className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room Type
          </Button>
        )}
      </div>

      {/* Search Section - Only for Rooms tab */}
      {activeTab === 'rooms' && (
        <div className="mb-6">
          <RoomSearch
            onSearch={handleSearch}
            onReset={resetSearch}
            isLoading={loading}
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Rooms Tab Content */}
        {activeTab === 'rooms' && (
          <RoomList
            rooms={filteredRooms}
            onEdit={openEditModal}
            onDelete={handleDeleteRoom}
            isLoading={loading}
            viewMode="grid"
          />
        )}

        {/* Room Types Tab Content */}
        {activeTab === 'roomTypes' && (
          <div className="p-6">
            {roomTypesLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes.map(roomType => (
                  <div key={roomType.id} className="bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{roomType.typeName}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditRoomTypeModal(roomType)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRoomType(roomType.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{roomType.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Created: {new Date(roomType.createdAt).toLocaleDateString()}</span>
                      <Button
                        onClick={() => openEditRoomTypeModal(roomType)}
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {roomTypes.length === 0 && !roomTypesLoading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No room types found</h3>
                <p className="text-gray-500 mb-4">Create your first room type to get started.</p>
                <Button
                  onClick={openCreateRoomTypeModal}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Room Type
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoom ? 'Edit Room' : 'Create New Room'}
        size="lg"
      >
        {renderRoomForm()}
      </Modal>

      {/* Create/Edit Room Type Modal */}
      <Modal
        isOpen={isRoomTypeModalOpen}
        onClose={closeModal}
        title={editingRoomType ? 'Edit Room Type' : 'Create New Room Type'}
        size="md"
      >
        <RoomTypeForm
          roomType={editingRoomType}
          onSubmit={editingRoomType ? handleUpdateRoomType : handleCreateRoomType}
          onCancel={closeModal}
          isLoading={roomTypeLoading}
        />
      </Modal>
    </div>
  );
};

export default RoomManagement;