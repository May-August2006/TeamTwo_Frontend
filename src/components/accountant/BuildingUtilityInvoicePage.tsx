// BuildingUtilityInvoicePage.tsx - Fixed calculation version
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
  RefreshCw,
  Clock,
  DollarSign,
  History,
  Save,
  Calendar,
  Eye,
  Trash2,
  Download,
  Printer
} from 'lucide-react';
import { buildingApi } from '../../api/BuildingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { contractApi } from '../../api/ContractAPI';
import type { Building } from '../../types';
import type { UtilityBillingDTO, UtilityBillRequest } from '../../types/utility';

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
  unallocatedArea: number; // NEW: Area not assigned to any unit
  unallocatedPercentage: number; // NEW: Percentage of unallocated area
}

interface MallOwnerExpense {
  id: string;
  buildingId: number;
  buildingName: string;
  periodStart: string;
  periodEnd: string;
  ownerCAM: number;
  generatorShare: number;
  transformerShare: number;
  otherCAMShare: number;
  description: string;
  dateRecorded: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

// Local storage key for expenses
const EXPENSES_STORAGE_KEY = 'mall_owner_expenses';

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
  const [mallOwnerExpenses, setMallOwnerExpenses] = useState<MallOwnerExpense[]>([]);
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState<string>('Mall Owner CAM Expense for Vacant Units');
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('JSON');

  // CAM Configuration
  const [otherCAMCosts, setOtherCAMCosts] = useState<number>(150000); // Default other CAM costs in MMK

  // Load expenses from localStorage on component mount
  useEffect(() => {
    loadBuildings();
    loadExpensesFromStorage();
    
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

  // Load expenses from localStorage
  const loadExpensesFromStorage = () => {
    try {
      const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (storedExpenses) {
        const expenses = JSON.parse(storedExpenses);
        setMallOwnerExpenses(expenses);
      }
    } catch (error) {
      console.error('Error loading expenses from storage:', error);
    }
  };

  // Save expenses to localStorage
  const saveExpensesToStorage = (expenses: MallOwnerExpense[]) => {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to storage:', error);
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

  // Check for existing expenses for the same period and building
  const checkDuplicateExpense = (buildingId: number, periodStart: string, periodEnd: string): boolean => {
    return mallOwnerExpenses.some(expense => 
      expense.buildingId === buildingId && 
      expense.periodStart === periodStart && 
      expense.periodEnd === periodEnd
    );
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
      
      // Validate period
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      
      if (startDate >= endDate) {
        setError('Period start date must be before period end date');
        return;
      }
      
      // Check if period is in the future
      const today = new Date();
      if (startDate > today) {
        setError('Period start date cannot be in the future');
        return;
      }
      
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
      
      // Check if expense already exists for this period
      if (checkDuplicateExpense(selectedBuildingId, periodStart, periodEnd)) {
        setError(`An expense record already exists for ${selectedBuilding.buildingName} for period ${periodStart} to ${periodEnd}. Please select a different period.`);
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
      
      // Calculate total occupied and vacant areas from defined units
      let totalOccupiedArea = 0;
      let totalVacantArea = 0;
      let occupiedUnitsCount = 0;
      let vacantUnitsCount = 0;
      
      // First pass: Calculate occupied/vacant areas from defined units
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
      
      // Calculate unallocated area (area not assigned to any unit)
      const totalDefinedArea = totalOccupiedArea + totalVacantArea;
      const unallocatedArea = Math.max(0, totalLeasableArea - totalDefinedArea);
      const unallocatedPercentage = (unallocatedArea / totalLeasableArea) * 100;
      
      // The mall owner pays for ALL areas that are NOT occupied by tenants
      // This includes: vacant units + unallocated area
      const totalMallOwnerArea = totalVacantArea + unallocatedArea;
      
      // CORRECT CALCULATION:
      // 1. Calculate cost per square foot
      const costPerSqFt = totalCAMCosts / totalLeasableArea;
      
      // 2. Tenants pay only for occupied area
      const tenantsCAM = totalOccupiedArea * costPerSqFt;
      
      // 3. Mall owner pays for everything else (vacant units + unallocated area)
      const ownerCAM = totalCAMCosts - tenantsCAM;
      
      // Alternative calculation: ownerCAM = totalMallOwnerArea * costPerSqFt
      
      // Verify calculations
      console.log('Occupancy Summary:', {
        totalLeasableArea,
        totalOccupiedArea,
        totalVacantArea,
        unallocatedArea,
        totalDefinedArea,
        totalMallOwnerArea,
        costPerSqFt,
        tenantsCAM,
        ownerCAM,
        totalCAMCosts
      });
      
      // Verify that calculations add up
      const calculatedTotal = tenantsCAM + ownerCAM;
      const discrepancy = Math.abs(calculatedTotal - totalCAMCosts);
      
      if (discrepancy > 0.01) {
        console.warn(`Calculation discrepancy: ${discrepancy}`);
      }
      
      const occupiedPercentage = (totalOccupiedArea / totalLeasableArea) * 100;
      const vacantPercentage = (totalVacantArea / totalLeasableArea) * 100;
      
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
        vacantUnitsCount,
        unallocatedArea: parseFloat(unallocatedArea.toFixed(2)),
        unallocatedPercentage: parseFloat(unallocatedPercentage.toFixed(2))
      };
      
      setCamSummary(summary);
      setShowCAMPreview(true);
      setSuccess(`Calculated CAM distribution: ${occupiedUnitsCount} occupied units, ${vacantUnitsCount} vacant units, ${unallocatedArea.toFixed(0)} sq.ft unallocated`);
      
    } catch (error: any) {
      setError('Error calculating CAM distribution: ' + (error.message || 'Unknown error'));
      console.error('Error calculating CAM:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save Mall Owner Expense to localStorage
  const saveMallOwnerExpense = () => {
    if (!selectedBuildingId || !camSummary) {
      setError('Please calculate CAM distribution first');
      return;
    }
    
    if (!periodStart || !periodEnd) {
      setError('Please select period dates');
      return;
    }
    
    try {
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      
      // Calculate mall owner's share for each component
      const costPerSqFt = camSummary.totalCAMCosts / camSummary.totalLeasableArea;
      const totalMallOwnerArea = camSummary.totalVacantArea + camSummary.unallocatedArea;
      
      const newExpense: MallOwnerExpense = {
        id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        buildingId: selectedBuildingId,
        buildingName: selectedBuilding?.buildingName || 'Unknown Building',
        periodStart,
        periodEnd,
        ownerCAM: camSummary.ownerCAM,
        generatorShare: totalMallOwnerArea * ((selectedBuilding?.generatorFee || 0) / camSummary.totalLeasableArea),
        transformerShare: totalMallOwnerArea * ((selectedBuilding?.transformerFee || 0) / camSummary.totalLeasableArea),
        otherCAMShare: totalMallOwnerArea * (otherCAMCosts / camSummary.totalLeasableArea),
        description: expenseDescription || `Mall Owner CAM Expense for ${periodStart} to ${periodEnd}`,
        dateRecorded: new Date().toISOString().split('T')[0],
        status: 'PENDING'
      };
      
      // Add to local state and storage
      const updatedExpenses = [newExpense, ...mallOwnerExpenses];
      setMallOwnerExpenses(updatedExpenses);
      saveExpensesToStorage(updatedExpenses);
      
      setSuccess(`Mall owner expense of ${formatCurrency(camSummary.ownerCAM)} saved successfully!`);
      setExpenseDescription('Mall Owner CAM Expense for Vacant Units'); // Reset description
      
      // Clear calculation after saving
      setTimeout(() => {
        setCamSummary(null);
        setShowCAMPreview(false);
      }, 2000);
      
    } catch (error: any) {
      setError('Failed to save mall owner expense: ' + (error.message || 'Unknown error'));
      console.error('Error saving expense:', error);
    }
  };

  // Update expense status
  const updateExpenseStatus = (expenseId: string, newStatus: 'PENDING' | 'PAID' | 'CANCELLED') => {
    const updatedExpenses = mallOwnerExpenses.map(expense => 
      expense.id === expenseId ? { ...expense, status: newStatus } : expense
    );
    
    setMallOwnerExpenses(updatedExpenses);
    saveExpensesToStorage(updatedExpenses);
    
    setSuccess(`Expense status updated to ${newStatus}`);
  };

  // Delete expense
  const deleteExpense = (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) {
      return;
    }
    
    const updatedExpenses = mallOwnerExpenses.filter(expense => expense.id !== expenseId);
    setMallOwnerExpenses(updatedExpenses);
    saveExpensesToStorage(updatedExpenses);
    
    setSuccess('Expense record deleted successfully');
  };

  // Export expenses
  const exportExpenses = () => {
    if (mallOwnerExpenses.length === 0) {
      setError('No expenses to export');
      return;
    }

    if (exportFormat === 'JSON') {
      const dataStr = JSON.stringify(mallOwnerExpenses, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `mall_owner_expenses_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // CSV export
      const headers = ['Building', 'Period Start', 'Period End', 'Amount (MMK)', 'Status', 'Date Recorded', 'Description'];
      const csvRows = mallOwnerExpenses.map(expense => [
        expense.buildingName,
        expense.periodStart,
        expense.periodEnd,
        expense.ownerCAM.toLocaleString(),
        expense.status,
        expense.dateRecorded,
        expense.description
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mall_owner_expenses_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    
    setSuccess(`Expenses exported as ${exportFormat} successfully!`);
  };

  // Clear all expenses (with confirmation)
  const clearAllExpenses = () => {
    if (!window.confirm('Are you sure you want to delete ALL expense records? This action cannot be undone.')) {
      return;
    }
    
    localStorage.removeItem(EXPENSES_STORAGE_KEY);
    setMallOwnerExpenses([]);
    setSuccess('All expense records cleared successfully');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US')} MMK`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  // Calculate statistics
  const calculateExpenseStats = () => {
    const totalExpenses = mallOwnerExpenses.length;
    const totalAmount = mallOwnerExpenses.reduce((sum, exp) => sum + exp.ownerCAM, 0);
    const pendingExpenses = mallOwnerExpenses.filter(exp => exp.status === 'PENDING');
    const paidExpenses = mallOwnerExpenses.filter(exp => exp.status === 'PAID');
    
    return {
      totalExpenses,
      totalAmount,
      pendingCount: pendingExpenses.length,
      paidCount: paidExpenses.length,
      pendingAmount: pendingExpenses.reduce((sum, exp) => sum + exp.ownerCAM, 0),
      paidAmount: paidExpenses.reduce((sum, exp) => sum + exp.ownerCAM, 0)
    };
  };

  const stats = calculateExpenseStats();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mall Owner Expense Calculator</h1>
          </div>
          <p className="text-gray-600">
            Calculate and track mall owner's utility expenses for vacant and unallocated areas
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

        {/* Statistics */}
        {mallOwnerExpenses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold">{stats.totalExpenses}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount} ({formatCurrency(stats.pendingAmount)})</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Paid</div>
              <div className="text-2xl font-bold text-green-600">{stats.paidCount} ({formatCurrency(stats.paidAmount)})</div>
            </div>
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

            <div className="flex items-end">
              <button
                onClick={() => setShowExpenseHistory(!showExpenseHistory)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                {showExpenseHistory ? 'Hide History' : 'View History'}
              </button>
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
                  Calculating...
                </>
              ) : (
                <>
                  <PieChart className="w-5 h-5" />
                  Calculate Mall Owner Expenses
                </>
              )}
            </button>
            
            {mallOwnerExpenses.length > 0 && (
              <button
                onClick={exportExpenses}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Expenses
              </button>
            )}
          </div>
        </div>

        {/* Expense History Panel */}
        {showExpenseHistory && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Mall Owner Expense History
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({mallOwnerExpenses.length} records)
                </span>
              </h3>
              <div className="flex gap-2">
                {mallOwnerExpenses.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mr-4">
                      <span className="text-sm text-gray-600">Export as:</span>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as 'JSON' | 'CSV')}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="JSON">JSON</option>
                        <option value="CSV">CSV</option>
                      </select>
                    </div>
                    <button
                      onClick={clearAllExpenses}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowExpenseHistory(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            {mallOwnerExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Building & Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date Recorded
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mallOwnerExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{expense.buildingName}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(expense.periodStart)} to {formatDate(expense.periodEnd)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{expense.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-red-600">
                            {formatCurrency(expense.ownerCAM)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Generator: {formatCurrency(expense.generatorShare)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Transformer: {formatCurrency(expense.transformerShare)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Other CAM: {formatCurrency(expense.otherCAMShare)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              expense.status === 'PAID' 
                                ? 'bg-green-100 text-green-800'
                                : expense.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {expense.status}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateExpenseStatus(expense.id, 'PENDING')}
                                className={`px-2 py-1 text-xs rounded ${expense.status === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                                title="Mark as Pending"
                              >
                                Pending
                              </button>
                              <button
                                onClick={() => updateExpenseStatus(expense.id, 'PAID')}
                                className={`px-2 py-1 text-xs rounded ${expense.status === 'PAID' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                                title="Mark as Paid"
                              >
                                Paid
                              </button>
                              <button
                                onClick={() => updateExpenseStatus(expense.id, 'CANCELLED')}
                                className={`px-2 py-1 text-xs rounded ${expense.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                title="Mark as Cancelled"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {formatDate(expense.dateRecorded)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // Re-calculate with this expense's data
                                setSelectedBuildingId(expense.buildingId);
                                setPeriodStart(expense.periodStart);
                                setPeriodEnd(expense.periodEnd);
                                setExpenseDescription(expense.description);
                                setShowExpenseHistory(false);
                                setShowCAMPreview(false);
                                setTimeout(() => {
                                  calculateCAMDistsribution();
                                }, 100);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Re-calculate"
                            >
                              <Calculator className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={5} className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-600 inline-flex items-center gap-4">
                          <span>Total Records: {mallOwnerExpenses.length}</span>
                          <span className="text-green-600">Paid: {formatCurrency(stats.paidAmount)}</span>
                          <span className="text-yellow-600">Pending: {formatCurrency(stats.pendingAmount)}</span>
                          <span className="text-red-600">Total: {formatCurrency(stats.totalAmount)}</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses recorded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Calculate and save mall owner expenses to see them here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CAM Distribution Preview - Mall Owner Focus */}
        {showCAMPreview && camSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Mall Owner Expense Calculation for {selectedBuilding?.buildingName}
                </h2>
                <p className="text-gray-600">
                  Period: {formatDate(periodStart)} to {formatDate(periodEnd)}
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

            {/* Building Area Breakdown */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Home className="w-10 h-10 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">Building Area Analysis</h3>
                    <p className="text-blue-600">
                      Breakdown of total leasable area and responsibility allocation
                    </p>
                  </div>
                </div>
                
                {/* Area Distribution Chart */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="text-sm text-blue-600 font-medium">Total Leasable Area</div>
                    <div className="text-2xl font-bold text-blue-700 mt-2">
                      {camSummary.totalLeasableArea.toLocaleString()} sq.ft
                    </div>
                    <div className="text-sm text-blue-600 mt-1">100%</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
                    <div className="text-sm text-green-600 font-medium">Occupied by Tenants</div>
                    <div className="text-2xl font-bold text-green-700 mt-2">
                      {camSummary.totalOccupiedArea.toLocaleString()} sq.ft
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      {camSummary.occupiedUnitsCount} units • {camSummary.occupiedPercentage}%
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm">
                    <div className="text-sm text-yellow-600 font-medium">Vacant Units</div>
                    <div className="text-2xl font-bold text-yellow-700 mt-2">
                      {camSummary.totalVacantArea.toLocaleString()} sq.ft
                    </div>
                    <div className="text-sm text-yellow-600 mt-1">
                      {camSummary.vacantUnitsCount} units • {camSummary.vacantPercentage}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm">
                    <div className="text-sm text-gray-600 font-medium">Unallocated Area</div>
                    <div className="text-2xl font-bold text-gray-700 mt-2">
                      {camSummary.unallocatedArea.toLocaleString()} sq.ft
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Not assigned • {camSummary.unallocatedPercentage}%
                    </div>
                  </div>
                </div>
                
                {/* Cost Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                    <div className="text-sm text-blue-600 font-medium">Total Monthly CAM Costs</div>
                    <div className="text-3xl font-bold text-blue-700 mt-2">
                      {formatCurrency(camSummary.totalCAMCosts)}
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Generator Fee:</span>
                        <span>{formatCurrency(selectedBuilding?.generatorFee || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transformer Fee:</span>
                        <span>{formatCurrency(selectedBuilding?.transformerFee || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Other CAM Costs:</span>
                        <span>{formatCurrency(otherCAMCosts)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">Cost per sq.ft:</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(camSummary.totalCAMCosts / camSummary.totalLeasableArea)} / sq.ft
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm">
                    <div className="text-sm text-green-600 font-medium">Tenants' Responsibility</div>
                    <div className="text-3xl font-bold text-green-700 mt-2">
                      {formatCurrency(camSummary.tenantsCAM)}
                    </div>
                    <div className="text-sm text-green-600 mt-2">
                      Only for occupied area
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Occupied Area:</span>
                        <span>{camSummary.totalOccupiedArea.toLocaleString()} sq.ft</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Percentage:</span>
                        <span>{camSummary.occupiedPercentage}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cost per sq.ft:</span>
                        <span>{formatCurrency(camSummary.totalCAMCosts / camSummary.totalLeasableArea)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200 text-sm">
                      <div className="font-medium text-green-700">Formula:</div>
                      <div className="text-green-600">
                        {camSummary.totalOccupiedArea.toLocaleString()} sq.ft × {formatCurrency(camSummary.totalCAMCosts / camSummary.totalLeasableArea)} = {formatCurrency(camSummary.tenantsCAM)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-lg shadow-lg">
                    <div className="text-blue-100 text-sm font-medium">MALL OWNER'S RESPONSIBILITY</div>
                    <div className="text-4xl font-bold text-white mt-2">
                      {formatCurrency(camSummary.ownerCAM)}
                    </div>
                    <div className="text-blue-200 text-sm mt-3">
                      For vacant + unallocated areas
                    </div>
                    <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-blue-100 text-sm">
                        <span>Vacant Area:</span>
                        <span>{camSummary.totalVacantArea.toLocaleString()} sq.ft</span>
                      </div>
                      <div className="flex justify-between text-blue-100 text-sm">
                        <span>Unallocated Area:</span>
                        <span>{camSummary.unallocatedArea.toLocaleString()} sq.ft</span>
                      </div>
                      <div className="flex justify-between text-blue-100 text-sm">
                        <span>Total Mall Owner Area:</span>
                        <span className="font-bold">{(camSummary.totalVacantArea + camSummary.unallocatedArea).toLocaleString()} sq.ft</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-400">
                      <div className="text-blue-100 text-sm">Formula:</div>
                      <div className="text-blue-200 text-xs">
                        Total CAM ({formatCurrency(camSummary.totalCAMCosts)}) - Tenants CAM ({formatCurrency(camSummary.tenantsCAM)}) = {formatCurrency(camSummary.ownerCAM)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expense Description */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Expense Description
                  </label>
                  <textarea
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-4 py-3"
                    rows={2}
                    placeholder="Enter description for this expense..."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    This description will help you identify this expense in the history.
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Verification */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
              <h4 className="font-bold text-gray-800 mb-4">Calculation Verification</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Tenants Pay:</div>
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(camSummary.tenantsCAM)} for {camSummary.totalOccupiedArea.toLocaleString()} sq.ft
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ({camSummary.totalOccupiedArea} ÷ {camSummary.totalLeasableArea}) × {formatCurrency(camSummary.totalCAMCosts)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Mall Owner Pays:</div>
                  <div className="text-lg font-bold text-blue-700">
                    {formatCurrency(camSummary.ownerCAM)} for {(camSummary.totalVacantArea + camSummary.unallocatedArea).toLocaleString()} sq.ft
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatCurrency(camSummary.totalCAMCosts)} - {formatCurrency(camSummary.tenantsCAM)} = {formatCurrency(camSummary.ownerCAM)}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total CAM Costs:</span>
                  <span>{formatCurrency(camSummary.totalCAMCosts)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Verification:</span>
                  <span>{formatCurrency(camSummary.tenantsCAM)} + {formatCurrency(camSummary.ownerCAM)} = {formatCurrency(camSummary.tenantsCAM + camSummary.ownerCAM)} ✓</span>
                </div>
              </div>
            </div>

            {/* Save Expense Button */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Save to Expense History</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Save this calculation to track mall owner expenses over time.
                    <br />
                    <span className="text-blue-600">Data is stored locally in your browser.</span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveMallOwnerExpense}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Save Expense
                  </button>
                  <button
                    onClick={() => {
                      setCamSummary(null);
                      setShowCAMPreview(false);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Guide */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            How It Works - Correct Calculation
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-bold text-blue-700 mb-2">Key Principle:</h4>
              <p className="text-sm text-gray-700">
                Mall owner pays for <strong>ALL areas that are NOT occupied by tenants</strong>. 
                This includes both vacant units AND any unallocated space in the building.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="font-medium text-gray-700">1. Calculate Total CAM</div>
                <p className="text-sm text-gray-600">Generator + Transformer + Other CAM costs.</p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-700">2. Determine Occupied Area</div>
                <p className="text-sm text-gray-600">Sum of all units with active tenants.</p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-700">3. Calculate Mall Owner Share</div>
                <p className="text-sm text-gray-600">Total CAM - Tenants' portion for occupied area.</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <h4 className="font-bold text-green-700 mb-2">Example (5000 sq.ft building):</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>• Total leasable area: <strong>5,000 sq.ft</strong></div>
                <div>• Occupied by tenants: <strong>1,000 sq.ft</strong> (20%)</div>
                <div>• Vacant units: <strong>3,000 sq.ft</strong> (60%)</div>
                <div>• Unallocated area: <strong>1,000 sq.ft</strong> (20%)</div>
                <div>• Total CAM costs: <strong>1,000,000 MMK</strong></div>
                <div className="mt-2 font-bold">→ Tenants pay: 1,000 sq.ft × (1,000,000 ÷ 5,000) = 200,000 MMK</div>
                <div className="font-bold">→ Mall owner pays: 1,000,000 - 200,000 = 800,000 MMK</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm text-blue-700">
              <strong>Note:</strong> Expenses are stored locally in your browser. Export them regularly to keep backups.
              The system prevents duplicate entries for the same building and period.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingUtilityInvoicePage;