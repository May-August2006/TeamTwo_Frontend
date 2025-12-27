// BulkMeterReadingPage.tsx - Updated with start AND end date validation
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Upload, Download, Building2, AlertCircle, CheckCircle, RefreshCw, Calendar } from 'lucide-react';
import { meterReadingApi, utilityTypeApi } from '../../api/MeterReadingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { buildingApi } from '../../api/BuildingAPI';
import { contractApi } from '../../api/ContractAPI';
import type { Unit, UtilityType } from '../../types/unit';
import type { Building } from '../../types';
import type { Contract } from '../../types/contract';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

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
  canHaveReading: boolean; // Whether unit can have reading for selected date
  contractStartDate?: string; // Contract start date
  contractEndDate?: string; // Contract end date
  disabledReason?: string; // Reason why unit is disabled
}

const BulkMeterReadingPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [bulkReadings, setBulkReadings] = useState<BulkReading[]>([]);
  const [readingDate, setReadingDate] = useState<string>('');
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [electricityUtility, setElectricityUtility] = useState<UtilityType | null>(null);
  const [waterUtility, setWaterUtility] = useState<UtilityType | null>(null);
  const [buildingUnits, setBuildingUnits] = useState<Unit[]>([]);
  const [assignedBuildingId, setAssignedBuildingId] = useState<number | null>(null);
  const [occupiedUnits, setOccupiedUnits] = useState<Unit[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [buildingHasAllReadings, setBuildingHasAllReadings] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({
    type: null,
    message: ''
  });
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Refs for debouncing
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>('');

  const pendingUnits = bulkReadings.filter(r => !r.hasMonthlyReading && r.canHaveReading);

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

  // Load contracts for the building
  const loadContractsForBuilding = async (buildingId: number) => {
    try {
      const response = await buildingApi.getContractsByBuilding(buildingId);
      setContracts(response.data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
      setContracts([]);
    }
  };

  // Check if unit can have reading for selected date (BOTH start AND end date validation)
  const canUnitHaveReading = (unitId: number): { 
    canHave: boolean; 
    reason?: string; 
    startDate?: string; 
    endDate?: string 
  } => {
    if (!readingDate) {
      return { canHave: false, reason: t('BulkMeterReadingPage.statusMessages.selectDate') };
    }

    const contract = contracts.find(c => 
      c.unit?.id === unitId && 
      c.contractStatus === 'ACTIVE'
    );

    if (!contract) {
      return { canHave: false, reason: t('BulkMeterReadingPage.buildingInfo.noActiveContract') };
    }

    const selectedDate = new Date(readingDate);
    const contractStartDate = new Date(contract.startDate);
    const contractEndDate = new Date(contract.endDate);

    // Check if selected date is BEFORE contract start date
    if (selectedDate < contractStartDate) {
      return { 
        canHave: false, 
        reason: t('BulkMeterReadingPage.statusMessages.contractStarts', { date: contract.startDate }),
        startDate: contract.startDate,
        endDate: contract.endDate
      };
    }

    // Check if selected date is AFTER contract end date
    if (selectedDate > contractEndDate) {
      return { 
        canHave: false, 
        reason: t('BulkMeterReadingPage.statusMessages.contractEnded', { date: contract.endDate }),
        startDate: contract.startDate,
        endDate: contract.endDate
      };
    }

    // If selected date is BETWEEN start and end date (inclusive)
    return { 
      canHave: true, 
      startDate: contract.startDate,
      endDate: contract.endDate
    };
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
          // Check if unit can have reading for this date (start AND end date check)
          const canHaveInfo = canUnitHaveReading(reading.unitId);
          
          // If unit cannot have reading for this date, skip API calls
          if (!canHaveInfo.canHave) {
            return {
              ...reading,
              hasMonthlyReading: true, // Treat as already "read" to disable
              hasElectricityReading: true,
              hasWaterReading: true,
              isDisabled: true,
              canHaveReading: false,
              contractStartDate: canHaveInfo.startDate,
              contractEndDate: canHaveInfo.endDate,
              disabledReason: canHaveInfo.reason,
              previousElectricityReading: 0,
              previousWaterReading: 0
            };
          }

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
            const waterStatus = await meterReadingApi.checkMonthlyReading(
              reading.unitId,
              waterUtility.id,
              readingDate
            );
            hasWaterReading = waterStatus.hasReading;
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
            isDisabled: hasAnyReading || !canHaveInfo.canHave,
            canHaveReading: canHaveInfo.canHave,
            contractStartDate: canHaveInfo.startDate,
            contractEndDate: canHaveInfo.endDate,
            disabledReason: canHaveInfo.reason,
            previousElectricityReading,
            previousWaterReading
          };
        })
      );
      
      setBulkReadings(updatedReadings);
      
      // Calculate if all units that CAN have readings actually have them
      const unitsThatCanHaveReadings = updatedReadings.filter(r => r.canHaveReading);
      const allValidUnitsRead = unitsThatCanHaveReadings.length > 0 && 
        unitsThatCanHaveReadings.every(r => r.hasMonthlyReading);
      setBuildingHasAllReadings(allValidUnitsRead);
      
    } catch (error) {
      console.error('Error checking reading status:', error);
      lastCheckedRef.current = '';
    } finally {
      setCheckingStatus(false);
    }
  }, [buildingId, readingDate, electricityUtility, waterUtility, bulkReadings, contracts, t]);

  // Update the useEffect to trigger status check when date changes
  useEffect(() => {
    if (buildingId && readingDate && electricityUtility && waterUtility) {
      // Clear any pending checks
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      
      // Check immediately when date changes
      checkTimeoutRef.current = setTimeout(() => {
        if (bulkReadings.length > 0) {
          checkReadingStatus(true); // Force refresh with new date
        }
      }, 100);
    }
    
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [readingDate]);

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
        message: t('BulkMeterReadingPage.statusMessages.refreshData')
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
        message: t('BulkMeterReadingPage.statusMessages.noPermission')
      });
      return;
    }
    
    setBuildingId(selectedBuildingId);
    lastCheckedRef.current = ''; // Reset last checked when building changes
    
    try {
      setLoading(true);
      setUploadStatus({ type: null, message: '' });
      setBuildingHasAllReadings(false);
      setContracts([]); // Clear previous contracts
      
      // Load contracts for this building
      await loadContractsForBuilding(selectedBuildingId);
      
      // Get occupied units only
      const occupiedUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(selectedBuildingId);
      const occupiedUnitsData = occupiedUnitsResponse.data || [];
      
      // Filter only ROOM and HALL type units with meters
      const unitsWithMeters = occupiedUnitsData.filter((unit: Unit) => 
        unit.hasMeter && (unit.unitType === 'ROOM' || unit.unitType === 'HALL')
      );
      
      setOccupiedUnits(unitsWithMeters);
      setBuildingUnits(unitsWithMeters);
      
      // Initialize readings with default values and check date validity
      const initialReadings: BulkReading[] = unitsWithMeters.map((unit: Unit) => {
        const canHaveInfo = canUnitHaveReading(unit.id);
        
        return {
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
          isDisabled: !canHaveInfo.canHave,
          canHaveReading: canHaveInfo.canHave,
          contractStartDate: canHaveInfo.startDate,
          contractEndDate: canHaveInfo.endDate,
          disabledReason: canHaveInfo.reason
        };
      });
      
      setBulkReadings(initialReadings);
      
      // Check reading status after loading
      if (readingDate && electricityUtility && waterUtility) {
        setTimeout(() => {
          checkReadingStatus(true);
        }, 500);
      }
      
    } catch (error: any) {
      console.error('Error loading building units:', error);
      setUploadStatus({
        type: 'error',
        message: t('BulkMeterReadingPage.statusMessages.loadError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReadingChange = (unitId: number, field: keyof BulkReading, value: string) => {
  setBulkReadings(prev => prev.map(reading => {
    if (reading.unitId === unitId) {
      // Allow empty string for typing
      if (value === '' || value === '-') {
        return {
          ...reading,
          [field]: value
        };
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return reading;
      }
      
      // Only validate when we have a complete number (not during typing)
      // We'll do final validation on submit
      return {
        ...reading,
        [field]: numValue
      };
    }
    return reading;
  }));
  
  // Clear any warnings when user starts typing
  setUploadStatus({ type: null, message: '' });
};

  // =============== EXCEL CODE - KEPT EXACTLY AS BEFORE ===============
  const downloadExcelTemplate = () => {
    if (!buildingId || buildingUnits.length === 0) {
      setUploadStatus({
        type: 'warning',
        message: t('BulkMeterReadingPage.statusMessages.selectBuildingFirst')
      });
      return;
    }
    
    if (buildingHasAllReadings) {
      setUploadStatus({
        type: 'warning',
        message: t('BulkMeterReadingPage.statusMessages.allReadingsComplete')
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
        message: t('BulkMeterReadingPage.statusMessages.allReadingsComplete')
      });
      event.target.value = '';
      return;
    }

    if (!buildingId || !readingDate) {
      setUploadStatus({
        type: 'warning',
        message: t('BulkMeterReadingPage.statusMessages.selectDateFirst')
      });
      event.target.value = '';
      return;
    }

    if (!file.name.endsWith('.xlsx')) {
      setUploadStatus({
        type: 'error',
        message: t('BulkMeterReadingPage.statusMessages.excelOnly')
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
              message: t('BulkMeterReadingPage.statusMessages.invalidFormat')
            });
            return;
          }

          const processedReadings = await processExcelData(sheetData);

          if (processedReadings.length === 0) {
            setUploadStatus({
              type: 'warning',
              message: t('BulkMeterReadingPage.statusMessages.noValidReadings')
            });
            return;
          }

          // Submit the readings - only for units that can have readings
          const validReadings = processedReadings.filter(reading => {
            const bulkReading = bulkReadings.find(r => r.unitId === reading.unitId);
            return bulkReading?.canHaveReading && !bulkReading.hasMonthlyReading;
          });

          if (validReadings.length === 0) {
            setUploadStatus({
              type: 'warning',
              message: t('BulkMeterReadingPage.statusMessages.noValidForDate')
            });
            return;
          }

          await submitReadings(validReadings, 'Excel import');
          
        } catch (innerError) {
          console.error('Excel parsing error:', innerError);
          setUploadStatus({
            type: 'error',
            message: t('BulkMeterReadingPage.statusMessages.excelError')
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadStatus({
        type: 'error',
        message: t('BulkMeterReadingPage.statusMessages.fileError')
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const submitReadings = async (readingsToSubmit: any[], source: string = 'manual') => {
    if (!electricityUtility || !waterUtility) {
      setUploadStatus({
        type: 'error',
        message: t('BulkMeterReadingPage.statusMessages.utilitiesNotConfigured')
      });
      return;
    }
    
    try {
      const bulkRequests = readingsToSubmit.flatMap(reading => {
        const requests = [];
        
        // Find the full reading data
        const fullReading = bulkReadings.find(r => r.unitId === reading.unitId);
        if (!fullReading) return [];
        
        // Electricity reading - only submit if it doesn't already exist and unit can have reading
        if (!fullReading.hasElectricityReading && reading.electricityReading >= 0 && fullReading.canHaveReading) {
          requests.push({
            unitId: reading.unitId,
            utilityTypeId: electricityUtility.id,
            currentReading: reading.electricityReading,
            previousReading: fullReading.previousElectricityReading || null,
            readingDate: readingDate,
            notes: source === 'Excel import' ? 'Imported from Excel' : 'Manual entry'
          });
        }
        
        // Water reading - only submit if it doesn't already exist and unit can have reading
        if (!fullReading.hasWaterReading && reading.waterReading >= 0 && fullReading.canHaveReading) {
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
          message: t('BulkMeterReadingPage.statusMessages.noValidToSubmit')
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
        message: t('BulkMeterReadingPage.statusMessages.successSubmit', {
          count: bulkRequests.length,
          source: source
        })
      });
      
      // Refresh status after submission (force refresh)
      setTimeout(() => {
        checkReadingStatus(true);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error submitting readings:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || t('BulkMeterReadingPage.statusMessages.apiError')
      });
    }
  };

  const submitBulkReadings = async () => {
    if (!buildingId || !readingDate) {
      setUploadStatus({
        type: 'warning',
        message: t('BulkMeterReadingPage.statusMessages.selectDate')
      });
      return;
    }
    
    // Filter out only units that can have readings and don't have monthly readings
    const unitsToSubmit = bulkReadings.filter(r => 
      r.canHaveReading && !r.hasMonthlyReading
    );
    
    if (unitsToSubmit.length === 0) {
      setUploadStatus({
        type: 'warning',
        message: t('BulkMeterReadingPage.statusMessages.noValidUnits')
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
        message: t('BulkMeterReadingPage.statusMessages.negativeConsumption', { count: invalidReadings.length })
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
        message: error.response?.data?.message || t('BulkMeterReadingPage.statusMessages.apiError')
      });
    } finally {
      setLoading(false);
    }
  };

  // Count statistics
  const validUnitsCount = bulkReadings.filter(r => r.canHaveReading).length;
  const invalidUnitsCount = bulkReadings.filter(r => !r.canHaveReading).length;
  const pendingValidUnits = bulkReadings.filter(r => r.canHaveReading && !r.hasMonthlyReading).length;
  const completedValidUnits = bulkReadings.filter(r => r.canHaveReading && r.hasMonthlyReading).length;

  // Get detailed reasons for invalid units
  const getInvalidUnitsDetails = () => {
    const details = {
      startedLater: 0,
      endedEarlier: 0,
      noContract: 0
    };
    
    bulkReadings.filter(r => !r.canHaveReading).forEach(reading => {
      if (reading.disabledReason?.includes('starts on')) {
        details.startedLater++;
      } else if (reading.disabledReason?.includes('ended on')) {
        details.endedEarlier++;
      } else if (reading.disabledReason?.includes('No active contract')) {
        details.noContract++;
      }
    });
    
    return details;
  };

  const invalidDetails = getInvalidUnitsDetails();

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('BulkMeterReadingPage.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('BulkMeterReadingPage.subtitle')}
              </p>
              {!isAdmin && assignedBuildingId && (
                <p className="text-sm text-blue-600 mt-1">
                  {t('BulkMeterReadingPage.assignedTo')} {
                    buildings.length > 0 
                      ? buildings.find(b => b.id === assignedBuildingId)?.buildingName 
                      : t('BulkMeterReadingPage.loading')
                  }
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
                {t('BulkMeterReadingPage.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Status Message */}
          {uploadStatus.type && (
            <div className={`p-4 rounded-lg border ${
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
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('BulkMeterReadingPage.controls.selectBuilding')}
                </label>
                <select
                  value={buildingId || ''}
                  onChange={(e) => handleBuildingChange(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || (assignedBuildingId && !isAdmin)}
                >
                  {isAdmin ? (
                    <>
                      <option value="">{t('BulkMeterReadingPage.controls.selectBuildingPlaceholder')}</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.buildingName} - {building.buildingType || 'Commercial'}
                        </option>
                      ))}
                    </>
                  ) : assignedBuildingId ? (
                    <>
                      <option value={assignedBuildingId}>
                        {buildings.find(b => b.id === assignedBuildingId)?.buildingName || t('BulkMeterReadingPage.controls.myAssignedBuilding')}
                      </option>
                    </>
                  ) : (
                    <option value="">{t('BulkMeterReadingPage.controls.noBuildingAssigned')}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('BulkMeterReadingPage.controls.readingDate')}
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('BulkMeterReadingPage.controls.dateNote')}
                </p>
              </div>

              <div className="flex items-end space-x-2">
                <button 
                  onClick={downloadExcelTemplate}
                  disabled={loading || !buildingId || buildingHasAllReadings}
                  className={`flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                    loading || !buildingId || buildingHasAllReadings
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {t('BulkMeterReadingPage.controls.downloadTemplate')}
                </button>
                
                <label
                  className={`flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition-colors
                    ${loading || !buildingId || buildingHasAllReadings
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                >
                  <Upload className="w-4 h-4" />
                  {t('BulkMeterReadingPage.controls.importExcel')}
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
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('BulkMeterReadingPage.buildingInfo.building')}</span>
                    <span className="font-medium ml-2">
                      {buildings.find(b => b.id === buildingId)?.buildingName || 'Unknown Building'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('BulkMeterReadingPage.buildingInfo.readingDate')}</span>
                    <span className="font-medium ml-2">{readingDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('BulkMeterReadingPage.buildingInfo.validUnits')}</span>
                    <span className="font-medium ml-2">{validUnitsCount}/{occupiedUnits.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('BulkMeterReadingPage.buildingInfo.pending')}</span>
                    <span className="font-medium ml-2">{pendingValidUnits}</span>
                  </div>
                </div>
                
                {invalidUnitsCount > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {invalidUnitsCount} {t('BulkMeterReadingPage.buildingInfo.unitsCannotRead')} {readingDate}
                      {invalidDetails.startedLater > 0 && ` (${invalidDetails.startedLater} ${t('BulkMeterReadingPage.buildingInfo.unitsStartLater')})`}
                      {invalidDetails.endedEarlier > 0 && ` (${invalidDetails.endedEarlier} ${t('BulkMeterReadingPage.buildingInfo.unitsEndedEarlier')})`}
                      {invalidDetails.noContract > 0 && ` (${invalidDetails.noContract} ${t('BulkMeterReadingPage.buildingInfo.noActiveContract')})`}
                    </p>
                  </div>
                )}
                
                {buildingHasAllReadings && validUnitsCount > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {t('BulkMeterReadingPage.buildingInfo.allUnitsHaveReadings')} {readingDate}. {t('BulkMeterReadingPage.buildingInfo.noFurtherEntries')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulk Readings Table */}
          {bulkReadings.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t('BulkMeterReadingPage.table.title')} {buildings.find(b => b.id === buildingId)?.buildingName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t('BulkMeterReadingPage.table.date')} {readingDate} | {t('BulkMeterReadingPage.table.units')} {bulkReadings.length}
                      {validUnitsCount > 0 && ` (${validUnitsCount} ${t('BulkMeterReadingPage.table.validForDate')})`}
                      {invalidUnitsCount > 0 && ` (${invalidUnitsCount} ${t('BulkMeterReadingPage.table.invalid')})`}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">{t('BulkMeterReadingPage.table.validUnitsPending')}</span>
                    <span className="font-medium ml-2">
                      {pendingValidUnits}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        {t('BulkMeterReadingPage.table.unitDetails')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                        {t('BulkMeterReadingPage.table.electricity')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                        {t('BulkMeterReadingPage.table.water')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        {t('BulkMeterReadingPage.table.previousReadings')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        {t('BulkMeterReadingPage.table.consumption')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        {t('BulkMeterReadingPage.table.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkReadings.map((reading) => {
                      const elecConsumption = reading.electricityReading - (reading.previousElectricityReading || 0);
                      const waterConsumption = reading.waterReading - (reading.previousWaterReading || 0);
                      
                      // Determine row background color
                      let rowClass = "hover:bg-gray-50 transition-colors";
                      if (!reading.canHaveReading) {
                        rowClass += " bg-red-50";
                      } else if (reading.isDisabled) {
                        rowClass += " bg-gray-50";
                      }
                      
                      return (
                        <tr key={reading.unitId} className={rowClass}>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {reading.unitNumber}
                              <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                {reading.unitType === 'ROOM' ? t('BulkMeterReadingPage.table.room') : t('BulkMeterReadingPage.table.hall')}
                              </span>
                              {!reading.canHaveReading && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  {t('BulkMeterReadingPage.table.notAvailable')}
                                </span>
                              )}
                              {reading.isDisabled && reading.canHaveReading && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  {t('BulkMeterReadingPage.table.alreadyRead')}
                                </span>
                              )}
                            </div>
                            {reading.contractStartDate && reading.contractEndDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                {t('BulkMeterReadingPage.table.contract')} {reading.contractStartDate} {t('BulkMeterReadingPage.table.to')} {reading.contractEndDate}
                              </div>
                            )}
                            {reading.disabledReason && !reading.canHaveReading && (
                              <div className="text-xs text-red-600 mt-1">
                                {reading.disabledReason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
  type="number"
  step="0.01"
  min={reading.previousElectricityReading || 0}
  value={reading.electricityReading === 0 ? '' : reading.electricityReading}
  onChange={(e) => handleReadingChange(
    reading.unitId, 
    'electricityReading', 
    e.target.value
  )}
  onBlur={(e) => {
    // Validate on blur (when user leaves the field)
    const value = e.target.value;
    if (value && reading.previousElectricityReading) {
      const numValue = parseFloat(value);
      if (numValue < reading.previousElectricityReading) {
        setUploadStatus({
          type: 'warning',
          message: t('BulkMeterReadingPage.statusMessages.electricityLow', {
            unit: reading.unitNumber,
            previous: reading.previousElectricityReading
          })
        });
        // Reset to previous value
        handleReadingChange(reading.unitId, 'electricityReading', reading.previousElectricityReading.toString());
      }
    }
  }}
  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    reading.hasElectricityReading || loading || !reading.canHaveReading
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
      : ''
  }`}
  placeholder={t('BulkMeterReadingPage.table.enterCurrentReading')}
  disabled={reading.hasElectricityReading || loading || !reading.canHaveReading}
  title={!reading.canHaveReading ? reading.disabledReason : 
         reading.hasElectricityReading ? t('BulkMeterReadingPage.table.alreadyRead') : ''}
/>
                              </div>
                              <div className="text-xs text-gray-500">
                                {t('BulkMeterReadingPage.table.previous')} {reading.previousElectricityReading?.toFixed(2) || '0.00'} kWh
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
  value={reading.waterReading === 0 ? '' : reading.waterReading}
  onChange={(e) => handleReadingChange(
    reading.unitId, 
    'waterReading', 
    e.target.value
  )}
  onBlur={(e) => {
    // Validate on blur (when user leaves the field)
    const value = e.target.value;
    if (value && reading.previousWaterReading) {
      const numValue = parseFloat(value);
      if (numValue < reading.previousWaterReading) {
        setUploadStatus({
          type: 'warning',
          message: t('BulkMeterReadingPage.statusMessages.waterLow', {
            unit: reading.unitNumber,
            previous: reading.previousWaterReading
          })
        });
        // Reset to previous value
        handleReadingChange(reading.unitId, 'waterReading', reading.previousWaterReading.toString());
      }
    }
  }}
  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    reading.hasWaterReading || loading || !reading.canHaveReading
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
      : ''
  }`}
  placeholder={t('BulkMeterReadingPage.table.enterCurrentReading')}
  disabled={reading.hasWaterReading || loading || !reading.canHaveReading}
  title={!reading.canHaveReading ? reading.disabledReason : 
         reading.hasWaterReading ? t('BulkMeterReadingPage.table.alreadyRead') : ''}
/>
                              </div>
                              <div className="text-xs text-gray-500">
                                {t('BulkMeterReadingPage.table.previous')} {reading.previousWaterReading?.toFixed(2) || '0.00'} gal
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="space-y-2">
                              <div className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{t('BulkMeterReadingPage.table.electricityConsumption')}</div>
                                <div>{reading.previousElectricityReading?.toFixed(2) || '0.00'} kWh</div>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{t('BulkMeterReadingPage.table.waterConsumption')}</div>
                                <div>{reading.previousWaterReading?.toFixed(2) || '0.00'} gal</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('BulkMeterReadingPage.table.electricityConsumption')}</div>
                                <div className={`font-medium px-2 py-1 rounded ${
                                  elecConsumption >= 0 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {elecConsumption >= 0 ? '+' : ''}{elecConsumption.toFixed(2)} kWh
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('BulkMeterReadingPage.table.waterConsumption')}</div>
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
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {!reading.canHaveReading ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {t('BulkMeterReadingPage.table.notAvailable')}
                                </span>
                              ) : reading.hasMonthlyReading ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {t('BulkMeterReadingPage.table.alreadyRead')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {t('BulkMeterReadingPage.table.readyForEntry')}
                                </span>
                              )}
                              
                              {reading.canHaveReading && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {reading.hasMonthlyReading ? t('BulkMeterReadingPage.table.submitted') : t('BulkMeterReadingPage.table.pending')}
                                </div>
                              )}
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
                    <div>{t('BulkMeterReadingPage.table.totalUnits')} {bulkReadings.length}</div>
                    <div className="mt-1">
                      <span className="text-green-600">{t('BulkMeterReadingPage.table.validForDateCount')} {validUnitsCount} {t('BulkMeterReadingPage.table.unitsCount')}</span>
                      <span className="ml-4 text-red-600">{t('BulkMeterReadingPage.table.invalid')}: {invalidUnitsCount} {t('BulkMeterReadingPage.table.unitsCount')}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-blue-600">{t('BulkMeterReadingPage.table.pendingCount')} {pendingValidUnits} {t('BulkMeterReadingPage.table.unitsCount')}</span>
                      <span className="ml-4 text-yellow-600">{t('BulkMeterReadingPage.table.completed')} {completedValidUnits} {t('BulkMeterReadingPage.table.unitsCount')}</span>
                    </div>
                    {invalidUnitsCount > 0 && (
                      <div className="mt-1 text-xs">
                        <span className="text-red-600">
                          {t('BulkMeterReadingPage.table.invalidReasons')}: 
                          {invalidDetails.startedLater > 0 && ` ${invalidDetails.startedLater} ${t('BulkMeterReadingPage.buildingInfo.unitsStartLater')}`}
                          {invalidDetails.endedEarlier > 0 && ` ${invalidDetails.endedEarlier} ${t('BulkMeterReadingPage.buildingInfo.unitsEndedEarlier')}`}
                          {invalidDetails.noContract > 0 && ` ${invalidDetails.noContract} ${t('BulkMeterReadingPage.buildingInfo.noActiveContract')}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
  onClick={() => {
    // Reset only the reading values, not the entire form
    setBulkReadings(prev => prev.map(reading => ({
      ...reading,
      electricityReading: 0,
      waterReading: 0
    })));
    setUploadStatus({ type: null, message: '' });
  }}
  className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
  disabled={loading}
>
  {t('BulkMeterReadingPage.table.clearValues')}
</button>
                    <button
                      onClick={submitBulkReadings}
                      disabled={loading || pendingValidUnits === 0 || buildingHasAllReadings}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? t('BulkMeterReadingPage.table.submitting') : 
                       buildingHasAllReadings ? t('BulkMeterReadingPage.table.allReadingsSubmitted') : 
                       t('BulkMeterReadingPage.table.submitPending', { count: pendingValidUnits })}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">{t('BulkMeterReadingPage.loading')}</p>
            </div>
          )}

          {/* Empty State */}
          {!buildingId && !loading && (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
              <div className="text-gray-400 mb-4">
                <Building2 className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isAdmin ? t('BulkMeterReadingPage.emptyState.selectBuilding') : t('BulkMeterReadingPage.emptyState.noBuildingAssigned')}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {isAdmin 
                  ? t('BulkMeterReadingPage.emptyState.adminMessage')
                  : t('BulkMeterReadingPage.emptyState.userMessage')
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkMeterReadingPage;