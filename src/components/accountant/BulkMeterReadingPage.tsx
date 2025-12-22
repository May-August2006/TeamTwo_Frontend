// BulkMeterReadingPage.tsx - Fixed version with debounced status check
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Upload, Download, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { meterReadingApi, utilityTypeApi } from '../../api/MeterReadingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { buildingApi } from '../../api/BuildingAPI';
import type { Unit, UtilityType } from '../../types/unit';
import type { Building } from '../../types';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';

interface BulkReading {
  unitId: number;
  unitNumber: string;
  unitType: 'ROOM' | 'HALL';
  electricityReading: number;
  waterReading: number;
  previousElectricityReading?: number;
  previousWaterReading?: number;
  hasMonthlyReading: boolean;
  hasElectricityReading: boolean;
  hasWaterReading: boolean;
  isDisabled: boolean;
}

const BulkMeterReadingPage: React.FC = () => {
  const [bulkReadings, setBulkReadings] = useState<BulkReading[]>([]);
  const [readingDate, setReadingDate] = useState<string>("");
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [electricityUtility, setElectricityUtility] = useState<UtilityType | null>(null);
  const [waterUtility, setWaterUtility] = useState<UtilityType | null>(null);
  const [buildingUnits, setBuildingUnits] = useState<Unit[]>([]);
  const [assignedBuildingId, setAssignedBuildingId] = useState<number | null>(
    null
  );
  const [occupiedUnits, setOccupiedUnits] = useState<Unit[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [buildingHasAllReadings, setBuildingHasAllReadings] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({
    type: null,
    message: ''
  });

  // Refs for debouncing
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>('');

  const pendingUnits = bulkReadings.filter(r => !r.hasMonthlyReading);

  // Get user role from JWT token
  const getUserRole = (): string => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded.role || "ROLE_GUEST";
      } catch (error) {
        console.error("Error decoding token:", error);
        return "ROLE_GUEST";
      }
    }
    return "ROLE_GUEST";
  };

  // Debounced status check function
const checkReadingStatus = useCallback(async (force: boolean = false) => {
  if (!buildingId || !readingDate || !electricityUtility || !waterUtility || bulkReadings.length === 0) {
    return;
  }
  
  const checkKey = `${buildingId}-${readingDate}-${electricityUtility.id}-${waterUtility.id}`;
  
  if (!force && lastCheckedRef.current === checkKey) {
    return;
  }
  
  if (checkTimeoutRef.current) {
    clearTimeout(checkTimeoutRef.current);
  }
  
  lastCheckedRef.current = checkKey;
  
  try {
    setCheckingStatus(true);
    
    const updatedReadings = await Promise.all(
      bulkReadings.map(async (reading) => {
        let hasElectricityReading = false;
        let hasWaterReading = false;
        let previousElectricityReading = reading.previousElectricityReading || 0;
        let previousWaterReading = reading.previousWaterReading || 0;
        
        // First, try to get previous readings
        try {
          const electricityPrev = await meterReadingApi.getPreviousReading(
            reading.unitId,
            electricityUtility.id
          );
          previousElectricityReading = electricityPrev?.currentReading || 0;
        } catch (error) {
          console.log(`No previous electricity reading for unit ${reading.unitId}`);
          previousElectricityReading = 0;
        }
        
        try {
          const waterPrev = await meterReadingApi.getPreviousReading(
            reading.unitId,
            waterUtility.id
          );
          previousWaterReading = waterPrev?.currentReading || 0;
        } catch (error) {
          console.log(`No previous water reading for unit ${reading.unitId}`);
          previousWaterReading = 0;
        }
        
        // Now check if readings exist for current month
        try {
          const elecStatus = await meterReadingApi.checkMonthlyReading(
            reading.unitId,
            electricityUtility.id,
            readingDate
          );
          hasElectricityReading = elecStatus.hasReading;
        } catch (error: any) {
          if (error.response?.status !== 401) {
            console.log(`No electricity reading for unit ${reading.unitId}`);
          }
        }
        
        try {
  const electricityPrev = await meterReadingApi.getPreviousReading(
    reading.unitId,
    electricityUtility.id
  );
  console.log(`Unit ${reading.unitId} - Previous electricity:`, electricityPrev);
  previousElectricityReading = electricityPrev?.currentReading || 0;
} catch (error: any) {
          if (error.response?.status !== 401) {
            console.log(`No water reading for unit ${reading.unitId}`);
          }
        }
        
        const hasAnyReading = hasElectricityReading || hasWaterReading;
        
        return {
          ...reading,
          hasMonthlyReading: hasAnyReading,
          hasElectricityReading,
          hasWaterReading,
          isDisabled: hasAnyReading,
          previousElectricityReading,
          previousWaterReading
        };
      })
    );
    
    setBulkReadings(updatedReadings);
    
    const allUnitsRead = updatedReadings.every(r => r.hasMonthlyReading);
    setBuildingHasAllReadings(allUnitsRead);
    
  } catch (error) {
    console.error('Error checking reading status:', error);
    lastCheckedRef.current = '';
  } finally {
    setCheckingStatus(false);
  }
}, [buildingId, readingDate, electricityUtility, waterUtility, bulkReadings]);

