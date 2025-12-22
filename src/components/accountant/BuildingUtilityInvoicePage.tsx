// BuildingUtilityInvoicePage.tsx - Updated to use backend API
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calculator, 
  PieChart,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  History,
  Save,
  Trash2,
  Download,
  Building2,
  Eye,
  Edit,
} from 'lucide-react';
import { buildingApi } from '../../api/BuildingAPI';
import { contractApi } from '../../api/ContractAPI';
import type { Building } from '../../types';
import { expenseApi, type CreateExpenseRequest, type MallOwnerExpense } from '../../api/ExpenseAPI';
import { jwtDecode } from 'jwt-decode';

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
  unallocatedArea: number;
  unallocatedPercentage: number;
}

// Local storage key for expenses (fallback)
const EXPENSES_STORAGE_KEY = 'mall_owner_expenses_fallback';

const BuildingUtilityInvoicePage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [camSummary, setCamSummary] = useState<CAMSummary | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCAMPreview, setShowCAMPreview] = useState(false);
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [mallOwnerExpenses, setMallOwnerExpenses] = useState<MallOwnerExpense[]>([]);
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState<string>('Mall Owner CAM Expense for Vacant Units');
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [assignedBuildingId, setAssignedBuildingId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccountant, setIsAccountant] = useState(false);
  const [isManager, setIsManager] = useState(false);

  // CAM Configuration
  const [otherCAMCosts, setOtherCAMCosts] = useState<number>(150000);

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

  // Load assigned building for non-admin users
  const loadAssignedBuilding = async () => {
    const userRole = getUserRole();
    setIsAdmin(userRole === 'ROLE_ADMIN');
    setIsAccountant(userRole === 'ROLE_ACCOUNTANT');
    setIsManager(userRole === 'ROLE_MANAGER');
    
    if (!isAdmin) {
      try {
        const assignedBuildingResponse = await buildingApi.getMyAssignedBuilding();
        if (assignedBuildingResponse.data) {
          setAssignedBuildingId(assignedBuildingResponse.data.id);
          setSelectedBuildingId(assignedBuildingResponse.data.id);
          
          // Add assigned building to buildings list for display
          setBuildings([assignedBuildingResponse.data]);
          
          // Auto-calculate for assigned building
          setTimeout(() => {
            if (periodStart && periodEnd) {
              calculateCAMDistsribution();
            }
          }, 500);
        }
      } catch (error) {
        console.log('No assigned building for user');
      }
    }
  };

  // Load expenses from localStorage on component mount (fallback)
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

  // Save expenses to localStorage (fallback)
  const saveExpensesToStorage = (expenses: MallOwnerExpense[]) => {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to storage:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Set default dates for current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userRole = getUserRole();
      setIsAdmin(userRole === 'ROLE_ADMIN');
      setIsAccountant(userRole === 'ROLE_ACCOUNTANT');
      setIsManager(userRole === 'ROLE_MANAGER');
      
      // For non-admin users, get assigned building only
      if (!isAdmin) {
        await loadAssignedBuilding();
      } else {
        // For admin users, load all buildings
        const response = await buildingApi.getAll();
        setBuildings(response.data || []);
      }
      
      // Load expenses from backend
      await loadExpensesFromBackend();
      
    } catch (error: any) {
      setError('Failed to load data: ' + (error.message || 'Unknown error'));
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingUnits = async (buildingId: number) => {
    // Check if user has permission for this building
    if (assignedBuildingId && buildingId !== assignedBuildingId && !isAdmin) {
      alert('You can only access CAM calculations for your assigned building');
      return [];
    }
    
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

  // Load expenses from backend
  const loadExpensesFromBackend = async () => {
    try {
      const response = await expenseApi.getAllExpenses();
      if (response.data) {
        setMallOwnerExpenses(response.data);
        // Also save to localStorage as backup
        saveExpensesToStorage(response.data);
      } else {
        setMallOwnerExpenses([]);
        // Fallback to localStorage
        loadExpensesFromStorage();
      }
    } catch (error) {
      console.error('Error loading expenses from backend:', error);
      setError('Failed to load expenses from server. Using local storage as fallback.');
      // Fallback to localStorage
      loadExpensesFromStorage();
    }
  };

  // Check for existing expenses for the same period and building
  const checkDuplicateExpense = async (buildingId: number, periodStart: string, periodEnd: string): Promise<boolean> => {
    try {
      const response = await expenseApi.checkDuplicate(buildingId, periodStart, periodEnd);
      return response.data;
    } catch (error) {
      console.error('Error checking duplicate expense via API:', error);
      // Fallback to local check
      return mallOwnerExpenses.some(expense => 
        expense.buildingId === buildingId && 
        expense.periodStart === periodStart && 
        expense.periodEnd === periodEnd
      );
    }
  };

  const calculateCAMDistsribution = async () => {
    if (!selectedBuildingId) {
      setError('Please select a building');
      return;
    }
    
    // Check if user has permission for this building
    if (assignedBuildingId && selectedBuildingId !== assignedBuildingId && !isAdmin) {
      alert('You can only calculate CAM for your assigned building');
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
      
      // Check if expense already exists for this period
      const isDuplicate = await checkDuplicateExpense(selectedBuildingId, periodStart, periodEnd);
      if (isDuplicate) {
        setError(`An expense record already exists for ${selectedBuilding.buildingName} for period ${periodStart} to ${periodEnd}. Please select a different period.`);
        return;
      }
      
      // Load units with actual occupancy data
      const unitsWithOccupancy = await loadBuildingUnits(selectedBuildingId);
      
      if (unitsWithOccupancy.length === 0) {
        setError('No units found in this building');
        return;
      }
      
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
      
      // Calculate cost per square foot
      const costPerSqFt = totalCAMCosts / totalLeasableArea;
      
      // Tenants pay only for occupied area
      const tenantsCAM = totalOccupiedArea * costPerSqFt;
      
      // Mall owner pays for everything else (vacant units + unallocated area)
      const ownerCAM = totalCAMCosts - tenantsCAM;
      
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

  // Save Mall Owner Expense to backend
  const saveMallOwnerExpense = async () => {
    if (!selectedBuildingId || !camSummary) {
      setError('Please calculate CAM distribution first');
      return;
    }
    
    if (!periodStart || !periodEnd) {
      setError('Please select period dates');
      return;
    }
    
    try {
      // Calculate total mall owner area
      const totalMallOwnerArea = camSummary.totalVacantArea + camSummary.unallocatedArea;
      
      // Get selected building
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      if (!selectedBuilding) {
        setError('Selected building not found');
        return;
      }
      
      // Calculate shares based on mall owner area
      const generatorShare = totalMallOwnerArea * ((selectedBuilding.generatorFee || 0) / camSummary.totalLeasableArea);
      const transformerShare = totalMallOwnerArea * ((selectedBuilding.transformerFee || 0) / camSummary.totalLeasableArea);
      const otherCAMShare = totalMallOwnerArea * (otherCAMCosts / camSummary.totalLeasableArea);
      
      const request: CreateExpenseRequest = {
        buildingId: selectedBuildingId,
        periodStart,
        periodEnd,
        totalAmount: camSummary.ownerCAM,
        generatorShare,
        transformerShare,
        otherCAMShare,
        description: expenseDescription || `Mall Owner CAM Expense for ${periodStart} to ${periodEnd}`,
        otherCAMCosts,
        totalVacantArea: camSummary.totalVacantArea,
        totalUnallocatedArea: camSummary.unallocatedArea,
        totalLeasableArea: camSummary.totalLeasableArea,
        totalCAMCosts: camSummary.totalCAMCosts,
        occupiedArea: camSummary.totalOccupiedArea,
        occupiedUnitsCount: camSummary.occupiedUnitsCount,
        vacantUnitsCount: camSummary.vacantUnitsCount,
      };
      
      const response = await expenseApi.createExpense(request);
      
      setSuccess(`Mall owner expense of ${formatCurrency(camSummary.ownerCAM)} saved successfully!`);
      setExpenseDescription('Mall Owner CAM Expense for Vacant Units');
      
      // Refresh expenses list
      await loadExpensesFromBackend();
      
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

  // Update expense status in backend
  const updateExpenseStatus = async (expenseId: number, newStatus: string) => {
    try {
      await expenseApi.updateExpenseStatus(expenseId, newStatus);
      await loadExpensesFromBackend();
      setSuccess(`Expense status updated to ${newStatus}`);
    } catch (error: any) {
      setError('Failed to update expense status: ' + (error.message || 'Unknown error'));
    }
  };

  // Delete expense from backend
  const deleteExpense = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) {
      return;
    }
    
    try {
      await expenseApi.deleteExpense(expenseId);
      await loadExpensesFromBackend();
      setSuccess('Expense record deleted successfully');
    } catch (error: any) {
      setError('Failed to delete expense: ' + (error.message || 'Unknown error'));
    }
  };

  // Export expenses
  const exportExpenses = async () => {
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
      try {
        // Try backend CSV export first
        const response = await expenseApi.exportToCSV();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mall_owner_expenses_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        // Fallback to local CSV generation
        const headers = ['Building', 'Period Start', 'Period End', 'Amount (MMK)', 'Status', 'Date Recorded', 'Description'];
        const csvRows = mallOwnerExpenses.map(expense => [
          expense.buildingName,
          expense.periodStart,
          expense.periodEnd,
          expense.totalAmount.toLocaleString(),
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
    }
    
    setSuccess(`Expenses exported as ${exportFormat} successfully!`);
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

  // Filter expenses based on user role
  const filteredExpenses = isAdmin 
    ? mallOwnerExpenses 
    : mallOwnerExpenses.filter(expense => expense.buildingId === assignedBuildingId);

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
          {!isAdmin && assignedBuildingId && (
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              You are assigned to: {buildings.find(b => b.id === assignedBuildingId)?.buildingName || 'My Assigned Building'}
            </p>
          )}
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

        {/* Statistics - Show only if user has expenses */}
        {filteredExpenses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold">{filteredExpenses.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredExpenses.filter(exp => exp.status === 'PENDING').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Paid</div>
              <div className="text-2xl font-bold text-green-600">
                {filteredExpenses.filter(exp => exp.status === 'PAID' || exp.status === 'APPROVED').length}
              </div>
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
                  const newBuildingId = Number(e.target.value);
                  // Check if user has permission for this building
                  if (assignedBuildingId && newBuildingId !== assignedBuildingId && !isAdmin) {
                    alert('You can only access CAM calculations for your assigned building');
                    return;
                  }
                  setSelectedBuildingId(newBuildingId);
                  setCamSummary(null);
                  setShowCAMPreview(false);
                  setUnits([]);
                  setError('');
                  setSuccess('');
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={loading || (!isAdmin && assignedBuildingId !== null)}
              >
                <option value="">Select building...</option>
                {isAdmin ? (
                  buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.buildingName} ({building.branchName})
                    </option>
                  ))
                ) : assignedBuildingId ? (
                  <option value={assignedBuildingId}>
                    {buildings.find(b => b.id === assignedBuildingId)?.buildingName || 'My Assigned Building'}
                  </option>
                ) : (
                  <option value="">No building assigned</option>
                )}
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
            
            
          </div>
        </div>

        {/* CAM Distribution Preview */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Building Area</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Leasable Area:</span>
                    <span className="font-bold">{camSummary.totalLeasableArea.toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Occupied Area:</span>
                    <span className="font-bold">{camSummary.totalOccupiedArea.toLocaleString()} sq.ft ({camSummary.occupiedPercentage}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Vacant Area:</span>
                    <span className="font-bold">{camSummary.totalVacantArea.toLocaleString()} sq.ft ({camSummary.vacantPercentage}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Unallocated Area:</span>
                    <span className="font-bold">{camSummary.unallocatedArea.toLocaleString()} sq.ft ({camSummary.unallocatedPercentage}%)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">CAM Cost Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Generator Fee:</span>
                    <span className="font-bold">{formatCurrency(selectedBuilding?.generatorFee || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transformer Fee:</span>
                    <span className="font-bold">{formatCurrency(selectedBuilding?.transformerFee || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other CAM Costs:</span>
                    <span className="font-bold">{formatCurrency(otherCAMCosts)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="font-bold text-green-700">Total CAM Costs:</span>
                    <span className="font-bold text-green-700">{formatCurrency(camSummary.totalCAMCosts)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-2">Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-green-600">Tenants Pay:</span>
                      <span className="font-bold text-green-700">{formatCurrency(camSummary.tenantsCAM)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(camSummary.tenantsCAM / camSummary.totalCAMCosts) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      For {camSummary.occupiedUnitsCount} occupied units ({camSummary.occupiedPercentage}% of area)
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-red-600">Mall Owner Pays:</span>
                      <span className="font-bold text-red-700">{formatCurrency(camSummary.ownerCAM)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(camSummary.ownerCAM / camSummary.totalCAMCosts) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      For {camSummary.vacantUnitsCount} vacant units + unallocated area ({100 - camSummary.occupiedPercentage}% of area)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Expense Section */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-700 mb-3">Save Expense Record</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">
                    Expense Description
                  </label>
                  <textarea
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full border border-yellow-300 rounded px-3 py-2"
                    rows={2}
                    placeholder="Enter description for this expense..."
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-yellow-700">Mall Owner's Share:</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(camSummary.ownerCAM)}</div>
                  </div>
                  <button
                    onClick={saveMallOwnerExpense}
                    className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Expense Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expense History Panel */}
        {showExpenseHistory && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                {isAdmin ? 'All Mall Owner Expenses' : 'Your Expense History'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredExpenses.length} records)
                </span>
              </h3>
              <div className="flex gap-2">
                
                
              </div>
            </div>

            {filteredExpenses.length > 0 ? (
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
                    {filteredExpenses.map((expense) => (
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
                            {formatCurrency(expense.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Generator: {formatCurrency(expense.generatorShare || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Transformer: {formatCurrency(expense.transformerShare || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Other CAM: {formatCurrency(expense.otherCAMShare || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              expense.status === 'PAID' || expense.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : expense.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {expense.status}
                            </span>
                            {(isAdmin || isAccountant) && (
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
                            )}
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
                              onClick={() => {
                                // View details
                                alert(`Expense Details:\nBuilding: ${expense.buildingName}\nPeriod: ${expense.periodStart} to ${expense.periodEnd}\nAmount: ${formatCurrency(expense.totalAmount)}\nStatus: ${expense.status}\nDescription: ${expense.description}`);
                              }}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(isAdmin || isAccountant) && (
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={5} className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-600 inline-flex items-center gap-4">
                          <span>Total Records: {filteredExpenses.length}</span>
                          <span className="text-green-600">
                            Paid: {formatCurrency(filteredExpenses
                              .filter(e => e.status === 'PAID' || e.status === 'APPROVED')
                              .reduce((sum, e) => sum + e.totalAmount, 0))}
                          </span>
                          <span className="text-yellow-600">
                            Pending: {formatCurrency(filteredExpenses
                              .filter(e => e.status === 'PENDING')
                              .reduce((sum, e) => sum + e.totalAmount, 0))}
                          </span>
                          <span className="text-blue-600">
                            Total: {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0))}
                          </span>
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
              <strong>Note:</strong> All expense records are now stored in the database. 
              {!isAdmin && " You can only view expenses for your assigned building."}
              {isAdmin && " As an administrator, you can view all expenses."}
              The system prevents duplicate entries for the same building and period.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingUtilityInvoicePage;