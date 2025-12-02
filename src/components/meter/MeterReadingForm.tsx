import React, { useState, useEffect } from 'react';
import { meterReadingApi } from '../../api/MeterReadingAPI';
import { unitService } from '../../api/MeterReadingAPI'; // Changed from roomApi
import type { MeterReading, CreateMeterReadingRequest } from '../../types/meterReading';
import type { Unit, UtilityType } from '../../types/unit';
import { utilityApi } from '../../api/UtilityAPI';

interface MeterReadingFormProps {
  reading?: MeterReading;
  onSave: () => void;
  onCancel: () => void;
}

const MeterReadingForm: React.FC<MeterReadingFormProps> = ({ reading, onCancel, onSave }) => {
  const [formData, setFormData] = useState<CreateMeterReadingRequest>({
    unitId: 0, // ✅ Changed from roomId
    utilityTypeId: 0,
    readingDate: new Date().toISOString().split('T')[0],
    currentReading: 0
  });
  const [units, setUnits] = useState<Unit[]>([]); // ✅ Changed from rooms
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]); // ✅ Changed from filteredRooms
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [previousReading, setPreviousReading] = useState<MeterReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unitSearch, setUnitSearch] = useState(''); // ✅ Changed from roomSearch
  const [showUnitDropdown, setShowUnitDropdown] = useState(false); // ✅ Changed from showRoomDropdown
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null); // ✅ Changed from selectedRoom

  useEffect(() => {
    loadUnitsAndUtilityTypes(); // ✅ Changed from loadRoomsAndUtilityTypes
  }, []);

  useEffect(() => {
    if (reading) {
      setFormData({
        unitId: reading.unitId, // ✅ Changed from roomId
        utilityTypeId: reading.utilityTypeId,
        readingDate: reading.readingDate,
        currentReading: reading.currentReading
      });
      // Load previous reading when editing
      if (reading.unitId && reading.utilityTypeId) { // ✅ Changed from roomId
        loadPreviousReading(reading.unitId, reading.utilityTypeId); // ✅ Changed from roomId
      }
      // Find and set the selected unit
      const unit = units.find(u => u.id === reading.unitId); // ✅ Changed from room to unit
      if (unit) {
        setSelectedUnit(unit);
        setUnitSearch(unit.unitNumber); // ✅ Changed from roomNumber
      }
    }
  }, [reading, units]);

  // Filter units based on search input
  useEffect(() => {
    if (unitSearch.trim()) {
      const filtered = units.filter(unit =>
        unit.unitNumber.toLowerCase().includes(unitSearch.toLowerCase()) || // ✅ Changed from roomNumber
        (unit.currentTenantName && unit.currentTenantName.toLowerCase().includes(unitSearch.toLowerCase()))
      );
      setFilteredUnits(filtered);
      setShowUnitDropdown(true);
    } else {
      setFilteredUnits([]);
      setShowUnitDropdown(false);
    }
  }, [unitSearch, units]);

  const loadUnitsAndUtilityTypes = async () => { // ✅ Changed method name
    try {
      const [unitsResponse, utilityTypesResponse] = await Promise.all([
        unitService.getAllUnits(), // ✅ Changed from roomApi.getAll()
        utilityApi.getAll()
      ]);
      
      const unitsData = Array.isArray(unitsResponse) ? unitsResponse : [];
      const utilityTypesData = Array.isArray(utilityTypesResponse.data) ? utilityTypesResponse.data : [];
      
      setUnits(unitsData);
      setUtilityTypes(utilityTypesData);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    }
  };

  const handleUnitSelect = (unit: Unit) => { // ✅ Changed method name
    setSelectedUnit(unit);
    setFormData(prev => ({ ...prev, unitId: unit.id })); // ✅ Changed from roomId
    setUnitSearch(unit.unitNumber); // ✅ Changed from roomNumber
    setShowUnitDropdown(false);
    
    // Load previous reading if utility type is already selected
    if (formData.utilityTypeId) {
      loadPreviousReading(unit.id, formData.utilityTypeId);
    }
  };

  const handleUnitSearchChange = (value: string) => { // ✅ Changed method name
    setUnitSearch(value);
    setSelectedUnit(null);
    setFormData(prev => ({ ...prev, unitId: 0 })); // ✅ Changed from roomId
    setPreviousReading(null);
  };

  const handleUtilityTypeChange = async (utilityTypeId: number) => {
    setFormData(prev => ({ ...prev, utilityTypeId }));
    
    if (selectedUnit && utilityTypeId) { // ✅ Changed from selectedRoom
      await loadPreviousReading(selectedUnit.id, utilityTypeId); // ✅ Changed from selectedRoom
    } else {
      setPreviousReading(null);
    }
  };

  const loadPreviousReading = async (unitId: number, utilityTypeId: number) => { // ✅ Changed parameter name
    try {
      const previous = await meterReadingApi.getPreviousReading(unitId, utilityTypeId); // ✅ Changed from getPreviousReading(roomId, utilityTypeId)
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
    if (!formData.unitId || !formData.utilityTypeId || !formData.readingDate || !formData.currentReading) { // ✅ Changed from roomId
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
      unitId: 0, // ✅ Changed from roomId
      utilityTypeId: 0,
      readingDate: new Date().toISOString().split('T')[0],
      currentReading: 0
    });
    setUnitSearch(''); // ✅ Changed from roomSearch
    setSelectedUnit(null); // ✅ Changed from selectedRoom
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
          {/* Unit Search - Enhanced with autocomplete */} {/* ✅ Changed from Room Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit * {/* ✅ Changed from Room */}
            </label>
            <input
              type="text"
              value={unitSearch} // ✅ Changed from roomSearch
              onChange={(e) => handleUnitSearchChange(e.target.value)} // ✅ Changed method
              onFocus={() => unitSearch && setShowUnitDropdown(true)} // ✅ Changed variable
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type unit number or tenant name..." // ✅ Changed placeholder
              required
            />
            
            {/* Unit Dropdown */} {/* ✅ Changed from Room Dropdown */}
            {showUnitDropdown && filteredUnits.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredUnits.map(unit => ( // ✅ Changed from filteredRooms
                  <div
                    key={unit.id}
                    onClick={() => handleUnitSelect(unit)} // ✅ Changed method
                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {unit.unitNumber} {/* ✅ Changed from roomNumber */}
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        unit.unitType === 'ROOM' ? 'bg-blue-100 text-blue-800' :
                        unit.unitType === 'SPACE' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {unit.unitType}
                      </span>
                    </div>
                    {unit.currentTenantName && (
                      <div className="text-sm text-gray-600">
                        Tenant: {unit.currentTenantName}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {unit.isAvailable ? 'Available' : 'Occupied'}
                      {unit.unitSpace && ` • ${unit.unitSpace} sqm`} {/* ✅ Changed from roomSpace */}
                      {unit.hasMeter && ' • Has Meter'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Unit Info */} {/* ✅ Changed from Selected Room Info */}
            {selectedUnit && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedUnit.unitNumber} {/* ✅ Changed from roomNumber */}
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    selectedUnit.unitType === 'ROOM' ? 'bg-blue-100 text-blue-800' :
                    selectedUnit.unitType === 'SPACE' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedUnit.unitType}
                  </span>
                  {selectedUnit.currentTenantName && ` - ${selectedUnit.currentTenantName}`}
                  {!selectedUnit.hasMeter && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      No Meter
                    </span>
                  )}
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
              disabled={selectedUnit && !selectedUnit.hasMeter} // Disable if unit has no meter
            >
              <option value={0}>Select Utility Type</option>
              {utilityTypes.map(utility => (
                <option key={utility.id} value={utility.id}>
                  {utility.utilityName} 
                  {utility.ratePerUnit && ` - ${utility.ratePerUnit} MMK`}
                </option>
              ))}
            </select>
            {selectedUnit && !selectedUnit.hasMeter && (
              <p className="text-xs text-yellow-600 mt-1">
                This unit does not have a meter installed.
              </p>
            )}
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
              disabled={selectedUnit && !selectedUnit.hasMeter} // Disable if unit has no meter
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
        {selectedUnit && formData.utilityTypeId && !previousReading && !reading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> No previous reading found for {selectedUnit.unitNumber}. {/* ✅ Changed from roomNumber */}
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
            disabled={loading || !selectedUnit || (selectedUnit && !selectedUnit.hasMeter)} // Disable if no unit selected or unit has no meter
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