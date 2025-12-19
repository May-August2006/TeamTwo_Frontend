/** @format */

// UsageEntryPage.tsx - Updated Version with Building Selection and CAM Fees
import React, { useState, useEffect } from "react";
import { Building2, FileText, Zap, Battery } from "lucide-react";
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
import MeterReadingTable from "../../components/meter/MeterReadingTable";
import MeterReadingForm from "../../components/meter/MeterReadingForm";

import "jspdf-autotable";

interface UnitWithOccupancy extends Unit {
  isOccupied: boolean;
  tenantName?: string;
  contractId?: number;
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
  otherCAMFee: number;
  totalAmount: number;
}

const UsageEntryPage: React.FC = () => {
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
  const [otherCAMCosts, setOtherCAMCosts] = useState<number>(150000);

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

  // Accountant restrictions
  const [assignedBuilding, setAssignedBuilding] = useState<Building | null>(null);
  const [isAccountant, setIsAccountant] = useState(false);

  useEffect(() => {
    loadData();
    checkUserRoleAndBuilding();

    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const due = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    setPeriodStart(firstDay.toISOString().split("T")[0]);
    setPeriodEnd(lastDay.toISOString().split("T")[0]);
    setDueDate(due.toISOString().split("T")[0]);
  }, []);

  const checkUserRoleAndBuilding = async () => {
    try {
      // Get user role from localStorage or context (adjust based on your auth system)
      const userRole = localStorage.getItem('userRole'); // or use your auth context
      
      if (userRole === 'ACCOUNTANT' || userRole === 'accountant') {
        setIsAccountant(true);
        
        // Get accountant's assigned building
        const buildingResponse = await buildingApi.getMyAssignedBuilding();
        if (buildingResponse.data) {
          const building = buildingResponse.data;
          setAssignedBuilding(building);
          setSelectedBuildingId(building.id);
          
          // Load units for this building
          await loadBuildingUnits(building.id);
          
          // Filter buildings to only show assigned building
          setBuildings([building]);
        }
      } else {
        // For non-accountants, load all available buildings
        const availableBuildings = await buildingApi.getAvailableBuildings();
        setBuildings(availableBuildings.data || []);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // Fallback to loading all buildings
      const allBuildings = await buildingApi.getAll();
      setBuildings(allBuildings.data || []);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [readingsData, unitsData, buildingsData] = await Promise.all([
        meterReadingApi.getAllMeterReadings(),
        unitService.getAllUnits(),
        buildingApi.getAll().then((res) => res.data || []),
      ]);
      setReadings(readingsData);
      setUnits(unitsData);
      
      // Only update buildings if not an accountant (accountant's buildings are set in checkUserRoleAndBuilding)
      if (!isAccountant) {
        setBuildings(buildingsData);
      }
      
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingUnits = async (buildingId: number) => {
    // If user is accountant and trying to access different building, prevent it
    if (isAccountant && assignedBuilding && assignedBuilding.id !== buildingId) {
      setError("You can only manage your assigned building");
      setBuildingUnits([]);
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

          unitsWithOccupancy.push({
            ...unit,
            isOccupied,
            tenantName,
            contractId,
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
        const otherCAMShare = totalLeasableArea > 0 ? (unitSpace / totalLeasableArea) * otherCAMCosts : 0;

        const totalCAMFee = generatorShare + transformerShare + otherCAMShare;

        return {
          unitId: unit.id,
          camFee: parseFloat(totalCAMFee.toFixed(2)),
          generatorFee: parseFloat(generatorShare.toFixed(2)),
          transformerFee: parseFloat(transformerShare.toFixed(2)),
          otherCAMFee: parseFloat(otherCAMShare.toFixed(2)),
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
      setError("Please select a building");
      return;
    }

    // Accountant restriction check
    if (isAccountant && assignedBuilding && assignedBuilding.id !== selectedBuildingId) {
      setError("You can only calculate bills for your assigned building");
      return;
    }

    if (!periodStart || !periodEnd) {
      setError("Please select a billing period");
      return;
    }

    try {
      setCalculating(true);
      setError("");

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

      for (const unit of occupiedUnits) {
        try {
          // Get metered utilities ONLY (electricity, water, etc.)
          const utilityBilling = await utilityApi.calculateUtilityBill(
            unit.id,
            periodStart,
            periodEnd
          );

          // Find CAM distribution for this unit
          const unitCam = camDistribution.find((cam) => cam.unitId === unit.id);

          // Filter out any CAM fees that might be in the utilityBilling
          const meteredUtilities = utilityBilling.utilityFees.filter(fee => 
            !fee.utilityName.toLowerCase().includes('cam') &&
            !fee.utilityName.toLowerCase().includes('generator') &&
            !fee.utilityName.toLowerCase().includes('transformer') &&
            !fee.utilityName.toLowerCase().includes('maintenance') &&
            !fee.utilityName.toLowerCase().includes('internet') &&
            !fee.utilityName.toLowerCase().includes('fixed')
          );

          // Create a combined billing that includes:
          // 1. Metered utilities (from utilityBilling)
          // 2. CAM fees (Generator, Transformer, Other CAM)
          const combinedUtilityFees = [
            // Metered utilities
            ...meteredUtilities,
            // CAM fees (added separately)
            ...(unitCam?.generatorFee && unitCam.generatorFee > 0 ? [{
              utilityName: "Generator Fee (CAM)",
              calculationMethod: "FIXED" as const,
              calculationFormula: `(Generator ${selectedBuilding.generatorFee || 0} ÷ ${selectedBuilding.totalLeasableArea || 1}) × ${unit.unitSpace || 0}`,
              amount: unitCam.generatorFee,
              ratePerUnit: null,
              quantity: 1,
              unit: undefined,
              isCAM: true,
            }] : []),
            ...(unitCam?.transformerFee && unitCam.transformerFee > 0 ? [{
              utilityName: "Transformer Fee (CAM)",
              calculationMethod: "FIXED" as const,
              calculationFormula: `(Transformer ${selectedBuilding.transformerFee || 0} ÷ ${selectedBuilding.totalLeasableArea || 1}) × ${unit.unitSpace || 0}`,
              amount: unitCam.transformerFee,
              ratePerUnit: null,
              quantity: 1,
              unit: undefined,
              isCAM: true,
            }] : []),
            ...(unitCam?.otherCAMFee && unitCam.otherCAMFee > 0 ? [{
              utilityName: "Other CAM Costs",
              calculationMethod: "FIXED" as const,
              calculationFormula: `(Other CAM ${otherCAMCosts} ÷ ${selectedBuilding.totalLeasableArea || 1}) × ${unit.unitSpace || 0}`,
              amount: unitCam.otherCAMFee,
              ratePerUnit: null,
              quantity: 1,
              unit: undefined,
              isCAM: true,
            }] : [])
          ];

          // Calculate totals
          const totalMeteredUtilities = meteredUtilities.reduce(
            (sum, fee) => sum + (fee.amount || 0), 0
          );
          const totalCAM = (unitCam?.camFee || 0);
          const totalAmount = totalMeteredUtilities + totalCAM;

          const displayUtilityBilling: UtilityBillingDTO = {
            ...utilityBilling,
            utilityFees: combinedUtilityFees,
            totalAmount: totalAmount,
            grandTotal: totalAmount,
            taxAmount: utilityBilling.taxAmount || 0,
          };

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
            otherCAMFee: unitCam?.otherCAMFee || 0,
            totalAmount: totalAmount,
          });
        } catch (error) {
          console.error(
            `Error calculating for unit ${unit.unitNumber}:`,
            error
          );
          // Continue with other units
        }
      }

      if (calculations.length === 0) {
        setError("No utility calculations could be generated");
        return;
      }

      setUnitCalculations(calculations);
      setShowBilling(true);
      setSuccess(
        `Calculated bills for ${calculations.length} occupied units. Each unit pays: 
        1. Metered utilities (electricity/water) + 
        2. CAM fees (Generator, Transformer, Other CAM) based on unit space.`
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to calculate utility bills"
      );
    } finally {
      setCalculating(false);
    }
  };

  const generateAllInvoices = async () => {
    // Accountant restriction check
    if (isAccountant && assignedBuilding && assignedBuilding.id !== selectedBuildingId) {
      setError("You can only generate invoices for your assigned building");
      return;
    }

    if (!selectedBuildingId) {
      setError("Please select a building");
      return;
    }

    if (!periodStart || !periodEnd) {
      setError("Please select a billing period");
      return;
    }

    try {
      setGeneratingBill(true);
      setError("");

      // Create requests - ensure we're sending clean utility data
      const requests: UtilityBillRequest[] = unitCalculations
        .filter((uc) => uc.utilityBilling)
        .map((uc) => {
          // Filter out CAM fees from utilityFees for backend
          const cleanUtilityFees = uc.utilityBilling?.utilityFees.filter(fee => 
            !fee.utilityName.includes('Generator Fee') &&
            !fee.utilityName.includes('Transformer Fee') &&
            !fee.utilityName.includes('Other CAM Costs')
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

      // Call backend batch API
      const invoices: InvoiceDTO[] = await utilityApi.generateUtilityBills(
        requests
      );

      setSuccess(`Successfully generated ${invoices.length} invoices!`);

      // Optionally, refresh calculations or clear after generation
      setTimeout(() => {
        setUnitCalculations([]);
        setShowBilling(false);
        setNotes("");
        loadData(); // refresh meter readings if needed
      }, 2000);
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
    const electricity = readings.filter((r) =>
      r.utilityName?.toLowerCase().includes("electric")
    ).length;

    const water = readings.filter((r) =>
      r.utilityName?.toLowerCase().includes("water")
    ).length;

    const now = new Date();
    const thisMonth = readings.filter((r) => {
      const date = new Date(r.readingDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    return { total: readings.length, electricity, water, thisMonth };
  };

  const stats = getStatistics();
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Building Utility Billing Management
            {isAccountant && assignedBuilding && (
              <span className="text-lg font-normal text-blue-600 ml-2">
                (Assigned to: {assignedBuilding.buildingName})
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage meter readings and generate utility bills for entire
            buildings
          </p>
          {isAccountant && (
            <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded inline-block">
              <span className="font-medium">Accountant Mode:</span> You can only manage your assigned building
            </div>
          )}
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Readings</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Electricity</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.electricity}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Water</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.water}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">This Month</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.thisMonth}
            </div>
          </div>
        </div>

        {/* Building Selection and Utility Billing Calculator */}
        {!showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
                Generate Building Utility Bills
              </h2>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Meter Reading
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Building {isAccountant && "(Your assigned building)"}
                </label>
                <select
                  value={selectedBuildingId || ""}
                  onChange={(e) => {
                    const buildingId = Number(e.target.value);
                    if (isAccountant && assignedBuilding && assignedBuilding.id !== buildingId) {
                      setError("You can only manage your assigned building");
                      return;
                    }
                    setSelectedBuildingId(buildingId);
                    setBuildingUnits([]);
                    setUnitCalculations([]);
                    setShowBilling(false);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  disabled={isAccountant && assignedBuilding !== null}
                >
                  <option value="">Select building...</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.buildingName} ({building.branchName})
                      {isAccountant && " (Your assigned building)"}
                    </option>
                  ))}
                </select>
                {isAccountant && assignedBuilding && (
                  <p className="text-sm text-blue-600 mt-1">
                    You are assigned to: {assignedBuilding.buildingName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start *
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End *
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Other CAM Costs Configuration */}
            {selectedBuildingId && (
              <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Other Monthly CAM Costs (MMK)
                  <span className="text-blue-500 text-xs ml-2">
                    (Common area maintenance, security, cleaning, etc.)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={otherCAMCosts}
                      onChange={(e) =>
                        setOtherCAMCosts(parseFloat(e.target.value) || 0)
                      }
                      className="w-full border border-blue-300 rounded px-3 py-2 bg-white"
                      min="0"
                      step="10000"
                    />
                  </div>
                  <div className="text-sm font-medium text-blue-800">
                    Total: {otherCAMCosts.toLocaleString("en-US")} MMK
                  </div>
                </div>
              </div>
            )}

            {/* Building Information */}
            {selectedBuilding && (
              <div className="mb-6 p-4 bg-green-50 rounded">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Selected Building Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Building:</span>{" "}
                    {selectedBuilding.buildingName}
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>{" "}
                    {selectedBuilding.buildingType}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">Transformer:</span>{" "}
                    {(selectedBuilding.transformerFee || 0).toLocaleString()}{" "}
                    MMK
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Generator:</span>{" "}
                    {(selectedBuilding.generatorFee || 0).toLocaleString()} MMK
                  </div>
                </div>
                {buildingUnits.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-600">Total Units:</span>{" "}
                        {buildingUnits.length}
                      </div>
                      <div>
                        <span className="text-gray-600">Occupied:</span>{" "}
                        {buildingUnits.filter((u) => u.isOccupied).length}
                      </div>
                      <div>
                        <span className="text-gray-600">Vacant:</span>{" "}
                        {buildingUnits.filter((u) => !u.isOccupied).length}
                      </div>
                      <div>
                        <span className="text-gray-600">Leasable Area:</span>{" "}
                        {(
                          selectedBuilding.totalLeasableArea || 0
                        ).toLocaleString()}{" "}
                        sq.ft
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Total CAM Costs:</span>
                      <span className="font-medium ml-2">
                        {(
                          (selectedBuilding.generatorFee || 0) +
                          (selectedBuilding.transformerFee || 0) +
                          otherCAMCosts
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
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
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {calculating
                  ? "Calculating..."
                  : "Calculate All Utility Bills (Including CAM)"}
              </button>
            </div>
          </div>
        )}

        {/* Billing Results */}
        {showBilling && unitCalculations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Building Utility Bill Calculation
                {isAccountant && assignedBuilding && (
                  <span className="text-sm font-normal text-blue-600 ml-2">
                    (Your assigned building)
                  </span>
                )}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={closeBilling}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateAllInvoices}
                  disabled={generatingBill}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {generatingBill
                    ? "Generating..."
                    : `Generate ${unitCalculations.length} Bills`}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Building</div>
                  <div className="font-medium">
                    {selectedBuilding?.buildingName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Billing Period</div>
                  <div className="font-medium">
                    {periodStart} to {periodEnd}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Due Date</div>
                  <div className="font-medium">{dueDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Units:</span>{" "}
                  {unitCalculations.length}
                </div>
                <div>
                  <span className="text-gray-600">Total CAM:</span>{" "}
                  {unitCalculations
                    .reduce((sum, uc) => sum + uc.camFee, 0)
                    .toLocaleString("en-US")}{" "}
                  MMK
                </div>
                <div>
                  <span className="text-gray-600">Total Utilities:</span>{" "}
                  {unitCalculations
                    .reduce(
                      (sum, uc) =>
                        sum + (uc.utilityBilling?.totalAmount || 0) - uc.camFee,
                      0
                    )
                    .toLocaleString("en-US")}{" "}
                  MMK
                </div>
                <div>
                  <span className="text-gray-600">Grand Total:</span>{" "}
                  <strong>
                    {unitCalculations
                      .reduce((sum, uc) => sum + uc.totalAmount, 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </strong>
                </div>
              </div>
            </div>

            {/* Unit Calculations Table */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit & Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Metered Utilities
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CAM Fees (Shared)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unitCalculations.map((calculation) => {
                    // Filter CAM vs Metered utilities
                    const meteredUtilities = calculation.utilityBilling?.utilityFees.filter(fee => !fee.isCAM) || [];
                    const camFees = calculation.utilityBilling?.utilityFees.filter(fee => fee.isCAM) || [];

                    return (
                      <tr key={calculation.unitId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {calculation.unitNumber}
                          </div>
                          {calculation.tenantName && (
                            <div className="text-sm text-gray-500">
                              {calculation.tenantName}
                            </div>
                          )}
                          {calculation.unitSpace > 0 && (
                            <div className="text-xs text-gray-400">
                              {calculation.unitSpace.toLocaleString()} sq.ft
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
                            <div className="text-xs text-gray-500 font-medium mb-1">Metered Utilities:</div>
                            {meteredUtilities.map((fee, idx) => (
                              <div key={idx} className="text-sm">
                                {fee.utilityName}: {fee.amount.toLocaleString("en-US")} MMK
                              </div>
                            ))}
                            {meteredUtilities.length === 0 && (
                              <div className="text-sm text-gray-400 italic">No metered utilities</div>
                            )}
                            {meteredUtilities.length > 0 && (
                              <div className="mt-1 pt-1 border-t border-gray-100 text-xs font-medium">
                                Subtotal: {meteredUtilities.reduce((sum, fee) => sum + (fee.amount || 0), 0).toLocaleString("en-US")} MMK
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {/* CAM Fees */}
                          <div>
                            <div className="text-xs text-gray-500 font-medium mb-1">CAM Fees (Shared):</div>
                            <div className="text-sm space-y-1">
                              {calculation.generatorFee > 0 && (
                                <div className="flex justify-between">
                                  <span>Generator:</span>
                                  <span className="font-medium">
                                    {calculation.generatorFee.toLocaleString("en-US")} MMK
                                  </span>
                                </div>
                              )}
                              {calculation.transformerFee > 0 && (
                                <div className="flex justify-between">
                                  <span>Transformer:</span>
                                  <span className="font-medium">
                                    {calculation.transformerFee.toLocaleString("en-US")} MMK
                                  </span>
                                </div>
                              )}
                              {calculation.otherCAMFee > 0 && (
                                <div className="flex justify-between">
                                  <span>Other CAM:</span>
                                  <span className="font-medium">
                                    {calculation.otherCAMFee.toLocaleString("en-US")} MMK
                                  </span>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex justify-between font-bold text-green-600">
                                  <span>Total CAM:</span>
                                  <span>
                                    {calculation.camFee.toLocaleString("en-US")} MMK
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          <div className="text-lg">
                            {calculation.totalAmount.toLocaleString("en-US")} MMK
                          </div>
                          <div className="text-xs text-gray-500">
                            Metered: {(calculation.totalAmount - calculation.camFee).toLocaleString("en-US")} MMK
                          </div>
                          <div className="text-xs text-green-600">
                            CAM: {calculation.camFee.toLocaleString("en-US")} MMK
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t pt-6">
              <div className="max-w-md ml-auto space-y-2">
                <div className="flex justify-between">
                  <span>Total Metered Utilities:</span>
                  <span>
                    {unitCalculations
                      .reduce((sum, uc) => sum + (uc.totalAmount - uc.camFee), 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total CAM Fees:</span>
                  <span className="font-medium">
                    {unitCalculations
                      .reduce((sum, uc) => sum + uc.camFee, 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Generator Fees:</span>
                  <span>
                    {unitCalculations
                      .reduce((sum, uc) => sum + uc.generatorFee, 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Transformer Fees:</span>
                  <span>
                    {unitCalculations
                      .reduce((sum, uc) => sum + uc.transformerFee, 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Other CAM Fees:</span>
                  <span>
                    {unitCalculations
                      .reduce((sum, uc) => sum + uc.otherCAMFee, 0)
                      .toLocaleString("en-US")}{" "}
                    MMK
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-bold">Grand Total:</span>
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
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Add any notes for these bills..."
              />
            </div>
          </div>
        )}

        {/* Meter Readings Table or Form */}
        {showForm ? (
          <MeterReadingForm
            reading={selectedReading}
            onSave={handleSaveReading}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Meter Readings
              </h2>
            </div>
            <MeterReadingTable
              readings={readings}
              onEdit={(reading) => {
                setSelectedReading(reading);
                setShowForm(true);
              }}
              onDelete={handleDeleteReading}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageEntryPage;