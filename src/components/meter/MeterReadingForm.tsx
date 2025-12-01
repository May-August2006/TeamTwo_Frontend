import React, { useState, useEffect } from 'react';
import { meterReadingApi } from '../../api/MeterReadingAPI';
import { roomApi } from '../../api/RoomAPI';
import type { MeterReading, CreateMeterReadingRequest } from '../../types/meterReading';
import type { Room, UtilityType } from '../../types/room';
import { utilityApi } from '../../api/UtilityAPI';

interface MeterReadingFormProps {
  reading?: MeterReading;
  onSave: () => void;
  onCancel: () => void;
}

const MeterReadingForm: React.FC<MeterReadingFormProps> = ({ reading, onCancel, onSave }) => {
  const [formData, setFormData] = useState<CreateMeterReadingRequest>({
    roomId: 0,
    utilityTypeId: 0,
    readingDate: new Date().toISOString().split('T')[0],
    currentReading: 0
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [previousReading, setPreviousReading] = useState<MeterReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    loadRoomsAndUtilityTypes();
  }, []);

  useEffect(() => {
    if (reading) {
      setFormData({
        roomId: reading.roomId,
        utilityTypeId: reading.utilityTypeId,
        readingDate: reading.readingDate,
        currentReading: reading.currentReading
      });
      // Load previous reading when editing
      if (reading.roomId && reading.utilityTypeId) {
        loadPreviousReading(reading.roomId, reading.utilityTypeId);
      }
      // Find and set the selected room
      const room = rooms.find(r => r.id === reading.roomId);
      if (room) {
        setSelectedRoom(room);
        setRoomSearch(room.roomNumber);
      }
    }
  }, [reading, rooms]);

  // Filter rooms based on search input
  useEffect(() => {
    if (roomSearch.trim()) {
      const filtered = rooms.filter(room =>
        room.roomNumber.toLowerCase().includes(roomSearch.toLowerCase()) ||
        (room.currentTenantName && room.currentTenantName.toLowerCase().includes(roomSearch.toLowerCase()))
      );
      setFilteredRooms(filtered);
      setShowRoomDropdown(true);
    } else {
      setFilteredRooms([]);
      setShowRoomDropdown(false);
    }
  }, [roomSearch, rooms]);

  const loadRoomsAndUtilityTypes = async () => {
    try {
      const [roomsResponse, utilityTypesResponse] = await Promise.all([
        roomApi.getAll(),
        utilityApi.getAll()
      ]);
      
      const roomsData = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
      const utilityTypesData = Array.isArray(utilityTypesResponse.data) ? utilityTypesResponse.data : [];
      
      setRooms(roomsData);
      setUtilityTypes(utilityTypesData);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setFormData(prev => ({ ...prev, roomId: room.id }));
    setRoomSearch(room.roomNumber);
    setShowRoomDropdown(false);
    
    // Load previous reading if utility type is already selected
    if (formData.utilityTypeId) {
      loadPreviousReading(room.id, formData.utilityTypeId);
    }
  };

  const handleRoomSearchChange = (value: string) => {
    setRoomSearch(value);
    setSelectedRoom(null);
    setFormData(prev => ({ ...prev, roomId: 0 }));
    setPreviousReading(null);
  };

  const handleUtilityTypeChange = async (utilityTypeId: number) => {
    setFormData(prev => ({ ...prev, utilityTypeId }));
    
    if (selectedRoom && utilityTypeId) {
      await loadPreviousReading(selectedRoom.id, utilityTypeId);
    } else {
      setPreviousReading(null);
    }
  };

  const loadPreviousReading = async (roomId: number, utilityTypeId: number) => {
    try {
      const previous = await meterReadingApi.getPreviousReading(roomId, utilityTypeId);
      setPreviousReading(previous);
    } catch (err) {
      setPreviousReading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form data
    if (!formData.roomId || !formData.utilityTypeId || !formData.readingDate || !formData.currentReading) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate current reading is positive
    if (formData.currentReading <= 0) {
      setError('Current reading must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      if (reading?.id) {
        await meterReadingApi.updateMeterReading(reading.id, formData);
      } else {
        await meterReadingApi.createMeterReading(formData);
      }
      onSave();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save meter reading';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      roomId: 0,
      utilityTypeId: 0,
      readingDate: new Date().toISOString().split('T')[0],
      currentReading: 0
    });
    setRoomSearch('');
    setSelectedRoom(null);
    setPreviousReading(null);
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const calculatedConsumption = formData.currentReading && previousReading?.currentReading
    ? (formData.currentReading - previousReading.currentReading).toFixed(2)
    : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {reading ? 'Edit Meter Reading' : 'Add New Meter Reading'}
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Room Search - Enhanced with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room *
            </label>
            <input
              type="text"
              value={roomSearch}
              onChange={(e) => handleRoomSearchChange(e.target.value)}
              onFocus={() => roomSearch && setShowRoomDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type room number or tenant name..."
              required
            />
            
            {/* Room Dropdown */}
            {showRoomDropdown && filteredRooms.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredRooms.map(room => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {room.roomNumber}
                    </div>
                    {room.currentTenantName && (
                      <div className="text-sm text-gray-600">
                        Tenant: {room.currentTenantName}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {room.isAvailable ? 'Available' : 'Occupied'}
                      {room.roomSpace && ` • ${room.roomSpace} sqft`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Room Info */}
            {selectedRoom && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedRoom.roomNumber}
                  {selectedRoom.currentTenantName && ` - ${selectedRoom.currentTenantName}`}
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    selectedRoom.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedRoom.isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Utility Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utility Type *
            </label>
            <select
              value={formData.utilityTypeId}
              onChange={(e) => handleUtilityTypeChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value={0}>Select Utility Type</option>
              {utilityTypes.map(utility => (
                <option key={utility.id} value={utility.id}>
                  {utility.utilityName} 
                  {utility.ratePerUnit && ` - ${utility.ratePerUnit} MMK`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reading Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reading Date *
            </label>
            <input
              type="date"
              value={formData.readingDate}
              onChange={(e) => setFormData(prev => ({ ...prev, readingDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Current Reading */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Reading *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.currentReading || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                currentReading: e.target.value ? parseFloat(e.target.value) : 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter current reading"
              required
            />
          </div>
        </div>

        {/* Previous Reading Display */}
        {previousReading && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Previous Reading:</strong> {previousReading.currentReading?.toFixed(2)} 
              ({new Date(previousReading.readingDate).toLocaleDateString()})
            </p>
            {calculatedConsumption && (
              <p className="text-sm text-blue-700 mt-1">
                <strong>Calculated Consumption:</strong> {calculatedConsumption}
              </p>
            )}
          </div>
        )}

        {/* No Previous Reading Message */}
        {selectedRoom && formData.utilityTypeId && !previousReading && !reading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> No previous reading found for {selectedRoom.roomNumber}. 
              This will be recorded as the first reading.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedRoom}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : reading ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeterReadingForm;