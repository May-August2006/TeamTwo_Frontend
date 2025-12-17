// BulkMeterReadingPage.tsx - Complete fixed version
import React, { useState, useEffect } from 'react';
import { Save, Upload, Download, Building2 } from 'lucide-react';
import { unitApi } from '../../api/UnitAPI';
import { meterReadingApi } from '../../api/MeterReadingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { buildingApi } from '../../api/BuildingAPI';
import type { Unit, UtilityType } from '../../types/unit';
import type { Building } from '../../types';
import { jwtDecode } from 'jwt-decode';

interface BulkReading {
  unitId: number;
  unitNumber: string;
  electricityReading: number;
  waterReading: number;
  previousElectricityReading?: number;
  previousWaterReading?: number;
  isDisabled?: boolean;
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
  const [assignedBuildingId, setAssignedBuildingId] = useState<number | null>(null);
  const [occupiedUnits, setOccupiedUnits] = useState<Unit[]>([]);
  const [unitsWithMonthlyReadings, setUnitsWithMonthlyReadings] = useState<Set<number>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  // Get user role from JWT token
  const getUserRole = (): string => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded.role || 'ROLE_GUEST';
      } catch (error) {
        console.error('Error decoding token:', error);
        return 'ROLE_GUEST';
      }
    }
    return 'ROLE_GUEST';
  };

  useEffect(() => {
    loadData();
    setReadingDate(new Date().toISOString().split('T')[0]);
  }, []);

 // Update the loadData function in BulkMeterReadingPage.tsx

