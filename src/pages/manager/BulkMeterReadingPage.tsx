// BulkMeterReadingPage.tsx - Updated version
import React, { useState, useEffect } from 'react';
import { Save, Upload, Download, Building2 } from 'lucide-react';
import { unitApi } from '../../api/UnitAPI';
import { meterReadingApi } from '../../api/MeterReadingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { buildingApi } from '../../api/BuildingAPI'; // ✅ Added building API
import type { Unit, UtilityType } from '../../types/unit';
import type { Building } from '../../types';

interface BulkReading {
  unitId: number;
  unitNumber: string;
  electricityReading: number;
  waterReading: number;
  previousElectricityReading?: number;
  previousWaterReading?: number;
}

const BulkMeterReadingPage: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [bulkReadings, setBulkReadings] = useState<BulkReading[]>([]);
  const [readingDate, setReadingDate] = useState<string>('');
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [electricityUtility, setElectricityUtility] = useState<UtilityType | null>(null);
  const [waterUtility, setWaterUtility] = useState<UtilityType | null>(null);
  const [buildingUnits, setBuildingUnits] = useState<Unit[]>([]);

  useEffect(() => {
    loadData();
    setReadingDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load buildings, units, and utilities in parallel
      const [buildingsResponse, unitsResponse, utilitiesResponse] = await Promise.all([
        buildingApi.getAll(), // Fetch real buildings
        unitApi.getAll(),
        utilityApi.getAll()
      ]);
      
      setBuildings(buildingsResponse.data || []);
      setUnits(unitsResponse.data || []);
      
      // Find electricity and water utility types
      const utils = utilitiesResponse.data || [];
      const electricUtility = utils.find((u: UtilityType) => 
        u.utilityName.toLowerCase().includes('electric'));
      const waterUtility = utils.find((u: UtilityType) => 
        u.utilityName.toLowerCase().includes('water'));
      
      setElectricityUtility(electricUtility || null);
      setWaterUtility(waterUtility || null);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingChange = async (selectedBuildingId: number) => {
    setBuildingId(selectedBuildingId);
    
    try {
      setLoading(true);
      
      // Fetch units for this building
      const unitsResponse = await buildingApi.getUnitsByBuilding(selectedBuildingId);
      console.log('Units response:', unitsResponse); // Add logging
      
      const buildingUnitsData = unitsResponse.data || [];
      
      // Filter units that have meters
      const unitsWithMeters = buildingUnitsData.filter((unit: any) => unit.hasMeter);
      
      setBuildingUnits(unitsWithMeters);
      
      // Create bulk readings array with previous readings
      const initialReadings: BulkReading[] = await Promise.all(
        unitsWithMeters.map(async (unit: Unit) => {
          let previousElectricityReading = 0;
          let previousWaterReading = 0;
          
          if (electricityUtility) {
            try {
              const prevElec = await meterReadingApi.getPreviousReading(
                unit.id,
                electricityUtility.id
              );
              previousElectricityReading = prevElec.currentReading || 0;
            } catch (error) {
              console.log('No previous electricity reading');
            }
          }
          
          if (waterUtility) {
            try {
              const prevWater = await meterReadingApi.getPreviousReading(
                unit.id,
                waterUtility.id
              );
              previousWaterReading = prevWater.currentReading || 0;
            } catch (error) {
              console.log('No previous water reading');
            }
          }
          
          return {
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            electricityReading: 0,
            waterReading: 0,
            previousElectricityReading,
            previousWaterReading
          };
        })
      );
      
      setBulkReadings(initialReadings);
      
    } catch (error: any) { // Changed to catch any type
      console.error('Error loading building units:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data);
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        alert('Unauthorized. Please log in again or check your permissions.');
      } else {
        alert('Error loading building units. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleReadingChange = (unitId: number, field: keyof BulkReading, value: string) => {
    setBulkReadings(prev => prev.map(reading => {
      if (reading.unitId === unitId) {
        return {
          ...reading,
          [field]: value === '' ? 0 : parseFloat(value) || 0
        };
      }
      return reading;
    }));
  };

  const downloadCSVTemplate = () => {
    if (!buildingId || buildingUnits.length === 0) {
      alert('Please select a building first');
      return;
    }

    // Create CSV headers
    const headers = ['Unit Number', 'Electricity Reading (kWh)', 'Water Reading (gal)'];
    
    // Create rows for each unit
    const rows = buildingUnits.map(unit => [
      unit.unitNumber,
      '', // Empty for user to fill
      ''  // Empty for user to fill
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meter-readings-template-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!buildingId) {
      alert('Please select a building first');
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        const rows = csvText.split('\n').filter(row => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const updatedReadings = [...bulkReadings];
        
        dataRows.forEach(row => {
          const columns = row.split(',');
          if (columns.length >= 3) {
            const unitNumber = columns[0].trim();
            const electricityReading = parseFloat(columns[1]) || 0;
            const waterReading = parseFloat(columns[2]) || 0;
            
            // Find the reading for this unit and update it
            const index = updatedReadings.findIndex(r => r.unitNumber === unitNumber);
            if (index !== -1) {
              updatedReadings[index] = {
                ...updatedReadings[index],
                electricityReading,
                waterReading
              };
            }
          }
        });
        
        setBulkReadings(updatedReadings);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      alert('Error processing CSV file. Please check the format.');
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const submitBulkReadings = async () => {
  if (!buildingId || !readingDate) {
    alert('Please select a building and reading date');
    return;
  }

  if (bulkReadings.length === 0) {
    alert('No readings to submit');
    return;
  }

  // Validate readings
  const invalidReadings = bulkReadings.filter(reading => {
    const elecConsumption = reading.electricityReading - (reading.previousElectricityReading || 0);
    const waterConsumption = reading.waterReading - (reading.previousWaterReading || 0);
    return elecConsumption < 0 || waterConsumption < 0;
  });

  if (invalidReadings.length > 0) {
    alert(`Found ${invalidReadings.length} readings where current reading is less than previous reading. Please check the values.`);
    return;
  }

  try {
    setLoading(true);
    
    // Prepare bulk requests
    const bulkRequests = bulkReadings.flatMap(reading => {
      const requests = [];
      
      // Electricity reading
      if (electricityUtility && reading.electricityReading > 0) {
        requests.push({
          unitId: reading.unitId,
          utilityTypeId: electricityUtility.id, // Using utilityTypeId as per Java controller
          currentReading: reading.electricityReading,
          readingDate: readingDate,
          notes: 'Bulk reading entry'
        });
      }
      
      // Water reading
      if (waterUtility && reading.waterReading > 0) {
        requests.push({
          unitId: reading.unitId,
          utilityTypeId: waterUtility.id, // Using utilityTypeId as per Java controller
          currentReading: reading.waterReading,
          readingDate: readingDate,
          notes: 'Bulk reading entry'
        });
      }
      
      return requests;
    });

    if (bulkRequests.length === 0) {
      alert('No valid readings to submit');
      return;
    }

    // Submit all readings in bulk
    await meterReadingApi.createBulkMeterReadings(bulkRequests);
    
    alert(`Successfully submitted ${bulkRequests.length} meter readings!`);
    
    // Reset form
    setBulkReadings([]);
    setBuildingId(null);
    setBuildingUnits([]);
    
  } catch (error) {
    console.error('Error submitting bulk readings:', error);
    alert('Error submitting readings. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bulk Meter Reading Entry</h1>
          </div>
          <p className="text-gray-600">Enter meter readings for all units in a building at once</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Building
              </label>
              <select
                value={buildingId || ''}
                onChange={(e) => handleBuildingChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={loading}
              >
                <option value="">Select building...</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingName} - {building.buildingType || 'Commercial'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reading Date
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={loading}
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={downloadCSVTemplate}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Template
              </button>
              <label className={`px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>
          
          {/* Building Info */}
          {buildingId && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Building:</span>
                  <span className="font-medium ml-2">
                    {buildings.find(b => b.id === buildingId)?.buildingName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Units with Meters:</span>
                  <span className="font-medium ml-2">{buildingUnits.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Electricity Utility:</span>
                  <span className="font-medium ml-2">
                    {electricityUtility ? electricityUtility.utilityName : 'Not configured'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Water Utility:</span>
                  <span className="font-medium ml-2">
                    {waterUtility ? waterUtility.utilityName : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Readings Table */}
        {bulkReadings.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Meter Readings for {buildings.find(b => b.id === buildingId)?.buildingName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Date: {readingDate} | Units: {bulkReadings.length}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total Consumption:</span>
                  <span className="font-medium ml-2">
                    {bulkReadings.reduce((sum, r) => sum + r.electricityReading + r.waterReading, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Electricity (kWh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Water (gal)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Readings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consumption
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkReadings.map((reading) => {
                    const elecConsumption = reading.electricityReading - (reading.previousElectricityReading || 0);
                    const waterConsumption = reading.waterReading - (reading.previousWaterReading || 0);
                    
                    return (
                      <tr key={reading.unitId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {reading.unitNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={reading.electricityReading || ''}
                              onChange={(e) => handleReadingChange(
                                reading.unitId, 
                                'electricityReading', 
                                e.target.value
                              )}
                              className="w-32 border border-gray-300 rounded px-3 py-1"
                              placeholder="Current reading"
                              disabled={loading}
                            />
                            <span className="text-xs text-gray-500">
                              Prev: {reading.previousElectricityReading?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={reading.waterReading || ''}
                              onChange={(e) => handleReadingChange(
                                reading.unitId, 
                                'waterReading', 
                                e.target.value
                              )}
                              className="w-32 border border-gray-300 rounded px-3 py-1"
                              placeholder="Current reading"
                              disabled={loading}
                            />
                            <span className="text-xs text-gray-500">
                              Prev: {reading.previousWaterReading?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            <div>Electricity: {reading.previousElectricityReading?.toFixed(2) || '0.00'}</div>
                            <div>Water: {reading.previousWaterReading?.toFixed(2) || '0.00'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">
                              Electricity: +{elecConsumption.toFixed(2)} kWh
                            </div>
                            <div className="text-blue-600 font-medium">
                              Water: +{waterConsumption.toFixed(2)} gal
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Submit Button */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <div>Total: {bulkReadings.length} units</div>
                  <div className="mt-1">
                    Total Electricity: {bulkReadings.reduce((sum, r) => sum + r.electricityReading, 0).toFixed(2)} kWh
                  </div>
                  <div>
                    Total Water: {bulkReadings.reduce((sum, r) => sum + r.waterReading, 0).toFixed(2)} gal
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setBulkReadings([]);
                      setBuildingId(null);
                      setBuildingUnits([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitBulkReadings}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Submit All Readings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!buildingId && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building2 className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Building</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose a building from the dropdown above to start entering meter readings for all units at once.
            </p>
            
            {/* Buildings Grid */}
            {buildings.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Buildings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {buildings.slice(0, 4).map((building) => (
                    <div 
                      key={building.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors"
                      onClick={() => handleBuildingChange(building.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{building.buildingName}</h5>
                          <p className="text-sm text-gray-500">{building.buildingType || 'Commercial'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Units</div>
                          <div className="font-medium">{building.totalUnits || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkMeterReadingPage;