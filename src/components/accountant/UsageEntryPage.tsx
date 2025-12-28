/** @format */

// UsageEntryPage.tsx - Fixed with building restriction for accountants
import React, { useState, useEffect } from "react";
import { Building2, FileText, Zap, Battery, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import type { MeterReading } from "../../types/meterReading";
import type {
  UtilityBillingDTO,
  UtilityBillRequest,
} from "../../types/utility";
import type { Unit } from "../../types/unit";
import type { Building, InvoiceDTO } from "../../types";
import { meterReadingApi } from "../../api/MeterReadingAPI";
import { utilityApi } from "../../api/UtilityAPI";
import { unitService } from "../../api/MeterReadingAPI";
import { buildingApi } from "../../api/BuildingAPI";
import { contractApi } from "../../api/ContractAPI";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";

import "jspdf-autotable";

interface UnitWithOccupancy extends Unit {
  isOccupied: boolean;
  tenantName?: string;
  contractId?: number;
  contractStartDate?: string; 
  contractEndDate?: string;
}

interface UnitCalculation {
  unitId: number;
  unitNumber: string;
  unitSpace: number;
  tenantName?: string;
  isOccupied: boolean;
  utilityBilling: UtilityBillingDTO | null;
  camFee: number;
  generatorFee: number;
  transformerFee: number;
  totalAmount: number;
  canGenerate: boolean; // NEW: Track if invoice can be generated
  errorMessage?: string; // NEW: Store error messages
}

const UsageEntryPage: React.FC = () => {
  const { t } = useTranslation();
  
  // State for meter readings
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedReading, setSelectedReading] = useState<
    MeterReading | undefined
  >();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for building selection and CAM
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(
    null
  );
  const [buildingUnits, setBuildingUnits] = useState<UnitWithOccupancy[]>([]);

  // State for utility billing
  const [calculating, setCalculating] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [unitCalculations, setUnitCalculations] = useState<UnitCalculation[]>(
    []
  );
  const [showBilling, setShowBilling] = useState(false);
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // User role and building restrictions - FIXED
  const [assignedBuilding, setAssignedBuilding] = useState<Building | null>(null);
  const [userRole, setUserRole] = useState<string>("ROLE_GUEST");
  const [filteredReadings, setFilteredReadings] = useState<MeterReading[]>([]);

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

  // Check if user can access a specific building
  const canAccessBuilding = (buildingId: number): boolean => {
    // Admin can access all buildings
    if (userRole === 'ROLE_ADMIN') {
      return true;
    }
    
    // Non-admin users can only access their assigned building
    if (assignedBuilding && buildingId === assignedBuilding.id) {
      return true;
    }
    
    return false;
  };

  // Load assigned building for non-admin users
  const loadAssignedBuilding = async () => {
    const role = getUserRole();
    setUserRole(role);
    
    // For non-admin users (accountants, etc.), get assigned building
    if (role !== 'ROLE_ADMIN') {
      try {
        const buildingResponse = await buildingApi.getMyAssignedBuilding();
        if (buildingResponse.data) {
          const building = buildingResponse.data;
          setAssignedBuilding(building);
          setSelectedBuildingId(building.id);
          
          // Add assigned building to buildings list for display
          setBuildings([building]);
          
          // Auto-load units for assigned building
          await loadBuildingUnits(building.id);
          
          return building;
        } else {
          setError(t("UsageEntryPage.permission.accessDenied"));
        }
      } catch (error) {
        console.error('Error loading assigned building:', error);
        setError(t("UsageEntryPage.permission.accessDenied"));
      }
    } else {
      // For admin users, load all available buildings
      try {
        const allBuildings = await buildingApi.getAll();
        setBuildings(allBuildings.data || []);
      } catch (error) {
        console.error('Error loading buildings:', error);
        setError("Failed to load buildings.");
      }
    }
    
    return null;
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load user role and assigned building first
      await loadAssignedBuilding();

      // Load all meter readings
      const readingsData = await meterReadingApi.getAllMeterReadings();
      
      // Filter readings based on user role and assigned building
      let filteredReadings = readingsData;
      
      if (userRole !== 'ROLE_ADMIN' && assignedBuilding) {
        // For non-admin users, we need to filter readings by building
        // First, get all units in the assigned building
        try {
          const buildingUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(assignedBuilding.id);
          const buildingUnits = buildingUnitsResponse.data || [];
          const buildingUnitIds = buildingUnits.map((unit: Unit) => unit.id);
          
          // Filter readings by unit IDs in the assigned building
          filteredReadings = readingsData.filter((reading: MeterReading) => 
            buildingUnitIds.includes(reading.unitId)
          );
        } catch (error) {
          console.error('Error filtering readings by building:', error);
        }
      }
      
      setFilteredReadings(filteredReadings);
      setReadings(filteredReadings);
      
      // Load units (filtered by building if needed)
      if (userRole !== 'ROLE_ADMIN' && assignedBuilding) {
        try {
          const buildingUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(assignedBuilding.id);
          setUnits(buildingUnitsResponse.data || []);
        } catch (error) {
          console.error('Error loading building units:', error);
          setUnits([]);
        }
      } else {
        const unitsData = await unitService.getAllUnits();
        setUnits(unitsData);
      }
      
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const due = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    setPeriodStart(firstDay.toISOString().split("T")[0]);
    setPeriodEnd(lastDay.toISOString().split("T")[0]);
    setDueDate(due.toISOString().split("T")[0]);
  }, []);

  const loadBuildingUnits = async (buildingId: number) => {
  // Check if user has permission for this building
  if (!canAccessBuilding(buildingId)) {
    return [];
  }
  
  try {
    setLoading(true);

    // Get units in building
    const unitsResponse = await buildingApi.getUnitsByBuilding(buildingId);
    const unitsData = unitsResponse.data || [];

    // Check occupancy for each unit
    const unitsWithOccupancy: UnitWithOccupancy[] = [];

    for (const unit of unitsData) {
      try {
        // Get all contracts for this unit
        const contractsResponse = await contractApi.getAll();
        const allContracts = contractsResponse.data || [];

        // Filter contracts for this unit with active status
        const unitContracts = allContracts.filter(
          (contract) =>
            contract.unit?.id === unit.id &&
            contract.contractStatus === "ACTIVE"
        );

        const isOccupied = unitContracts.length > 0;
        const tenantName =
          isOccupied && unitContracts[0].tenant?.tenantName
            ? unitContracts[0].tenant.tenantName
            : undefined;
        const contractId = isOccupied ? unitContracts[0].id : undefined;

        // Get contract dates if available
        const contractStartDate = isOccupied ? unitContracts[0].startDate : undefined;
        const contractEndDate = isOccupied ? unitContracts[0].endDate : undefined;

        unitsWithOccupancy.push({
          ...unit,
          isOccupied,
          tenantName,
          contractId,
          contractStartDate,
          contractEndDate
        });
      } catch (contractError) {
        console.error(
          `Error checking occupancy for unit ${unit.id}:`,
          contractError
        );
        unitsWithOccupancy.push({
          ...unit,
          isOccupied: false,
        });
      }
    }

    setBuildingUnits(unitsWithOccupancy);
    return unitsWithOccupancy;
  } catch (error: any) {
    console.error("Error loading building units:", error);
    setError("Failed to load unit information");
    return [];
  } finally {
    setLoading(false);
  }
};
  const calculateCAMDistribution = async (
    buildingId: number,
    occupiedUnits: UnitWithOccupancy[]
  ) => {
    try {
      const selectedBuilding = buildings.find((b) => b.id === buildingId);
      if (!selectedBuilding) {
        throw new Error("Selected building not found");
      }

      const generatorFee = selectedBuilding.generatorFee || 0;
      const transformerFee = selectedBuilding.transformerFee || 0;
      const totalLeasableArea = selectedBuilding.totalLeasableArea || 0;

      if (totalLeasableArea === 0) {
        throw new Error("Total leasable area is not set for this building");
      }

      // Calculate CAM per unit based on unit space proportion
      const camDistribution = occupiedUnits.map((unit) => {
        const unitSpace = unit.unitSpace || 0;
        const percentage = totalLeasableArea > 0 ? (unitSpace / totalLeasableArea) * 100 : 0;

        // Calculate CAM share based on unit space proportion
        const generatorShare = totalLeasableArea > 0 ? (unitSpace / totalLeasableArea) * generatorFee : 0;
        const transformerShare = totalLeasableArea > 0 ? (unitSpace / totalLeasableArea) * transformerFee : 0;

        const totalCAMFee = generatorShare + transformerShare;

        return {
          unitId: unit.id,
          camFee: parseFloat(totalCAMFee.toFixed(2)),
          generatorFee: parseFloat(generatorShare.toFixed(2)),
          transformerFee: parseFloat(transformerShare.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
        };
      });

      return camDistribution;
    } catch (error) {
      console.error("Error calculating CAM distribution:", error);
      throw error;
    }
  };
// Calculate all utility fees for all occupied units in building
const calculateAllUtilityFees = async () => {
  if (!selectedBuildingId) {
    setError(t("UsageEntryPage.generateBills.selectBuilding"));
    return;
  }

  // Check if user has permission for this building
  if (!canAccessBuilding(selectedBuildingId)) {
    setError(t("UsageEntryPage.permission.accessDenied"));
    return;
  }

  if (!periodStart || !periodEnd) {
    setError(t("UsageEntryPage.generateBills.selectPeriod"));
    return;
  }

  try {
    setCalculating(true);
    setError("");
    setSuccess("");

    // Load units with occupancy
    const unitsWithOccupancy = await loadBuildingUnits(selectedBuildingId);
    const occupiedUnits = unitsWithOccupancy.filter(
      (unit) => unit.isOccupied
    );

    if (occupiedUnits.length === 0) {
      setError("No occupied units found in this building");
      return;
    }

    // Get the selected building
    const selectedBuilding = buildings.find(
      (b) => b.id === selectedBuildingId
    );
    if (!selectedBuilding) {
      setError("Selected building not found");
      return;
    }

    // Calculate CAM distribution (Generator + Transformer + Other CAM)
    const camDistribution = await calculateCAMDistribution(
      selectedBuildingId,
      occupiedUnits
    );

    // Calculate utility bills for each occupied unit
    const calculations: UnitCalculation[] = [];
    const invalidUnits: Array<{unitNumber: string, reason: string}> = [];

    for (const unit of occupiedUnits) {
      try {
        // SECOND: Get metered utilities calculation from backend
        let utilityBilling: UtilityBillingDTO | null = null;
        try {
          utilityBilling = await utilityApi.calculateUtilityBill(
            unit.id,
            periodStart,
            periodEnd
          );
          console.log(`Unit ${unit.unitNumber} utility billing:`, utilityBilling);
        } catch (billingError: any) {
          console.error(`Error calculating utility bill for unit ${unit.id}:`, billingError);
          
          const errorMessage = billingError.response?.data?.message || billingError.message || "";
          
          // Check if error is about contract dates
          if (errorMessage.includes("not within contract dates") || 
              errorMessage.includes("No active contract found")) {
            // Unit contract doesn't cover this period
            calculations.push({
              unitId: unit.id,
              unitNumber: unit.unitNumber,
              unitSpace: unit.unitSpace || 0,
              tenantName: unit.tenantName,
              isOccupied: true,
              utilityBilling: null,
              camFee: 0,
              generatorFee: 0,
              transformerFee: 0,
              totalAmount: 0,
              canGenerate: false,
              errorMessage: "Contract doesn't cover billing period"
            });
            
            invalidUnits.push({
              unitNumber: unit.unitNumber,
              reason: errorMessage.includes("not within contract dates") 
                ? "Contract doesn't cover period" 
                : "No active contract"
            });
            continue;
          }
          
          // Check if error is about existing invoice
          if (errorMessage.includes("already exists") || errorMessage.includes("overlaps")) {
            // Unit already has invoice for this period
            calculations.push({
              unitId: unit.id,
              unitNumber: unit.unitNumber,
              unitSpace: unit.unitSpace || 0,
              tenantName: unit.tenantName,
              isOccupied: true,
              utilityBilling: null,
              camFee: 0,
              generatorFee: 0,
              transformerFee: 0,
              totalAmount: 0,
              canGenerate: false,
              errorMessage: "Invoice already exists for this period"
            });
            continue;
          }
          
          // Create empty billing object for other errors
          utilityBilling = {
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            unitSpace: unit.unitSpace || 0,
            unitType: unit.unitType || '',
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            utilityFees: [],
            totalAmount: 0,
            grandTotal: 0,
            taxAmount: 0,
            buildingId: selectedBuildingId,
            buildingName: selectedBuilding.buildingName,
            totalLeasableArea: selectedBuilding.totalLeasableArea || 0,
            totalCAMCosts: selectedBuilding.totalCAMCosts || 0
          };
        }

        // If utilityBilling is null at this point, skip this unit
        if (!utilityBilling) {
          calculations.push({
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            unitSpace: unit.unitSpace || 0,
            tenantName: unit.tenantName,
            isOccupied: true,
            utilityBilling: null,
            camFee: 0,
            generatorFee: 0,
            transformerFee: 0,
            totalAmount: 0,
            canGenerate: false,
            errorMessage: "Failed to calculate utility bill"
          });
          continue;
        }

        // FIRST: Get contract utilities from the contract
        let contractUtilities: any[] = [];
        if (unit.contractId) {
          try {
            const contractResponse = await contractApi.getById(unit.contractId);
            const contract = contractResponse.data;
            console.log(`Contract ${unit.contractId} utilities:`, contract.includedUtilities);
            
            if (contract.includedUtilities && contract.includedUtilities.length > 0) {
              contractUtilities = contract.includedUtilities;
            }
          } catch (contractError) {
            console.error(`Error fetching contract ${unit.contractId}:`, contractError);
          }
        }

        // THIRD: Find CAM distribution for this unit
        const unitCam = camDistribution.find((cam) => cam.unitId === unit.id);

        // FOURTH: Combine all utilities
        const combinedUtilityFees: any[] = [];

        // Add contract utilities (fixed, allocated, metered)
        for (const utility of contractUtilities) {
          console.log(`Processing contract utility for unit ${unit.unitNumber}:`, utility);
          
          if (utility.calculationMethod === 'METERED') {
            // For metered utilities, find the calculated fee from utilityBilling
            const meteredFee = utilityBilling?.utilityFees?.find(f => 
              f.utilityTypeId === utility.id || 
              f.utilityName?.toLowerCase().includes(utility.utilityName?.toLowerCase() || '')
            );
            
            if (meteredFee) {
              combinedUtilityFees.push({
                ...meteredFee,
                isCAM: false,
                source: 'metered'
              });
            } else if (utility.ratePerUnit) {
              // If no meter reading, use base rate as minimum
              combinedUtilityFees.push({
                utilityName: utility.utilityName,
                calculationMethod: "FIXED",
                calculationFormula: `Minimum ${utility.utilityName} charge`,
                amount: utility.ratePerUnit,
                ratePerUnit: utility.ratePerUnit,
                quantity: 1,
                unit: undefined,
                isCAM: false,
                source: 'contract-fixed'
              });
            }
          } 
          else if (utility.calculationMethod === 'FIXED') {
            // Add fixed utilities
            if (utility.ratePerUnit) {
              combinedUtilityFees.push({
                utilityName: utility.utilityName,
                calculationMethod: "FIXED",
                calculationFormula: `Fixed ${utility.utilityName} fee`,
                amount: utility.ratePerUnit,
                ratePerUnit: utility.ratePerUnit,
                quantity: 1,
                unit: undefined,
                isCAM: false,
                source: 'contract-fixed'
              });
            }
          } 
          else if (utility.calculationMethod === 'ALLOCATED') {
            if (utility.utilityName.toLowerCase().includes('cam')) {
              // CAM will be handled separately below
              continue;
            } else {
              // Add other allocated utilities
              if (utility.ratePerUnit) {
                combinedUtilityFees.push({
                  utilityName: utility.utilityName,
                  calculationMethod: "ALLOCATED",
                  calculationFormula: `Allocated ${utility.utilityName}`,
                  amount: utility.ratePerUnit,
                  ratePerUnit: utility.ratePerUnit,
                  quantity: 1,
                  unit: undefined,
                  isCAM: false,
                  source: 'contract-allocated'
                });
              }
            }
          }
        }

        // Add any other metered utilities from utilityBilling that weren't in contract
        if (utilityBilling?.utilityFees) {
          for (const fee of utilityBilling.utilityFees) {
            // Check if this fee is already in combinedUtilityFees
            const alreadyExists = combinedUtilityFees.some(existingFee => 
              existingFee.utilityName === fee.utilityName ||
              (fee.utilityTypeId && existingFee.utilityTypeId === fee.utilityTypeId)
            );
            
            if (!alreadyExists && !fee.utilityName.toLowerCase().includes('cam')) {
              combinedUtilityFees.push({
                ...fee,
                isCAM: false,
                source: 'metered-additional'
              });
            }
          }
        }

        // Add CAM fees (Generator, Transformer, Other CAM)
        if (unitCam?.generatorFee && unitCam.generatorFee > 0) {
          combinedUtilityFees.push({
            utilityName: "Generator Fee (CAM)",
            calculationMethod: "FIXED" as const,
            calculationFormula: `(Generator ${selectedBuilding.generatorFee || 0} ÷ ${selectedBuilding.totalLeasableArea || 1}) × ${unit.unitSpace || 0}`,
            amount: unitCam.generatorFee,
            ratePerUnit: null,
            quantity: 1,
            unit: undefined,
            isCAM: true,
            source: 'cam'
          });
        }
        
        if (unitCam?.transformerFee && unitCam.transformerFee > 0) {
          combinedUtilityFees.push({
            utilityName: "Transformer Fee (CAM)",
            calculationMethod: "FIXED" as const,
            calculationFormula: `(Transformer ${selectedBuilding.transformerFee || 0} ÷ ${selectedBuilding.totalLeasableArea || 1}) × ${unit.unitSpace || 0}`,
            amount: unitCam.transformerFee,
            ratePerUnit: null,
            quantity: 1,
            unit: undefined,
            isCAM: true,
            source: 'cam'
          });
        }

        if (unitCam?.otherCAMFee && unitCam.otherCAMFee > 0) {
          combinedUtilityFees.push({
            utilityName: "Other CAM Costs",
            calculationMethod: "FIXED" as const,
            calculationFormula: `Other CAM costs allocation`,
            amount: unitCam.otherCAMFee,
            ratePerUnit: null,
            quantity: 1,
            unit: undefined,
            isCAM: true,
            source: 'cam'
          });
        }

        // Calculate totals
        const totalContractUtilities = combinedUtilityFees
          .filter(fee => !fee.isCAM)
          .reduce((sum, fee) => sum + (fee.amount || 0), 0);
          
        const totalCAM = (unitCam?.camFee || 0);
        const totalAmount = totalContractUtilities + totalCAM;

        const displayUtilityBilling: UtilityBillingDTO = {
          ...(utilityBilling || {
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            unitSpace: unit.unitSpace || 0,
            unitType: unit.unitType || '',
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            buildingId: selectedBuildingId,
            buildingName: selectedBuilding.buildingName,
            totalLeasableArea: selectedBuilding.totalLeasableArea || 0,
            totalCAMCosts: selectedBuilding.totalCAMCosts || 0
          }),
          utilityFees: combinedUtilityFees,
          totalAmount: totalAmount,
          grandTotal: totalAmount,
          taxAmount: 0,
        };

        // Add contract info if available
        if (unit.contractId) {
          displayUtilityBilling.contractId = unit.contractId;
          displayUtilityBilling.contractNumber = `CONTRACT-${unit.contractId}`;
        }
        if (unit.tenantName) {
          displayUtilityBilling.tenantName = unit.tenantName;
        }

        calculations.push({
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          unitSpace: unit.unitSpace || 0,
          tenantName: unit.tenantName,
          isOccupied: true,
          utilityBilling: displayUtilityBilling,
          camFee: unitCam?.camFee || 0,
          generatorFee: unitCam?.generatorFee || 0,
          transformerFee: unitCam?.transformerFee || 0,
          totalAmount: totalAmount,
          canGenerate: true, // This unit can generate invoice
          errorMessage: undefined
        });

        console.log(`Final calculation for unit ${unit.unitNumber}:`, {
          contractUtilities: contractUtilities.length,
          combinedFees: combinedUtilityFees.length,
          totalContractUtilities,
          totalCAM,
          totalAmount
        });

      } catch (error) {
        console.error(
          `Error calculating for unit ${unit.unitNumber}:`,
          error
        );
        // Continue with other units but add error info
        calculations.push({
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          unitSpace: unit.unitSpace || 0,
          tenantName: unit.tenantName,
          isOccupied: true,
          utilityBilling: null,
          camFee: 0,
          generatorFee: 0,
          transformerFee: 0,
          totalAmount: 0,
          canGenerate: false,
          errorMessage: "Error calculating utility bill"
        });
      }
    }

    if (calculations.length === 0) {
      setError("No utility calculations could be generated");
      return;
    }

    // Filter units that can generate invoices
    const validCalculations = calculations.filter(c => c.canGenerate);
    const unitsWithErrors = calculations.filter(c => !c.canGenerate);
    
    if (validCalculations.length === 0) {
      if (unitsWithErrors.length > 0) {
        const duplicateUnits = unitsWithErrors.filter(u => u.errorMessage?.includes("already exists"));
        const contractDateUnits = unitsWithErrors.filter(u => u.errorMessage?.includes("Contract doesn't cover"));
        const noContractUnits = unitsWithErrors.filter(u => u.errorMessage?.includes("No active contract"));
        
        if (duplicateUnits.length > 0) {
          setError(`All ${duplicateUnits.length} unit(s) already have invoices for this period.`);
        } else if (contractDateUnits.length > 0 || noContractUnits.length > 0) {
          setError(`${contractDateUnits.length + noContractUnits.length} unit(s) don't have contracts covering ${periodStart} to ${periodEnd}.`);
        } else {
          setError("No valid utility calculations generated. Check if invoices already exist for this period.");
        }
      } else {
        setError("No valid utility calculations generated");
      }
      return;
    }

    setUnitCalculations(validCalculations);
    setShowBilling(true);
    
    let successMessage = `Successfully calculated bills for ${validCalculations.length} occupied units. `;
    
    if (unitsWithErrors.length > 0) {
      const duplicateUnits = unitsWithErrors.filter(u => u.errorMessage?.includes("already exists"));
      const contractDateUnits = unitsWithErrors.filter(u => u.errorMessage?.includes("Contract doesn't cover"));
      const noContractUnits = unitsWithErrors.filter(u => u.errorMessage?.includes("No active contract"));
      
      if (duplicateUnits.length > 0) {
        successMessage += `${duplicateUnits.length} unit(s) already have invoices and were excluded. `;
      }
      
      if (contractDateUnits.length > 0 || noContractUnits.length > 0) {
        successMessage += `${contractDateUnits.length + noContractUnits.length} unit(s) don't have contracts covering this period and were excluded.`;
      }
    } else {
      successMessage += `Each bill includes: 1. Contract utilities + 2. Metered consumption + 3. CAM fees based on unit space.`;
    }
    
    setSuccess(successMessage);
    
    console.log('Final calculations:', validCalculations);
    
  } catch (err: any) {
    console.error('Error in calculateAllUtilityFees:', err);
    setError(
      err.response?.data?.message || "Failed to calculate utility bills"
    );
  } finally {
    setCalculating(false);
  }
};

  const generateAllInvoices = async () => {
    if (!selectedBuildingId) {
      setError(t("UsageEntryPage.generateBills.selectBuilding"));
      return;
    }

    // Check if user has permission for this building
    if (!canAccessBuilding(selectedBuildingId)) {
      setError(t("UsageEntryPage.permission.accessDenied"));
      return;
    }

    if (!periodStart || !periodEnd) {
      setError(t("UsageEntryPage.generateBills.selectPeriod"));
      return;
    }

    try {
      setGeneratingBill(true);
      setError("");
      setSuccess("");

      // Filter only units that can generate invoices
      const generatableUnits = unitCalculations.filter((uc) => uc.canGenerate);

      if (generatableUnits.length === 0) {
        setError("No units available for invoice generation. Some units may already have invoices.");
        return;
      }

      // Create requests - ensure we're sending clean utility data
      const requests: UtilityBillRequest[] = generatableUnits
        .map((uc) => {
          // Filter out CAM fees from utilityFees for backend
          const cleanUtilityFees = uc.utilityBilling?.utilityFees.filter(fee => 
            !fee.utilityName.includes('Generator Fee') &&
            !fee.utilityName.includes('Transformer Fee') 
          ) || [];

          return {
            unitId: uc.unitId,
            periodStart,
            periodEnd,
            dueDate,
            notes: notes || `Monthly utility bill for ${periodStart} to ${periodEnd}`,
            utilityFees: cleanUtilityFees,
            // The backend should handle CAM fees separately
            taxAmount: uc.utilityBilling?.taxAmount || 0,
            grandTotal: uc.totalAmount,
          };
        });

      if (requests.length === 0) {
        setError("No calculated utility fees available for invoice generation.");
        return;
      }

      console.log(
        "Sending requests to backend:",
        JSON.stringify(requests, null, 2)
      );

      // Call backend batch API - generate one by one to handle errors
      const results: {success: boolean, invoice?: InvoiceDTO, error?: string, unitId: number}[] = [];
      
      for (const request of requests) {
        try {
          const invoice = await utilityApi.generateUtilityBill(request);
          results.push({ success: true, invoice, unitId: request.unitId });
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || err.message || "Failed to generate invoice";
          results.push({ success: false, error: errorMsg, unitId: request.unitId });
          
          // If it's a duplicate invoice error, mark this unit as cannot generate
          if (errorMsg.includes("already exists") || errorMsg.includes("overlaps")) {
            setUnitCalculations(prev => prev.map(uc => 
              uc.unitId === request.unitId 
                ? {...uc, canGenerate: false, errorMessage: "Invoice already exists"} 
                : uc
            ));
          }
        }
      }

      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      // Update unit calculations to remove successfully generated ones
      const successfulUnitIds = successfulResults.map(r => r.unitId);
      const remainingCalculations = unitCalculations.filter(uc => 
        !successfulUnitIds.includes(uc.unitId)
      );
      
      setUnitCalculations(remainingCalculations);

      if (successfulResults.length === 0) {
        setError("Failed to generate any invoices. Please check if invoices already exist for this period.");
      } else if (failedResults.length > 0) {
        setSuccess(`Successfully generated ${successfulResults.length} invoice(s)!`);
        
        const duplicateErrors = failedResults.filter(r => r.error?.includes("already exists"));
        if (duplicateErrors.length > 0) {
          setError(`${duplicateErrors.length} unit(s) already have invoices: ${duplicateErrors.map(r => `Unit ${unitCalculations.find(uc => uc.unitId === r.unitId)?.unitNumber}`).join(', ')}`);
        } else {
          setError(`${failedResults.length} invoice(s) failed to generate.`);
        }
        
        // Check if all units are done
        if (remainingCalculations.length === 0) {
          setTimeout(() => {
            setShowBilling(false);
            setNotes("");
            loadData();
          }, 3000);
        }
      } else {
        setSuccess(`Successfully generated all ${successfulResults.length} invoices!`);
        
        // Clear everything after successful generation
        setTimeout(() => {
          setUnitCalculations([]);
          setShowBilling(false);
          setNotes("");
          loadData();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate invoices");
    } finally {
      setGeneratingBill(false);
    }
  };

  const closeBilling = () => {
    setUnitCalculations([]);
    setShowBilling(false);
    setSuccess("");
    setError("");
  };

  // Handle meter reading operations (existing functionality)
  const handleSaveReading = async () => {
    setShowForm(false);
    setSelectedReading(undefined);
    await loadData();
    setSuccess("Meter reading saved successfully");
  };

  const handleDeleteReading = async (id: number) => {
    if (window.confirm("Delete this meter reading?")) {
      try {
        await meterReadingApi.deleteMeterReading(id);
        await loadData();
        setSuccess("Meter reading deleted");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete reading");
      }
    }
  };

  // Statistics
  const getStatistics = () => {
    // Use filtered readings for statistics
    const electricity = filteredReadings.filter((r) =>
      r.utilityName?.toLowerCase().includes("electric")
    ).length;

    const water = filteredReadings.filter((r) =>
      r.utilityName?.toLowerCase().includes("water")
    ).length;

    const now = new Date();
    const thisMonth = filteredReadings.filter((r) => {
      const date = new Date(r.readingDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    return { total: filteredReadings.length, electricity, water, thisMonth };
  };

  const stats = getStatistics();
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  
  // Calculate how many units can still generate invoices
  const generatableUnitsCount = unitCalculations.filter(uc => uc.canGenerate).length;
  const allUnitsHaveInvoices = unitCalculations.length > 0 && generatableUnitsCount === 0;

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("UsageEntryPage.title")}
                {userRole !== 'ROLE_ADMIN' && (
                  <span className="text-sm font-normal text-blue-600 ml-2">
                    {t("UsageEntryPage.restrictedMode")}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("UsageEntryPage.subtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
                {t("UsageEntryPage.refresh")}
              </button>
            </div>
          </div>

          {/* User info and building assignment */}
          <div className="mt-4">
            {userRole !== 'ROLE_ADMIN' && assignedBuilding && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">{t("UsageEntryPage.assignedBuilding")}</span>
                  <span>{assignedBuilding.buildingName}</span>
                </div>
                <p className="text-sm mt-1">{t("UsageEntryPage.assignedBuildingNote")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Alerts */}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              {success}
            </div>
          )}

          {error && (
  <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{t("UsageEntryPage.alerts.error")}</p>
        <p className="text-sm">{error}</p>
        {error.includes("don't have contracts covering") && (
          <p className="text-xs mt-1">
            {t("UsageEntryPage.alerts.contractDateWarning")}
          </p>
        )}
      </div>
    </div>
  </div>
)}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t("UsageEntryPage.statistics.totalReadings")}</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t("UsageEntryPage.statistics.electricity")}</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.electricity}
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t("UsageEntryPage.statistics.water")}</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.water}
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t("UsageEntryPage.statistics.thisMonth")}</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.thisMonth}
              </div>
            </div>
          </div>

          {/* Building Selection and Utility Billing Calculator */}
          {!showForm && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
                  {t("UsageEntryPage.generateBills.title")}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("UsageEntryPage.generateBills.selectBuilding")} {userRole !== 'ROLE_ADMIN' && t("UsageEntryPage.generateBills.yourAssignedBuilding")}
                  </label>
                  <select
                    value={selectedBuildingId || ""}
                    onChange={(e) => {
                      const buildingId = Number(e.target.value);
                      
                      // Check if user has permission for this building
                      if (!canAccessBuilding(buildingId)) {
                        alert(t("UsageEntryPage.permission.accessDenied"));
                        return;
                      }
                      
                      setSelectedBuildingId(buildingId);
                      setBuildingUnits([]);
                      setUnitCalculations([]);
                      setShowBilling(false);
                      setError("");
                      setSuccess("");
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={userRole !== 'ROLE_ADMIN' && assignedBuilding !== null}
                  >
                    <option value="">Select building...</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.buildingName} ({building.branchName})
                        {userRole !== 'ROLE_ADMIN' && ` ${t("UsageEntryPage.generateBills.yourAssignedBuilding")}`}
                      </option>
                    ))}
                  </select>
                  {userRole !== 'ROLE_ADMIN' && assignedBuilding && (
                    <p className="text-sm text-blue-600 mt-1">
                      {t("UsageEntryPage.assignedBuilding")} {assignedBuilding.buildingName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("UsageEntryPage.generateBills.periodStart")}
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("UsageEntryPage.generateBills.periodEnd")}
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("UsageEntryPage.generateBills.dueDate")}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Building Information */}
{selectedBuilding && (
  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
      <Building2 className="w-5 h-5" />
      {t("UsageEntryPage.generateBills.buildingDetails")}
    </h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-600">{t("UsageEntryPage.buildingInfo.name")}:</span>
        <span className="font-medium ml-2">{selectedBuilding.buildingName}</span>
      </div>
      <div>
        <span className="text-gray-600">{t("UsageEntryPage.buildingInfo.branch")}:</span>
        <span className="font-medium ml-2">{selectedBuilding.branchName}</span>
      </div>
      <div>
        <span className="text-gray-600">{t("UsageEntryPage.buildingInfo.totalArea")}:</span>
        <span className="font-medium ml-2">
          {(selectedBuilding.totalLeasableArea || 0).toLocaleString()} {t("UsageEntryPage.generateBills.sqFt")}
        </span>
      </div>
      <div>
        <span className="text-gray-600">{t("UsageEntryPage.buildingInfo.generatorFee")}:</span>
        <span className="font-medium ml-2">
          {(selectedBuilding.generatorFee || 0).toLocaleString()} MMK
        </span>
      </div>
    </div>
    {buildingUnits.length > 0 && (
      <div className="mt-3 pt-3 border-t border-green-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-600">{t("UsageEntryPage.generateBills.totalUnits")}</span>{" "}
            {buildingUnits.length}
          </div>
          <div>
            <span className="text-gray-600">{t("UsageEntryPage.generateBills.occupied")}</span>{" "}
            {buildingUnits.filter((u) => u.isOccupied).length}
          </div>
          <div>
            <span className="text-gray-600">{t("UsageEntryPage.generateBills.vacant")}</span>{" "}
            {buildingUnits.filter((u) => !u.isOccupied).length}
          </div>
          <div>
            <span className="text-gray-600">{t("UsageEntryPage.generateBills.leasableArea")}</span>{" "}
            {(
              selectedBuilding.totalLeasableArea || 0
            ).toLocaleString()}{" "}
            {t("UsageEntryPage.generateBills.sqFt")}
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-gray-600">{t("UsageEntryPage.generateBills.totalCAMCosts")}</span>
          <span className="font-medium ml-2">
            {(
              (selectedBuilding.generatorFee || 0) +
              (selectedBuilding.transformerFee || 0) 
            ).toLocaleString()}{" "}
            MMK
          </span>
        </div>
        {/* Add contract date info warning */}
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>{t("UsageEntryPage.generateBills.contractNote", { start: periodStart, end: periodEnd })}</strong>
          </p>
        </div>
      </div>
    )}
  </div>
)}

              <div className="flex justify-center">
                <button
                  onClick={calculateAllUtilityFees}
                  disabled={
                    calculating ||
                    !selectedBuildingId ||
                    !periodStart ||
                    !periodEnd
                  }
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {calculating
                    ? t("UsageEntryPage.generateBills.calculating")
                    : t("UsageEntryPage.generateBills.calculate")}
                </button>
              </div>
            </div>
          )}

          {/* Billing Results */}
          {showBilling && unitCalculations.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t("UsageEntryPage.billingResults.title")}
                  {userRole !== 'ROLE_ADMIN' && assignedBuilding && (
                    <span className="text-sm font-normal text-blue-600 ml-2">
                      {t("UsageEntryPage.billingResults.yourBuilding")}
                    </span>
                  )}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={closeBilling}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t("UsageEntryPage.billingResults.cancel")}
                  </button>
                  <button
                    onClick={generateAllInvoices}
                    disabled={generatingBill || allUnitsHaveInvoices}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                      allUnitsHaveInvoices
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FileText className="w-4 h-4" />
                    {allUnitsHaveInvoices
                      ? t("UsageEntryPage.billingResults.allGenerated")
                      : generatingBill
                      ? t("UsageEntryPage.billingResults.generating")
                      : t("UsageEntryPage.billingResults.generate", { 
                          count: generatableUnitsCount, 
                          s: generatableUnitsCount !== 1 ? 's' : '' 
                        })}
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">{t("UsageEntryPage.billingResults.building")}</div>
                    <div className="font-medium">
                      {selectedBuilding?.buildingName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t("UsageEntryPage.billingResults.billingPeriod")}</div>
                    <div className="font-medium">
                      {periodStart} to {periodEnd}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t("UsageEntryPage.billingResults.dueDate")}</div>
                    <div className="font-medium">{dueDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t("UsageEntryPage.billingResults.totalUnits")}</span>{" "}
                    {unitCalculations.length}
                  </div>
                  <div>
                    <span className="text-gray-600">{t("UsageEntryPage.billingResults.readyToGenerate")}</span>{" "}
                    <span className={`font-medium ${generatableUnitsCount === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {generatableUnitsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("UsageEntryPage.billingResults.totalCAM")}</span>{" "}
                    {unitCalculations
                      .reduce((sum, uc) => sum + uc.camFee, 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </div>
                  <div>
                    <span className="text-gray-600">{t("UsageEntryPage.billingResults.grandTotal")}</span>{" "}
                    <strong className="text-green-600">
                      {unitCalculations
                        .reduce((sum, uc) => sum + uc.totalAmount, 0)
                        .toLocaleString("en-US")}{" "}
                      MMK
                    </strong>
                  </div>
                </div>
                
                {allUnitsHaveInvoices && (
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <span>{t("UsageEntryPage.billingResults.allInvoicesExist")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Unit Calculations Table */}
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("UsageEntryPage.unitTable.unitTenant")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("UsageEntryPage.unitTable.meteredUtilities")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("UsageEntryPage.unitTable.camFees")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("UsageEntryPage.unitTable.totalAmount")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("UsageEntryPage.unitTable.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {unitCalculations.map((calculation) => {
                      // Filter CAM vs Metered utilities
                      const meteredUtilities = calculation.utilityBilling?.utilityFees.filter(fee => !fee.isCAM) || [];
                      const camFees = calculation.utilityBilling?.utilityFees.filter(fee => fee.isCAM) || [];

                      return (
                        <tr key={calculation.unitId} className={`hover:bg-gray-50 transition-colors ${
                          !calculation.canGenerate ? 'bg-gray-50 opacity-75' : ''
                        }`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">
                                {calculation.unitNumber}
                              </div>
                              {!calculation.canGenerate && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  {t("UsageEntryPage.unitTable.invoiceExists")}
                                </span>
                              )}
                            </div>
                            {calculation.tenantName && (
                              <div className="text-sm text-gray-500">
                                {calculation.tenantName}
                              </div>
                            )}
                            {calculation.unitSpace > 0 && (
                              <div className="text-xs text-gray-400">
                                {calculation.unitSpace.toLocaleString()} {t("UsageEntryPage.generateBills.sqFt")}
                                {selectedBuilding?.totalLeasableArea && selectedBuilding.totalLeasableArea > 0 && (
                                  <span className="ml-2 text-green-600">
                                    ({((calculation.unitSpace / selectedBuilding.totalLeasableArea) * 100).toFixed(1)}% of building)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {/* Metered Utilities */}
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 font-medium mb-1">{t("UsageEntryPage.unitTable.meteredUtilities")}</div>
                              {meteredUtilities.map((fee, idx) => (
                                <div key={idx} className="text-sm">
                                  {fee.utilityName}: {fee.amount.toLocaleString("en-US")} MMK
                                </div>
                              ))}
                              {meteredUtilities.length === 0 && (
                                <div className="text-sm text-gray-400 italic">{t("UsageEntryPage.unitTable.noMeteredUtilities")}</div>
                              )}
                              {meteredUtilities.length > 0 && (
                                <div className="mt-1 pt-1 border-t border-gray-100 text-xs font-medium">
                                  {t("UsageEntryPage.unitTable.subtotal")} {meteredUtilities.reduce((sum, fee) => sum + (fee.amount || 0), 0).toLocaleString("en-US")} MMK
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {/* CAM Fees */}
                            <div>
                              <div className="text-xs text-gray-500 font-medium mb-1">{t("UsageEntryPage.unitTable.camFees")}</div>
                              <div className="text-sm space-y-1">
                                {calculation.generatorFee > 0 && (
                                  <div className="flex justify-between">
                                    <span>{t("UsageEntryPage.unitTable.generator")}</span>
                                    <span className="font-medium">
                                      {calculation.generatorFee.toLocaleString("en-US")} MMK
                                    </span>
                                  </div>
                                )}
                                {calculation.transformerFee > 0 && (
                                  <div className="flex justify-between">
                                    <span>{t("UsageEntryPage.unitTable.transformer")}</span>
                                    <span className="font-medium">
                                      {calculation.transformerFee.toLocaleString("en-US")} MMK
                                    </span>
                                  </div>
                                )}
                                
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex justify-between font-bold text-green-600">
                                    <span>{t("UsageEntryPage.unitTable.totalCAM")}</span>
                                    <span>
                                      {calculation.camFee.toLocaleString("en-US")} MMK
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-lg font-bold text-gray-900">
                              {calculation.totalAmount.toLocaleString("en-US")} MMK
                            </div>
                            <div className="text-xs text-gray-500">
                              {t("UsageEntryPage.unitTable.metered")} {(calculation.totalAmount - calculation.camFee).toLocaleString("en-US")} MMK
                            </div>
                            <div className="text-xs text-green-600">
                              CAM: {calculation.camFee.toLocaleString("en-US")} MMK
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {calculation.canGenerate ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">{t("UsageEntryPage.unitTable.readyToGenerate")}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{t("UsageEntryPage.unitTable.invoiceExistsStatus")}</span>
                              </div>
                            )}
                            {calculation.errorMessage && (
                              <div className="text-xs text-red-500 mt-1">
                                {calculation.errorMessage}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-6">
                <div className="max-w-md ml-auto space-y-2">
                  <div className="flex justify-between">
                    <span>{t("UsageEntryPage.unitTable.totalMetered")}</span>
                    <span>
                      {unitCalculations
                        .reduce((sum, uc) => sum + (uc.totalAmount - uc.camFee), 0)
                        .toLocaleString("en-US")}{" "}
                      MMK
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="font-medium">{t("UsageEntryPage.unitTable.totalCAM")}</span>
                    <span className="font-medium">
                      {unitCalculations
                        .reduce((sum, uc) => sum + uc.camFee, 0)
                        .toLocaleString("en-US")}{" "}
                      MMK
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("UsageEntryPage.unitTable.totalGenerator")}</span>
                    <span>
                      {unitCalculations
                        .reduce((sum, uc) => sum + uc.generatorFee, 0)
                        .toLocaleString("en-US")}{" "}
                      MMK
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("UsageEntryPage.unitTable.totalTransformer")}</span>
                    <span>
                      {unitCalculations
                        .reduce((sum, uc) => sum + uc.transformerFee, 0)
                        .toLocaleString("en-US")}{" "}
                      MMK
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-lg font-bold">{t("UsageEntryPage.billingResults.grandTotal")}</span>
                    <span className="text-lg font-bold text-green-600">
                      {unitCalculations
                        .reduce((sum, uc) => sum + uc.totalAmount, 0)
                        .toLocaleString("en-US")}{" "}
                      MMK
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("UsageEntryPage.billingResults.notes")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={t("UsageEntryPage.billingResults.notesPlaceholder")}
                />
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default UsageEntryPage;