// BuildingUtilityInvoicePage.tsx - Fixed occupancy calculation
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Building2, 
  Calculator, 
  Send, 
  Zap, 
  Battery, 
  Home,
  PieChart,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { buildingApi } from '../../api/BuildingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { contractApi } from '../../api/ContractAPI'; // Need contract API to check occupancy
import type { Building } from '../../types';
import type { UtilityBillingDTO, UtilityBillRequest } from '../../types/utility';
import type { Contract } from '../../types/contract';

interface UnitInfo {
  id: number;
  unitNumber: string;
  unitSpace: number;
  tenantName?: string;
  contractId?: number;
  isOccupied: boolean;
}

interface UnitCAMCalculation {
  unitId: number;
  unitNumber: string;
  unitSpace: number;
  tenantName?: string;
  isOccupied: boolean;
  camShare: number;
  percentage: number;
  details: {
    generatorShare: number;
    transformerShare: number;
    otherCAMShare: number;
  };
}

interface CAMSummary {
  totalLeasableArea: number;
  totalOccupiedArea: number;
  totalVacantArea: number;
  occupiedPercentage: number;
  vacantPercentage: number;
  totalCAMCosts: number;
  tenantsCAM: number;
  ownerCAM: number;
  unitBreakdown: UnitCAMCalculation[];
  occupiedUnitsCount: number;
  vacantUnitsCount: number;
}