const loadData = async () => {
  try {
    setLoading(true);
    
    // First, get user's assigned building if they're not admin
    const userRole = getUserRole();
    setIsAdmin(userRole === 'ROLE_ADMIN');
    
    // Load utilities FIRST (regardless of user type)
    const utilitiesResponse = await utilityApi.getAll();
    const utils = utilitiesResponse.data || [];
    const electricUtility = utils.find((u: UtilityType) => 
      u.utilityName.toLowerCase().includes('electric'));
    const waterUtility = utils.find((u: UtilityType) => 
      u.utilityName.toLowerCase().includes('water'));
    
    setElectricityUtility(electricUtility || null);
    setWaterUtility(waterUtility || null);
    
    if (!isAdmin) {
      try {
        const assignedBuildingResponse = await buildingApi.getMyAssignedBuilding();
        if (assignedBuildingResponse.data) {
          setAssignedBuildingId(assignedBuildingResponse.data.id);
          // Auto-select assigned building
          await handleBuildingChange(assignedBuildingResponse.data.id);
          return; // Skip loading other buildings
        }
      } catch (error) {
        console.log('No assigned building for user');
      }
    }
    
    // Load all buildings for admin users
    const buildingsResponse = await buildingApi.getAll();
    setBuildings(buildingsResponse.data || []);
    
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
};

  const handleBuildingChange = async (selectedBuildingId: number) => {
    // Check if user has permission for this building
    if (assignedBuildingId && selectedBuildingId !== assignedBuildingId && !isAdmin) {
      alert('You can only access meter readings for your assigned building');
      return;
    }
    
    setBuildingId(selectedBuildingId);
    
    try {
      setLoading(true);
      
      // Get occupied units only
      const occupiedUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(selectedBuildingId);
      const occupiedUnitsData = occupiedUnitsResponse.data || [];
      
      // Filter only units with meters
      const unitsWithMeters = occupiedUnitsData.filter((unit: Unit) => unit.hasMeter);
      
      setOccupiedUnits(unitsWithMeters);
      setBuildingUnits(unitsWithMeters);
      
      // Check for monthly readings for each unit
      const unitsWithReadings = new Set<number>();
      for (const unit of unitsWithMeters) {
        // Check both electricity and water
        if (electricityUtility) {
          try {
            const hasElecReading = await meterReadingApi.checkMonthlyReading(
              unit.id, electricityUtility.id, readingDate
            );
            if (hasElecReading) unitsWithReadings.add(unit.id);
          } catch (error) {
            // No reading exists
          }
        }
        
        if (waterUtility) {
          try {
            const hasWaterReading = await meterReadingApi.checkMonthlyReading(
              unit.id, waterUtility.id, readingDate
            );
            if (hasWaterReading) unitsWithReadings.add(unit.id);
          } catch (error) {
            // No reading exists
          }
        }
      }
      
      setUnitsWithMonthlyReadings(unitsWithReadings);
      
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
            previousWaterReading,
            isDisabled: unitsWithReadings.has(unit.id)
          };
        })
      );
      
      setBulkReadings(initialReadings);
      
    } catch (error: any) {
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

  const validateCSVFormat = (csvText: string): boolean => {
    const rows = csvText.split('\n').filter(row => row.trim());
    if (rows.length < 2) return false;
    
    const headers = rows[0].split(',').map(h => h.trim());
    const expectedHeaders = ['Unit Number', 'Electricity Reading (kWh)', 'Water Reading (gal)'];
    
    return expectedHeaders.every(header => headers.includes(header));
  };

  const processCSVData = async (csvText: string): Promise<any[]> => {
  const rows = csvText.split('\n').filter(row => row.trim());
  const headers = rows[0].split(',').map(h => h.trim());
  const dataRows = rows.slice(1);
  
  const processedReadings = [];
  const errors: string[] = [];
  
  // DEBUG: Log what units we have
  console.log('Occupied units with meters:', occupiedUnits.map(u => ({ id: u.id, number: u.unitNumber })));
  
  for (const [index, row] of dataRows.entries()) {
    const columns = row.split(',').map(col => col.trim());
    
    if (columns.length >= 3) {
      const unitNumber = columns[0];
      const electricityReading = parseFloat(columns[1]);
      const waterReading = parseFloat(columns[2]);
      
      console.log(`Processing row ${index + 2}: Unit ${unitNumber}, Elec: ${electricityReading}, Water: ${waterReading}`);
      
      // Validate numeric values (allow 0)
      if (isNaN(electricityReading) || isNaN(waterReading)) {
        errors.push(`Row ${index + 2}: Invalid numeric values`);
        continue;
      }
      
      // Find unit
      const unit = occupiedUnits.find(u => u.unitNumber === unitNumber);
      
      if (!unit) {
        errors.push(`Row ${index + 2}: Unit ${unitNumber} not found or doesn't have meters`);
        continue;
      }
      
      // Check if unit already has reading for this month
      if (unitsWithMonthlyReadings.has(unit.id)) {
        errors.push(`Row ${index + 2}: Unit ${unitNumber} already has readings for this month`);
        continue;
      }
      
      processedReadings.push({
        unitId: unit.id,
        electricityReading,
        waterReading
      });
      
      console.log(`Added unit ${unitNumber} (ID: ${unit.id}) to processed readings`);
    }
  }
  
  console.log('Processed readings:', processedReadings);
  console.log('Errors:', errors);
  
  if (errors.length > 0) {
    alert(`Some rows were skipped:\n${errors.join('\n')}`);
  }
  
  return processedReadings;
};

  const submitBulkReadingsFromCSV = async (processedReadings: any[]) => {
  try {
    console.log('Submitting CSV readings:', processedReadings);
    console.log('Electricity utility:', electricityUtility);
    console.log('Water utility:', waterUtility);
    console.log('Reading date:', readingDate);
    
    const bulkRequests = processedReadings.flatMap(reading => {
      const requests = [];
      
      // Check if electricity utility exists and reading is valid (>= 0)
      if (electricityUtility && reading.electricityReading >= 0) { // Changed > to >=
        console.log(`Adding electricity reading for unit ${reading.unitId}: ${reading.electricityReading}`);
        requests.push({
          unitId: reading.unitId,
          utilityTypeId: electricityUtility.id,
          currentReading: reading.electricityReading,
          readingDate: readingDate,
          notes: 'Imported from CSV'
        });
      } else if (!electricityUtility) {
        console.log('No electricity utility configured');
      }
      
      // Check if water utility exists and reading is valid (>= 0)
      if (waterUtility && reading.waterReading >= 0) { // Changed > to >=
        console.log(`Adding water reading for unit ${reading.unitId}: ${reading.waterReading}`);
        requests.push({
          unitId: reading.unitId,
          utilityTypeId: waterUtility.id,
          currentReading: reading.waterReading,
          readingDate: readingDate,
          notes: 'Imported from CSV'
        });
      } else if (!waterUtility) {
        console.log('No water utility configured');
      }
      
      console.log('Requests for this reading:', requests);
      return requests;
    });
    
    console.log('Total bulk requests:', bulkRequests);
    console.log('Bulk requests length:', bulkRequests.length);
    
    if (bulkRequests.length === 0) {
      alert('No valid readings to submit from CSV. Check if utilities are configured and readings are valid.');
      return;
    }
    
    // Try the new API first, fallback to old API
    try {
      console.log('Attempting to submit via validated bulk API...');
      // First try the new validated API
      await meterReadingApi.createBulkValidatedReadings(bulkRequests);
      console.log('Submitted via validated API');
    } catch (apiError) {
      console.log('Validated API not available, using regular API', apiError);
      // Fallback to regular bulk API
      await meterReadingApi.createBulkMeterReadings(bulkRequests);
      console.log('Submitted via regular API');
    }
    
    alert(`Successfully submitted ${bulkRequests.length} readings from CSV!`);
    
    // Refresh the page
    if (buildingId) {
      await handleBuildingChange(buildingId);
    }
    
  } catch (error: any) {
    console.error('Error submitting CSV readings:', error);
    console.error('Error response:', error.response);
    const errorMessage = error.response?.data?.message || 
                       error.message ||
                       'Error submitting readings. Please check the format and try again.';
    alert(`Failed to submit CSV readings: ${errorMessage}`);
  }
};

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!buildingId || !readingDate) {
      alert('Please select a building and reading date first');
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        
        // Validate CSV format
        if (!validateCSVFormat(csvText)) {
          alert('Invalid CSV format. Please use the provided template.');
          event.target.value = '';
          return;
        }
        
        const processedReadings = await processCSVData(csvText);
        
        if (processedReadings.length > 0) {
          // Auto-submit the processed readings
          await submitBulkReadingsFromCSV(processedReadings);
        } else {
          alert('No valid readings found in CSV file');
        }
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      alert('Error processing CSV file. Please check the format.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const submitBulkReadings = async () => {
    if (!buildingId || !readingDate) {
      alert('Please select a building and reading date');
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
            utilityTypeId: electricityUtility.id,
            currentReading: reading.electricityReading,
            readingDate: readingDate,
            notes: 'Bulk reading entry'
          });
        }
        
        // Water reading
        if (waterUtility && reading.waterReading > 0) {
          requests.push({
            unitId: reading.unitId,
            utilityTypeId: waterUtility.id,
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
      
      // Submit all readings in bulk using validated API
      await meterReadingApi.createBulkMeterReadings(bulkRequests);
      
      alert(`Successfully submitted ${bulkRequests.length} meter readings!`);
      
      // Refresh the page
      if (buildingId) {
        await handleBuildingChange(buildingId);
      }
      
    } catch (error: any) {
      console.error('Error submitting bulk readings:', error);
      const errorMessage = error.response?.data?.message || 
                         'Error submitting readings. Please try again.';
      alert(`Failed to submit readings: ${errorMessage}`);
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
          {!isAdmin && assignedBuildingId && (
            <p className="text-sm text-blue-600 mt-1">
              You are assigned to: {buildings.find(b => b.id === assignedBuildingId)?.buildingName}
            </p>
          )}
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
                disabled={loading || (assignedBuildingId && !isAdmin)}
              >
                {isAdmin ? (
                  <>
                    <option value="">Select building...</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.buildingName} - {building.buildingType || 'Commercial'}
                      </option>
                    ))}
                  </>
                ) : assignedBuildingId ? (
                  <>
                    <option value={assignedBuildingId}>
                      {buildings.find(b => b.id === assignedBuildingId)?.buildingName || 'My Assigned Building'}
                    </option>
                  </>
                ) : (
                  <option value="">No building assigned</option>
                )}
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
                disabled={loading || !buildingId}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Template
              </button>
              <label className={`px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center cursor-pointer ${loading || !buildingId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading || !buildingId}
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
                  <span className="text-gray-600">Occupied Units with Meters:</span>
                  <span className="font-medium ml-2">{occupiedUnits.length}</span>
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
              {unitsWithMonthlyReadings.size > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ {unitsWithMonthlyReadings.size} units already have readings for this month and are disabled
                  </p>
                </div>
              )}
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
                    {unitsWithMonthlyReadings.size > 0 && ` (${unitsWithMonthlyReadings.size} disabled)`}
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
                    const isDisabled = unitsWithMonthlyReadings.has(reading.unitId);
                    
                    return (
                      <tr key={reading.unitId} className={`hover:bg-gray-50 ${isDisabled ? 'bg-gray-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {reading.unitNumber}
                            {isDisabled && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Already Read
                              </span>
                            )}
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
                              className={`w-32 border rounded px-3 py-1 ${
                                isDisabled || loading
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                                  : 'border-gray-300'
                              }`}
                              placeholder="Current reading"
                              disabled={loading || isDisabled}
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
                              className={`w-32 border rounded px-3 py-1 ${
                                isDisabled || loading
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                                  : 'border-gray-300'
                              }`}
                              placeholder="Current reading"
                              disabled={loading || isDisabled}
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
                            <div className={`font-medium ${elecConsumption >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Electricity: {elecConsumption >= 0 ? '+' : ''}{elecConsumption.toFixed(2)} kWh
                            </div>
                            <div className={`font-medium ${waterConsumption >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              Water: {waterConsumption >= 0 ? '+' : ''}{waterConsumption.toFixed(2)} gal
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
                    disabled={loading || bulkReadings.filter(r => !unitsWithMonthlyReadings.has(r.unitId)).length === 0}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isAdmin ? 'Select a Building' : 'No Building Assigned'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {isAdmin 
                ? 'Choose a building from the dropdown above to start entering meter readings for all units at once.'
                : 'You have not been assigned to any building. Please contact your administrator.'
              }
            </p>
            
            {/* Buildings Grid - Only show for admin */}
            {isAdmin && buildings.length > 0 && (
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