// Update the useEffect to use a very short debounce (50ms) just for batching
useEffect(() => {
  if (buildingId && readingDate && electricityUtility && waterUtility) {
    // Clear any pending checks
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // Check immediately (no delay) when date changes
    checkTimeoutRef.current = setTimeout(() => {
      if (bulkReadings.length > 0) {
        // If we already have readings loaded, check their status
        checkReadingStatus();
      } else {
        // If no readings yet, just check if building has all readings for this date
        checkBuildingReadingsStatus();
      }
    }, 0); // 0ms delay - immediate but non-blocking
  }
  
  return () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
  };
}, [readingDate, buildingId, electricityUtility?.id, waterUtility?.id]);

// Add this new function to check if building has readings for the date
const checkBuildingReadingsStatus = useCallback(async () => {
  if (!buildingId || !readingDate || !electricityUtility || !waterUtility) {
    return;
  }
  
  try {
    setCheckingStatus(true);
    
    // Get all units for this building
    const occupiedUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(buildingId);
    const occupiedUnitsData = occupiedUnitsResponse.data || [];
    
    // Filter only ROOM and HALL type units with meters
    const unitsWithMeters = occupiedUnitsData.filter((unit: Unit) => 
      unit.hasMeter && (unit.unitType === 'ROOM' || unit.unitType === 'HALL')
    );
    
    if (unitsWithMeters.length === 0) {
      setBuildingHasAllReadings(false);
      return;
    }
    
    // Check if ALL units have readings for this date
    let allUnitsHaveReadings = true;
    
    for (const unit of unitsWithMeters) {
      try {
        // Check electricity reading
        const elecStatus = await meterReadingApi.checkMonthlyReading(
          unit.id,
          electricityUtility.id,
          readingDate
        );
        
        // Check water reading
        const waterStatus = await meterReadingApi.checkMonthlyReading(
          unit.id,
          waterUtility.id,
          readingDate
        );
        
        if (!elecStatus.hasReading && !waterStatus.hasReading) {
          allUnitsHaveReadings = false;
          break;
        }
      } catch (error) {
        // If any check fails, assume not all have readings
        allUnitsHaveReadings = false;
        break;
      }

      // Load all buildings for admin users
      const buildingsResponse = await buildingApi.getAll();
      setBuildings(buildingsResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
    
    setBuildingHasAllReadings(allUnitsHaveReadings);
    
  } catch (error) {
    console.error('Error checking building readings status:', error);
    setBuildingHasAllReadings(false);
  } finally {
    setCheckingStatus(false);
  }
}, [buildingId, readingDate, electricityUtility, waterUtility]);

  // Initialize with today's date
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setReadingDate(`${year}-${month}-${day}`);
    
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user role
      const userRole = getUserRole();
      setIsAdmin(userRole === 'ROLE_ADMIN');

      // Load utilities
      try {
        const utils = await utilityTypeApi.getAllUtilityTypes();
        
        const electricUtility = utils.find((u: UtilityType) => 
          u.utilityName.toLowerCase().includes('electric')
        );
        const waterUtility = utils.find((u: UtilityType) => 
          u.utilityName.toLowerCase().includes('water')
        );
        
        setElectricityUtility(electricUtility || null);
        setWaterUtility(waterUtility || null);
        
      } catch (utilityError) {
        console.error('Error loading utilities:', utilityError);
        try {
          const utilitiesResponse = await utilityApi.getAll();
          const utils = utilitiesResponse.data || [];
          const electricUtility = utils.find((u: UtilityType) => 
            u.utilityName.toLowerCase().includes('electric'));
          const waterUtility = utils.find((u: UtilityType) => 
            u.utilityName.toLowerCase().includes('water'));
          
          setElectricityUtility(electricUtility || null);
          setWaterUtility(waterUtility || null);
        } catch (error) {
          console.error('Failed to load utilities:', error);
        }
      }
      
      // Get assigned building
      let assignedBuilding: Building | null = null;
      try {
        const assignedBuildingResponse = await buildingApi.getMyAssignedBuilding();
        if (assignedBuildingResponse.data) {
          assignedBuilding = assignedBuildingResponse.data;
          setAssignedBuildingId(assignedBuilding.id);
          setBuildings([assignedBuilding]);
          
          // Auto-select assigned building for non-admin users
          if (!isAdmin) {
            await handleBuildingChange(assignedBuilding.id);
            return;
          }
        }
      } catch (error) {
        console.log('No assigned building for user');
      }
      
      // Load all buildings for admin users
      if (isAdmin) {
        const buildingsResponse = await buildingApi.getAll();
        setBuildings(buildingsResponse.data || []);
        
        if (assignedBuilding) {
          await handleBuildingChange(assignedBuilding.id);
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to load data. Please refresh the page.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingChange = async (selectedBuildingId: number) => {
  // Check permissions
  if (assignedBuildingId && selectedBuildingId !== assignedBuildingId && !isAdmin) {
    setUploadStatus({
      type: 'error',
      message: 'You can only access meter readings for your assigned building'
    });
    return;
  }
  
  setBuildingId(selectedBuildingId);
  lastCheckedRef.current = ''; // Reset last checked when building changes
  
  try {
    setLoading(true);
    setUploadStatus({ type: null, message: '' });
    setBuildingHasAllReadings(false); // Reset initially
    
    // Get occupied units only
    const occupiedUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(selectedBuildingId);
    const occupiedUnitsData = occupiedUnitsResponse.data || [];

    
    
    // Filter only ROOM and HALL type units with meters
    const unitsWithMeters = occupiedUnitsData.filter((unit: Unit) => 
      unit.hasMeter && (unit.unitType === 'ROOM' || unit.unitType === 'HALL')
    );
    
    setOccupiedUnits(unitsWithMeters);
    setBuildingUnits(unitsWithMeters);
    
    // Initialize readings with default values
    const initialReadings: BulkReading[] = unitsWithMeters.map((unit: Unit) => ({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      unitType: unit.unitType as 'ROOM' | 'HALL',
      electricityReading: 0,
      waterReading: 0,
      previousElectricityReading: 0,
      previousWaterReading: 0,
      hasMonthlyReading: false,
      hasElectricityReading: false,
      hasWaterReading: false,
      isDisabled: false
    }));
    
    setBulkReadings(initialReadings);
    
    // Check building readings status immediately after loading units
    if (readingDate && electricityUtility && waterUtility) {
      await checkBuildingReadingsStatus();
    }
    
  } catch (error: any) {
    console.error('Error loading building units:', error);
    setUploadStatus({
      type: 'error',
      message: 'Error loading building units. Please try again.'
    });
  } finally {
    setLoading(false);
  }
};

// Also add this useEffect to check when utilities are loaded
useEffect(() => {
  if (buildingId && readingDate && electricityUtility && waterUtility && bulkReadings.length === 0) {
    // If we have a building and date but no readings yet, check building status
    checkBuildingReadingsStatus();
  }
}, [electricityUtility, waterUtility]);

  const handleReadingChange = (unitId: number, field: keyof BulkReading, value: string) => {
    setBulkReadings(prev => prev.map(reading => {
      if (reading.unitId === unitId) {
        const numValue = value === '' ? 0 : parseFloat(value) || 0;
        
        // Validate that new reading is >= previous reading
        if (field === 'electricityReading' && reading.previousElectricityReading && numValue < reading.previousElectricityReading) {
          setUploadStatus({
            type: 'warning',
            message: `Electricity reading for unit ${reading.unitNumber} cannot be less than previous reading (${reading.previousElectricityReading})`
          });
          return reading;
        }
        
        if (field === 'waterReading' && reading.previousWaterReading && numValue < reading.previousWaterReading) {
          setUploadStatus({
            type: 'warning',
            message: `Water reading for unit ${reading.unitNumber} cannot be less than previous reading (${reading.previousWaterReading})`
          });
          return reading;
        }
        
        return {
          ...reading,
          [field]: numValue
        };
      }
      return reading;
    }));
  };

  const downloadExcelTemplate = () => {
    if (!buildingId || buildingUnits.length === 0) {
      setUploadStatus({
        type: 'warning',
        message: 'Please select a building first'
      });
      return;
    }
    
    if (buildingHasAllReadings) {
      setUploadStatus({
        type: 'warning',
        message: 'All units in this building already have readings for this month. Excel template download is disabled.'
      });
      return;
    }

    const buildingName = buildings.find(b => b.id === buildingId)?.buildingName || 'Building';

    const instructions = [
      ['BULK METER READING TEMPLATE'],
      [`Building: ${buildingName}`],
      [`Reading Date: ${readingDate}`],
      [''],
      ['INSTRUCTIONS:'],
      ['• Do NOT modify column headers'],
      ['• Unit Number is pre-filled'],
      ['• Readings must be ≥ 0'],
      ['• Save file as .xlsx'],
      ['']
    ];

    const headers = [[
      'Unit Number',
      'Electricity Reading (kWh)',
      'Water Reading (gal)',
      'Notes'
    ]];

    const rows = buildingUnits.map(unit => [
      unit.unitNumber,
      '',
      '',
      ''
    ]);

    const sheetData = [...instructions, ...headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 32 },
      { wch: 30 },
      { wch: 30 }
    ];

    const headerRowIndex = instructions.length + 1;
    ['A', 'B', 'C', 'D'].forEach(col => {
      const cell = worksheet[`${col}${headerRowIndex}`];
      if (cell) {
        cell.s = {
          font: { bold: true },
          alignment: {
            wrapText: true,
            horizontal: 'center',
            vertical: 'center'
          }
        };
      }
    });

    worksheet['!freeze'] = { ySplit: headerRowIndex };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meter Readings');

    XLSX.writeFile(
      workbook,
      `Meter_Readings_Template_${buildingName.replace(/\s+/g, '_')}_${readingDate}.xlsx`
    );

    setUploadStatus({
      type: 'success',
      message: 'Excel template downloaded successfully'
    });
  };

  const validateExcelFormat = (sheetData: any[][]): boolean => {
    if (sheetData.length < 12) return false;

    const headerRow = sheetData.find(row =>
      row.includes('Unit Number')
    );

    if (!headerRow) return false;

    const expectedHeaders = [
      'Unit Number',
      'Electricity Reading (kWh)',
      'Water Reading (gal)',
      'Notes'
    ];

    return expectedHeaders.every(h => headerRow.includes(h));
  };

  const processExcelData = async (sheetData: any[][]): Promise<any[]> => {
    const headerIndex = sheetData.findIndex(row =>
      row.includes('Unit Number')
    );

    const dataRows = sheetData.slice(headerIndex + 1);
    const processedReadings: any[] = [];
    const errors: string[] = [];

    dataRows.forEach((row, index) => {
      if (!row[0]) return;

      const unitNumber = String(row[0]).trim();
      const electricityReading = Number(row[1]);
      const waterReading = Number(row[2]);
      const notes = row[3] || 'Imported from Excel';

      if (isNaN(electricityReading) || isNaN(waterReading)) {
        errors.push(`Row ${index + headerIndex + 2}: Invalid numbers`);
        return;
      }

      if (electricityReading < 0 || waterReading < 0) {
        errors.push(`Row ${index + headerIndex + 2}: Negative values`);
        return;
      }

      const unit = occupiedUnits.find(u => u.unitNumber === unitNumber);
      if (!unit) {
        errors.push(`Row ${index + headerIndex + 2}: Unit not found`);
        return;
      }

      // Check if unit already has reading in our state
      const existingReading = bulkReadings.find(r => r.unitId === unit.id);
      if (existingReading?.hasMonthlyReading) {
        errors.push(`Row ${index + headerIndex + 2}: Already has reading for this month`);
        return;
      }

      processedReadings.push({
        unitId: unit.id,
        unitNumber,
        electricityReading,
        waterReading,
        notes
      });
    });

    if (errors.length > 0) {
      setUploadStatus({
        type: 'warning',
        message: `Some rows were skipped:\n${errors.slice(0, 5).join('\n')}`
      });
    }

    return processedReadings;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (buildingHasAllReadings) {
      setUploadStatus({
        type: 'warning',
        message: 'All units already have readings for this month. Excel import is disabled.'
      });
      event.target.value = '';
      return;
    }

    if (!buildingId || !readingDate) {
      setUploadStatus({
        type: 'warning',
        message: 'Please select a building and reading date first'
      });
      event.target.value = '';
      return;
    }

    if (!file.name.endsWith('.xlsx')) {
      setUploadStatus({
        type: 'error',
        message: 'Please upload an Excel (.xlsx) file'
      });
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      setUploadStatus({ type: null, message: '' });

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          const sheetData = XLSX.utils.sheet_to_json(sheet, {
            header: 1
          }) as any[][];

          if (!validateExcelFormat(sheetData)) {
            setUploadStatus({
              type: 'error',
              message: 'Invalid Excel format. Please use the provided template.'
            });
            return;
          }

          const processedReadings = await processExcelData(sheetData);

          if (processedReadings.length === 0) {
            setUploadStatus({
              type: 'warning',
              message: 'No valid readings found in Excel file'
            });
            return;
          }

          // Submit the readings
          await submitReadings(processedReadings, 'Excel import');
          
        } catch (innerError) {
          console.error('Excel parsing error:', innerError);
          setUploadStatus({
            type: 'error',
            message: 'Failed to read Excel file. Please check the format.'
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Error processing Excel file'
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const submitReadings = async (readingsToSubmit: any[], source: string = 'manual') => {
    if (!electricityUtility || !waterUtility) {
      setUploadStatus({
        type: 'error',
        message: 'Utilities not configured. Please contact administrator.'
      });
      return;
    }

    try {
      const bulkRequests = readingsToSubmit.flatMap(reading => {
        const requests = [];
        
        // Find the full reading data
        const fullReading = bulkReadings.find(r => r.unitId === reading.unitId);
        if (!fullReading) return [];
        
        // Electricity reading - only submit if it doesn't already exist
        if (!fullReading.hasElectricityReading && reading.electricityReading >= 0) {
          requests.push({
            unitId: reading.unitId,
            utilityTypeId: electricityUtility.id,
            currentReading: reading.electricityReading,
            previousReading: fullReading.previousElectricityReading || null,
            readingDate: readingDate,
            notes: source === 'Excel import' ? 'Imported from Excel' : 'Manual entry'
          });
        }
        
        // Water reading - only submit if it doesn't already exist
        if (!fullReading.hasWaterReading && reading.waterReading >= 0) {
          requests.push({
            unitId: reading.unitId,
            utilityTypeId: waterUtility.id,
            currentReading: reading.waterReading,
            previousReading: fullReading.previousWaterReading || null,
            readingDate: readingDate,
            notes: source === 'Excel import' ? 'Imported from Excel' : 'Manual entry'
          });
        }

        return requests;
      });

      if (bulkRequests.length === 0) {
        setUploadStatus({
          type: 'warning',
          message: 'No valid readings to submit. They may already exist.'
        });
        return;
      }
      
      // Submit readings
      try {
        await meterReadingApi.createBulkValidatedReadings(bulkRequests);
      } catch (apiError) {
        await meterReadingApi.createBulkMeterReadings(bulkRequests);
      }
      
      setUploadStatus({
        type: 'success',
        message: `Successfully submitted ${bulkRequests.length} readings from ${source}!`
      });
      
      // Refresh status after submission (force refresh)
      setTimeout(() => {
        checkReadingStatus(true);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error submitting readings:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Error submitting readings. Please try again.'
      });
    }
  };

  const submitBulkReadings = async () => {
    if (!buildingId || !readingDate) {
      setUploadStatus({
        type: 'warning',
        message: 'Please select a building and reading date'
      });
      return;
    }
    
    // Filter out only units without monthly readings
    const unitsToSubmit = bulkReadings.filter(r => !r.hasMonthlyReading);
    
    if (unitsToSubmit.length === 0) {
      setUploadStatus({
        type: 'warning',
        message: 'All units already have readings for this month'
      });
      return;
    }
    
    // Validate readings
    const invalidReadings = unitsToSubmit.filter(reading => {
      const elecConsumption = reading.electricityReading - (reading.previousElectricityReading || 0);
      const waterConsumption = reading.waterReading - (reading.previousWaterReading || 0);
      return elecConsumption < 0 || waterConsumption < 0;
    });
    
    if (invalidReadings.length > 0) {
      setUploadStatus({
        type: 'error',
        message: `Found ${invalidReadings.length} readings where current reading is less than previous reading. Please check the values.`
      });
      return;
    }
    
    try {
      setLoading(true);
      
      await submitReadings(unitsToSubmit, 'manual entry');
      
    } catch (error: any) {
      console.error('Error submitting bulk readings:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Error submitting readings. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Bulk Meter Reading Entry</h1>
            </div>
            
          </div>
          <p className="text-gray-600">Enter meter readings for ROOM and HALL type units in a building at once</p>
          {!isAdmin && assignedBuildingId && (
            <p className="text-sm text-blue-600 mt-1">
              You are assigned to: {
                buildings.length > 0 
                  ? buildings.find(b => b.id === assignedBuildingId)?.buildingName 
                  : 'Loading...'
              }
            </p>
          )}
        </div>

        {/* Status Message */}
        {uploadStatus.type && (
          <div className={`mb-6 p-4 rounded-lg border ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : uploadStatus.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : uploadStatus.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : uploadStatus.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="whitespace-pre-line">{uploadStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Building
              </label>
              <select
                value={buildingId || ""}
                onChange={(e) => handleBuildingChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={loading || (assignedBuildingId && !isAdmin)}
              >
                {isAdmin ? (
                  <>
                    <option value="">Select building...</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.buildingName} -{" "}
                        {building.buildingType || "Commercial"}
                      </option>
                    ))}
                  </>
                ) : assignedBuildingId ? (
                  <>
                    <option value={assignedBuildingId}>
                      {buildings.find((b) => b.id === assignedBuildingId)
                        ?.buildingName || "My Assigned Building"}
                    </option>
                  </>
                ) : (
                  <option value="">No building assigned</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reading Date *
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Readings are recorded monthly. Once submitted, fields will be disabled.
              </p>
            </div>

            <div className="flex items-end space-x-2">
              <button 
                onClick={downloadExcelTemplate}
                disabled={loading || !buildingId || buildingHasAllReadings}
                className={`px-4 py-2 border border-gray-300 rounded flex items-center transition-colors ${
                  loading || !buildingId || buildingHasAllReadings
                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel Template
              </button>
              
              <label
                className={`px-4 py-2 border border-gray-300 rounded flex items-center transition-colors
                  ${loading || !buildingId || buildingHasAllReadings
                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                    : 'hover:bg-gray-50 cursor-pointer'
                  }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading || !buildingId || buildingHasAllReadings}
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
                    {buildings.find(b => b.id === buildingId)?.buildingName || 'Unknown Building'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">ROOM/HALL Units:</span>
                  <span className="font-medium ml-2">{occupiedUnits.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Electricity Utility:</span>
                  <span className="font-medium ml-2">
                    {electricityUtility
                      ? electricityUtility.utilityName
                      : "Not configured"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Water Utility:</span>
                  <span className="font-medium ml-2">
                    {waterUtility ? waterUtility.utilityName : "Not configured"}
                  </span>
                </div>
              </div>
              
              {buildingHasAllReadings && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All units in this building have readings for {readingDate}. No further entries needed.
                  </p>
                </div>
              )}
              
              {!buildingHasAllReadings && bulkReadings.some(r => r.hasMonthlyReading) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {bulkReadings.filter(r => r.hasMonthlyReading).length} unit(s) already have readings for {readingDate}. 
                    These are disabled to prevent duplicate entries.
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
                    Meter Readings for{" "}
                    {buildings.find((b) => b.id === buildingId)?.buildingName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Date: {readingDate} | Units: {bulkReadings.length}
                    {bulkReadings.filter(r => r.hasMonthlyReading).length > 0 && 
                      ` (${bulkReadings.filter(r => r.hasMonthlyReading).length} units already read)`}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Units Pending:</span>
                  <span className="font-medium ml-2">
                    {bulkReadings.filter(r => !r.hasMonthlyReading).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Unit Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                      Electricity (kWh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                      Water (gal)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Previous Readings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Consumption
                    </th>
                    
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkReadings.map((reading) => {
                    const elecConsumption = reading.electricityReading - (reading.previousElectricityReading || 0);
                    const waterConsumption = reading.waterReading - (reading.previousWaterReading || 0);
                    
                    return (
                      <tr key={reading.unitId} className={`hover:bg-gray-50 ${reading.isDisabled ? 'bg-gray-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {reading.unitNumber}
                            <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {reading.unitType}
                            </span>
                            {reading.isDisabled && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Already Read
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min={reading.previousElectricityReading || 0}
                                value={reading.electricityReading || ''}
                                onChange={(e) => handleReadingChange(
                                  reading.unitId, 
                                  'electricityReading', 
                                  e.target.value
                                )}
                                className={`w-full border rounded px-3 py-2 ${
                                  reading.hasElectricityReading || loading || buildingHasAllReadings
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                                placeholder="Enter current reading"
                                disabled={reading.hasElectricityReading || loading || buildingHasAllReadings}
                                title={reading.hasElectricityReading ? 'Reading already submitted for this month' : ''}
                              />
                            </div>
                            <div className="text-xs text-gray-500">
                              Previous: {reading.previousElectricityReading?.toFixed(2) || '0.00'} kWh
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min={reading.previousWaterReading || 0}
                                value={reading.waterReading || ''}
                                onChange={(e) => handleReadingChange(
                                  reading.unitId, 
                                  'waterReading', 
                                  e.target.value
                                )}
                                className={`w-full border rounded px-3 py-2 ${
                                  reading.hasWaterReading || loading || buildingHasAllReadings
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                                placeholder="Enter current reading"
                                disabled={reading.hasWaterReading || loading || buildingHasAllReadings}
                                title={reading.hasWaterReading ? 'Reading already submitted for this month' : ''}
                              />
                            </div>
                            <div className="text-xs text-gray-500">
                              Previous: {reading.previousWaterReading?.toFixed(2) || '0.00'} gal
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="space-y-2">
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium">Electricity:</div>
                              <div>{reading.previousElectricityReading?.toFixed(2) || '0.00'} kWh</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium">Water:</div>
                              <div>{reading.previousWaterReading?.toFixed(2) || '0.00'} gal</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Electricity:</div>
                              <div className={`font-medium px-2 py-1 rounded ${
                                elecConsumption >= 0 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {elecConsumption >= 0 ? '+' : ''}{elecConsumption.toFixed(2)} kWh
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Water:</div>
                              <div className={`font-medium px-2 py-1 rounded ${
                                waterConsumption >= 0 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {waterConsumption >= 0 ? '+' : ''}{waterConsumption.toFixed(2)} gal
                              </div>
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
                  <div>Total Units: {bulkReadings.length}</div>
                  <div className="mt-1 text-green-600">
                    Pending: {bulkReadings.filter(r => !r.hasMonthlyReading).length} units
                  </div>
                  <div className="text-yellow-600">
                    Already Read: {bulkReadings.filter(r => r.hasMonthlyReading).length} units
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setBulkReadings([]);
                      setBuildingId(null);
                      setBuildingUnits([]);
                      setBuildingHasAllReadings(false);
                      setUploadStatus({ type: null, message: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Clear
                  </button>
                  <button
                    onClick={submitBulkReadings}
                    disabled={loading || pendingUnits.length === 0 || buildingHasAllReadings}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : buildingHasAllReadings ? 'All Readings Submitted' : 'Submit All Readings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}

        {/* Empty State */}
        {!buildingId && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building2 className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isAdmin ? "Select a Building" : "No Building Assigned"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {isAdmin 
                ? 'Choose a building from the dropdown above to start entering meter readings for ROOM and HALL units at once.'
                : 'You have not been assigned to any building. Please contact your administrator.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkMeterReadingPage;