const BuildingUtilityInvoicePage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [calculations, setCalculations] = useState<Map<number, UtilityBillingDTO>>(new Map());
  const [camSummary, setCamSummary] = useState<CAMSummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCAMPreview, setShowCAMPreview] = useState(false);
  const [units, setUnits] = useState<UnitInfo[]>([]);

  // CAM Configuration
  const [otherCAMCosts, setOtherCAMCosts] = useState<number>(150000); // Default other CAM costs in MMK

  useEffect(() => {
    loadBuildings();
    // Set default dates for current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const due = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
    setDueDate(due.toISOString().split('T')[0]);
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await buildingApi.getAll();
      setBuildings(response.data || []);
    } catch (error: any) {
      setError('Failed to load buildings: ' + (error.message || 'Unknown error'));
      console.error('Error loading buildings:', error);
    } finally {
      setLoading(false);
    }
  };

 const loadBuildingUnits = async (buildingId: number) => {
  try {
    setLoading(true);
    
    // Get units in building
    const unitsResponse = await buildingApi.getUnitsByBuilding(buildingId);
    const unitsData = unitsResponse.data || [];
    
    // For each unit, check if it has an active contract
    const unitsWithOccupancy: UnitInfo[] = [];
    
    for (const unit of unitsData) {
      try {
        // Get all contracts for this unit
        const contractsResponse = await contractApi.getAll();
        const allContracts = contractsResponse.data || [];
        
        // Filter contracts for this unit with active status
        const unitContracts = allContracts.filter(contract => 
          contract.unit?.id === unit.id && 
          contract.contractStatus === 'ACTIVE'
        );
        
        const isOccupied = unitContracts.length > 0;
        const tenantName = isOccupied && unitContracts[0].tenant?.tenantName 
          ? unitContracts[0].tenant.tenantName 
          : undefined;
        const contractId = isOccupied ? unitContracts[0].id : undefined;
        
        unitsWithOccupancy.push({
          id: unit.id,
          unitNumber: unit.unitNumber || `Unit ${unit.id}`,
          unitSpace: unit.unitSpace || 0,
          tenantName,
          contractId,
          isOccupied
        });
        
      } catch (contractError) {
        console.error(`Error checking occupancy for unit ${unit.id}:`, contractError);
        // If we can't check contracts, assume vacant
        unitsWithOccupancy.push({
          id: unit.id,
          unitNumber: unit.unitNumber || `Unit ${unit.id}`,
          unitSpace: unit.unitSpace || 0,
          isOccupied: false
        });
      }
    }
    
    setUnits(unitsWithOccupancy);
    return unitsWithOccupancy;
    
  } catch (error: any) {
    console.error('Error loading building units:', error);
    setError('Failed to load unit information');
    return [];
  } finally {
    setLoading(false);
  }
};

  const calculateCAMDistsribution = async () => {
    if (!selectedBuildingId) {
      setError('Please select a building');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get the selected building to access generator and transformer fees
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      if (!selectedBuilding) {
        setError('Selected building not found');
        return;
      }
      
      // Load units with actual occupancy data
      const unitsWithOccupancy = await loadBuildingUnits(selectedBuildingId);
      
      if (unitsWithOccupancy.length === 0) {
        setError('No units found in this building');
        return;
      }
      
      console.log('Units with occupancy:', unitsWithOccupancy); // Debug log
      
      // Extract building fees
      const generatorFee = selectedBuilding.generatorFee || 0;
      const transformerFee = selectedBuilding.transformerFee || 0;
      const totalLeasableArea = selectedBuilding.totalLeasableArea || 0;
      
      if (totalLeasableArea === 0) {
        setError('Total leasable area is not set for this building');
        return;
      }
      
      // Calculate total CAM costs in MMK
      const totalCAMCosts = (generatorFee + transformerFee + otherCAMCosts);
      
      // Calculate total occupied and vacant areas
      let totalOccupiedArea = 0;
      let totalVacantArea = 0;
      let occupiedUnitsCount = 0;
      let vacantUnitsCount = 0;
      
      // First pass: Calculate occupied/vacant areas
      const unitCalculations: UnitCAMCalculation[] = [];
      
      for (const unit of unitsWithOccupancy) {
        const unitSpace = unit.unitSpace || 0;
        
        if (unit.isOccupied) {
          totalOccupiedArea += unitSpace;
          occupiedUnitsCount++;
        } else {
          totalVacantArea += unitSpace;
          vacantUnitsCount++;
        }
        
        const percentage = (unitSpace / totalLeasableArea) * 100;
        
        // Calculate individual shares
        const generatorShare = (unitSpace / totalLeasableArea) * generatorFee;
        const transformerShare = (unitSpace / totalLeasableArea) * transformerFee;
        const otherCAMShare = (unitSpace / totalLeasableArea) * otherCAMCosts;
        
        // Total CAM share for this unit
        const camShare = generatorShare + transformerShare + otherCAMShare;
        
        unitCalculations.push({
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          unitSpace,
          tenantName: unit.tenantName || (unit.isOccupied ? 'Occupied (No Name)' : 'Vacant'),
          isOccupied: unit.isOccupied,
          camShare: parseFloat(camShare.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          details: {
            generatorShare: parseFloat(generatorShare.toFixed(2)),
            transformerShare: parseFloat(transformerShare.toFixed(2)),
            otherCAMShare: parseFloat(otherCAMShare.toFixed(2))
          }
        });
      }
      
      // Verify calculations
      console.log('Occupancy Summary:', {
        totalUnits: unitsWithOccupancy.length,
        occupiedUnitsCount,
        vacantUnitsCount,
        totalOccupiedArea,
        totalVacantArea,
        totalLeasableArea
      });
      
      // Calculate total CAM allocation
      const occupiedPercentage = (totalOccupiedArea / totalLeasableArea) * 100;
      const vacantPercentage = (totalVacantArea / totalLeasableArea) * 100;
      
      const tenantsCAM = (totalOccupiedArea / totalLeasableArea) * totalCAMCosts;
      const ownerCAM = (totalVacantArea / totalLeasableArea) * totalCAMCosts;
      
      const summary: CAMSummary = {
        totalLeasableArea,
        totalOccupiedArea,
        totalVacantArea,
        occupiedPercentage: parseFloat(occupiedPercentage.toFixed(2)),
        vacantPercentage: parseFloat(vacantPercentage.toFixed(2)),
        totalCAMCosts,
        tenantsCAM: parseFloat(tenantsCAM.toFixed(2)),
        ownerCAM: parseFloat(ownerCAM.toFixed(2)),
        unitBreakdown: unitCalculations,
        occupiedUnitsCount,
        vacantUnitsCount
      };
      
      setCamSummary(summary);
      setShowCAMPreview(true);
      setSuccess(`Calculated CAM distribution for ${occupiedUnitsCount} occupied and ${vacantUnitsCount} vacant units`);
      
    } catch (error: any) {
      setError('Error calculating CAM distribution: ' + (error.message || 'Unknown error'));
      console.error('Error calculating CAM:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBuildingUtilities = async () => {
    if (!selectedBuildingId) {
      setError('Please select a building');
      return;
    }
    
    if (!periodStart || !periodEnd) {
      setError('Please select period start and end dates');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get occupied units
      const occupiedUnits = units.filter(unit => unit.isOccupied);
      
      if (occupiedUnits.length === 0) {
        setError('No occupied units found in this building');
        return;
      }
      
      console.log('Occupied units for utility calculation:', occupiedUnits); // Debug log
      
      // Calculate utility for each OCCUPIED unit only
      const newCalculations = new Map<number, UtilityBillingDTO>();
      
      for (const unit of occupiedUnits) {
        try {
          const billing = await utilityApi.calculateUtilityBill(
            unit.id,
            periodStart,
            periodEnd
          );
          newCalculations.set(unit.id, billing);
        } catch (error) {
          console.error(`Error calculating for unit ${unit.unitNumber}:`, error);
          // Continue with other units
        }
      }
      
      if (newCalculations.size === 0) {
        setError('No utility calculations could be generated for occupied units');
        return;
      }
      
      setCalculations(newCalculations);
      setSuccess(`Calculated utilities for ${newCalculations.size} occupied units`);
      
    } catch (error: any) {
      setError('Error calculating utilities: ' + (error.message || 'Unknown error'));
      console.error('Error calculating utilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBuildingInvoices = async () => {
    if (calculations.size === 0) {
      setError('No calculations to generate invoices from');
      return;
    }
    
    try {
      setGenerating(true);
      setError('');
      
      const generatedInvoices = [];
      const errors = [];
      
      for (const [unitId, billing] of calculations.entries()) {
        try {
          const request: UtilityBillRequest = {
            unitId,
            periodStart: billing.periodStart as string,
            periodEnd: billing.periodEnd as string,
            dueDate,
            notes: `Monthly utility bill for ${periodStart} to ${periodEnd}`
          };
          
          const invoice = await utilityApi.generateUtilityBill(request);
          generatedInvoices.push(invoice);
          
        } catch (error: any) {
          errors.push(`Unit ${billing.unitNumber}: ${error.message || 'Failed to generate invoice'}`);
          console.error(`Error generating invoice for unit ${unitId}:`, error);
        }
      }
      
      if (generatedInvoices.length > 0) {
        setSuccess(`Successfully generated ${generatedInvoices.length} invoices for occupied units!`);
        // Reset after successful generation
        setCalculations(new Map());
        setCamSummary(null);
        setShowCAMPreview(false);
      }
      
      if (errors.length > 0) {
        setError(`Partial success: ${errors.length} errors occurred. ${errors.join(', ')}`);
      }
      
    } catch (error: any) {
      setError('Error generating invoices: ' + (error.message || 'Unknown error'));
      console.error('Error generating invoices:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US')} MMK`;
  };

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Building Utility Invoices</h1>
          </div>
          <p className="text-gray-600">
            Generate utility invoices for all occupied units in a building
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        {/* Debug Info (can be removed in production) */}
        {units.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <div className="font-medium text-yellow-800">Debug Info:</div>
            <div>Total units loaded: {units.length}</div>
            <div>Occupied units: {units.filter(u => u.isOccupied).length}</div>
            <div>Vacant units: {units.filter(u => !u.isOccupied).length}</div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Building *
              </label>
              <select
                value={selectedBuildingId || ''}
                onChange={(e) => {
                  setSelectedBuildingId(Number(e.target.value));
                  setCalculations(new Map());
                  setCamSummary(null);
                  setShowCAMPreview(false);
                  setUnits([]);
                  setError('');
                  setSuccess('');
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={loading}
              >
                <option value="">Select building...</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingName} ({building.branchName})
                  </option>
                ))}
              </select>
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
          <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Other Monthly CAM Costs (MMK)
              <span className="text-blue-500 text-xs ml-2">(Common area maintenance, security, cleaning, etc.)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={otherCAMCosts}
                  onChange={(e) => setOtherCAMCosts(parseFloat(e.target.value) || 0)}
                  className="w-full border border-blue-300 rounded px-3 py-2 bg-white"
                  min="0"
                  step="10000"
                />
              </div>
              <div className="text-sm font-medium text-blue-800">
                Total: {formatCurrency(otherCAMCosts)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={calculateCAMDistsribution}
              disabled={!selectedBuildingId || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading Units...
                </>
              ) : (
                <>
                  <PieChart className="w-5 h-5" />
                  Calculate CAM Distribution
                </>
              )}
            </button>
            
            <button
              onClick={calculateBuildingUtilities}
              disabled={!selectedBuildingId || !periodStart || !periodEnd || loading || !camSummary}
              className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Calculate Occupied Units Utilities
            </button>
          </div>
        </div>

        {/* Building Information */}
        {selectedBuilding && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedBuilding.buildingName} - Building Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Total Leasable Area</div>
                <div className="text-xl font-bold">
                  {(selectedBuilding.totalLeasableArea || 0).toLocaleString()} sq.ft
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <div className="text-sm text-orange-600">Transformer Fee (Monthly)</div>
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(selectedBuilding.transformerFee || 0)}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-green-500" />
                  <div className="text-sm text-green-600">Generator Fee (Monthly)</div>
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(selectedBuilding.generatorFee || 0)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-purple-600">Total Monthly CAM Costs</div>
                <div className="text-xl font-bold">
                  {formatCurrency((selectedBuilding.generatorFee || 0) + 
                     (selectedBuilding.transformerFee || 0) + 
                     otherCAMCosts)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAM Distribution Preview */}
        {showCAMPreview && camSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  CAM Distribution for {selectedBuilding?.buildingName}
                </h2>
                <p className="text-gray-600">
                  Monthly CAM allocation based on occupancy
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCAMPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Hide Preview
                </button>
              </div>
            </div>

            {/* CAM Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Total Leasable Area</div>
                <div className="text-2xl font-bold">
                  {camSummary.totalLeasableArea.toLocaleString()} sq.ft
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-green-600">Occupied Area</div>
                <div className="text-2xl font-bold">
                  {camSummary.totalOccupiedArea.toLocaleString()} sq.ft
                  <div className="text-sm font-normal text-green-700">
                    ({camSummary.occupiedPercentage}%)
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {camSummary.occupiedUnitsCount} units
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded">
                <div className="text-sm text-yellow-600">Vacant Area</div>
                <div className="text-2xl font-bold">
                  {camSummary.totalVacantArea.toLocaleString()} sq.ft
                  <div className="text-sm font-normal text-yellow-700">
                    ({camSummary.vacantPercentage}%)
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {camSummary.vacantUnitsCount} units
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-purple-600">Total CAM Costs</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(camSummary.totalCAMCosts)}
                </div>
              </div>
            </div>

            {/* CAM Allocation Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">CAM Allocation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                    <h4 className="text-lg font-bold text-green-700">Tenants Pay</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occupied Area:</span>
                      <span className="font-medium">{camSummary.totalOccupiedArea.toLocaleString()} sq.ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Percentage:</span>
                      <span className="font-medium">{camSummary.occupiedPercentage}%</span>
                    </div>
                    <div className="border-t border-green-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-green-700">
                        <span>Total CAM:</span>
                        <span className="text-xl">{formatCurrency(camSummary.tenantsCAM)}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ({camSummary.totalOccupiedArea} ÷ {camSummary.totalLeasableArea}) × {formatCurrency(camSummary.totalCAMCosts)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Home className="w-6 h-6 text-blue-600" />
                    <h4 className="text-lg font-bold text-blue-700">Mall Owner Pays</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vacant Area:</span>
                      <span className="font-medium">{camSummary.totalVacantArea.toLocaleString()} sq.ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Percentage:</span>
                      <span className="font-medium">{camSummary.vacantPercentage}%</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-blue-700">
                        <span>Total CAM:</span>
                        <span className="text-xl">{formatCurrency(camSummary.ownerCAM)}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ({camSummary.totalVacantArea} ÷ {camSummary.totalLeasableArea}) × {formatCurrency(camSummary.totalCAMCosts)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unit-by-Unit Breakdown */}
            {camSummary.unitBreakdown.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Unit-by-Unit CAM Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Unit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Space (sq.ft)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Share %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          CAM Allocation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {camSummary.unitBreakdown.map((unit) => (
                        <tr key={unit.unitId} className={unit.isOccupied ? 'bg-green-50/30' : 'bg-blue-50/30'}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{unit.unitNumber}</div>
                            <div className="text-sm text-gray-500">{unit.tenantName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              unit.isOccupied 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {unit.isOccupied ? 'Occupied' : 'Vacant'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{unit.unitSpace.toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-blue-600">
                              {unit.percentage.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`font-bold ${
                              unit.isOccupied ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {formatCurrency(unit.camShare)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Generator: {formatCurrency(unit.details.generatorShare)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Transformer: {formatCurrency(unit.details.transformerShare)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Other: {formatCurrency(unit.details.otherCAMShare)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Utility Calculations Results */}
        {calculations.size > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Utility Calculations for Occupied Units in {selectedBuilding?.buildingName}
                </h2>
                <p className="text-gray-600">
                  Period: {periodStart} to {periodEnd} | Due: {dueDate}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCalculations(new Map());
                    setError('');
                    setSuccess('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={generating}
                >
                  Clear
                </button>
                <button
                  onClick={generateBuildingInvoices}
                  disabled={generating}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {generating ? 'Generating...' : `Generate ${calculations.size} Invoices`}
                </button>
              </div>
            </div>

            {/* Utility Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Occupied Units</div>
                <div className="text-2xl font-bold">{calculations.size}</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-green-600">Total Amount</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Array.from(calculations.values())
                    .reduce((sum, billing) => sum + (billing.grandTotal || 0), 0))}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <div className="text-sm text-yellow-600">Total CAM from Tenants</div>
                <div className="text-2xl font-bold">
                  {camSummary ? formatCurrency(camSummary.tenantsCAM) : '0 MMK'}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-purple-600">Average per Unit</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Array.from(calculations.values())
                    .reduce((sum, billing) => sum + (billing.grandTotal || 0), 0) / calculations.size)}
                </div>
              </div>
            </div>

            {/* Unit Utility Details */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit & Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CAM Fee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Other Utilities
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from(calculations.entries()).map(([unitId, billing]) => {
                    const camFee = billing.utilityFees?.find(f => 
                      f.utilityName?.toLowerCase().includes('cam')
                    )?.amount || 0;
                    
                    const otherFees = billing.utilityFees?.filter(f => 
                      !f.utilityName?.toLowerCase().includes('cam')
                    ) || [];
                    
                    const otherTotal = otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
                    
                    return (
                      <tr key={unitId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{billing.unitNumber || `Unit ${unitId}`}</div>
                          {billing.tenantName && (
                            <div className="text-sm text-gray-500">{billing.tenantName}</div>
                          )}
                          {billing.unitSpace && (
                            <div className="text-xs text-gray-400">
                              {billing.unitSpace.toLocaleString()} sq.ft
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-green-600 font-bold">
                            {formatCurrency(camFee)}
                          </div>
                          {camSummary && camSummary.tenantsCAM > 0 && (
                            <div className="text-xs text-gray-500">
                              {((camFee / camSummary.tenantsCAM) * 100).toFixed(1)}% of tenant CAM
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800">
                            {formatCurrency(otherTotal)}
                          </div>
                          {otherFees.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {otherFees.length} utility type(s)
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {formatCurrency(billing.grandTotal || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CAM Calculation Explanation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">CAM Calculation Formula</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-gray-50 p-4 rounded border mb-4">
                <div className="text-lg font-bold text-gray-800 mb-2">Basic Formula:</div>
                <code className="text-sm font-mono block mb-2">
                  CAM Fee = (Unit Space ÷ Total Leasable Area) × Total CAM Costs
                </code>
                <div className="text-sm text-gray-600">
                  Where Total CAM Costs = Generator Fee + Transformer Fee + Other CAM Costs
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded border border-green-200">
                  <h4 className="font-bold text-green-700 mb-2">Tenants Pay For:</h4>
                  <div className="text-sm text-gray-700">
                    <div className="mb-2">Occupied area only:</div>
                    <code className="text-green-700 font-mono bg-green-100 px-2 py-1 rounded">
                      Tenants CAM = (Total Occupied Area ÷ Total Leasable Area) × Total CAM Costs
                    </code>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                  <h4 className="font-bold text-blue-700 mb-2">Mall Owner Pays For:</h4>
                  <div className="text-sm text-gray-700">
                    <div className="mb-2">Vacant area only:</div>
                    <code className="text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded">
                      Owner CAM = (Total Vacant Area ÷ Total Leasable Area) × Total CAM Costs
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-4">Example Calculation</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Leasable Area:</span>
                  <span className="font-bold">5,000 sq.ft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600">Occupied Area (Tenants):</span>
                  <span className="font-bold text-green-600">4,000 sq.ft (80%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Vacant Area (Owner):</span>
                  <span className="font-bold text-blue-600">1,000 sq.ft (20%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total CAM Costs:</span>
                  <span className="font-bold">1,000,000 MMK</span>
                </div>
                
                <div className="border-t border-blue-300 pt-3 mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700 font-bold">Tenants CAM:</span>
                    <span className="text-green-700 font-bold text-lg">
                      (4,000 ÷ 5,000) × 1,000,000 = 800,000 MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-bold">Owner CAM:</span>
                    <span className="text-blue-700 font-bold text-lg">
                      (1,000 ÷ 5,000) × 1,000,000 = 200,000 MMK
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="text-sm text-gray-600">
                    <strong>Note:</strong> This ensures fairness - tenants only pay for the space they occupy, 
                    while the mall owner covers the costs for vacant areas.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingUtilityInvoicePage;