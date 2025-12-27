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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  const [expenseDescription, setExpenseDescription] = useState<string>(
    t('buildingUtilityInvoicePage.form.descriptionPlaceholder')
  );
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
      setError(t('buildingUtilityInvoicePage.errors.failedLoad', { error: error.message || 'Unknown error' }));
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingUnits = async (buildingId: number) => {
    // Check if user has permission for this building
    if (assignedBuildingId && buildingId !== assignedBuildingId && !isAdmin) {
      alert(t('buildingUtilityInvoicePage.errors.noAccess'));
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
      setError(t('buildingUtilityInvoicePage.errors.failedLoad', { error: 'Failed to load unit information' }));
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
      setError(t('buildingUtilityInvoicePage.errors.serverFallback'));
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
      setError(t('buildingUtilityInvoicePage.errors.selectBuilding'));
      return;
    }
    
    // Check if user has permission for this building
    if (assignedBuildingId && selectedBuildingId !== assignedBuildingId && !isAdmin) {
      alert(t('buildingUtilityInvoicePage.errors.noAccessCalculate'));
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
        setError(t('buildingUtilityInvoicePage.errors.periodDates'));
        return;
      }
      
      // Check if period is in the future
      const today = new Date();
      if (startDate > today) {
        setError(t('buildingUtilityInvoicePage.errors.futureDate'));
        return;
      }
      
      // Get the selected building to access generator and transformer fees
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      if (!selectedBuilding) {
        setError(t('buildingUtilityInvoicePage.errors.buildingNotFound'));
        return;
      }
      
      // Check if expense already exists for this period
      const isDuplicate = await checkDuplicateExpense(selectedBuildingId, periodStart, periodEnd);
      if (isDuplicate) {
        setError(t('buildingUtilityInvoicePage.alerts.duplicateExpense', {
          buildingName: selectedBuilding.buildingName,
          periodStart: periodStart,
          periodEnd: periodEnd
        }));
        return;
      }
      
      // Load units with actual occupancy data
      const unitsWithOccupancy = await loadBuildingUnits(selectedBuildingId);
      
      if (unitsWithOccupancy.length === 0) {
        setError(t('buildingUtilityInvoicePage.errors.noUnits'));
        return;
      }
      
      // Extract building fees
      const generatorFee = selectedBuilding.generatorFee || 0;
      const transformerFee = selectedBuilding.transformerFee || 0;
      const totalLeasableArea = selectedBuilding.totalLeasableArea || 0;
      
      if (totalLeasableArea === 0) {
        setError(t('buildingUtilityInvoicePage.errors.leasableArea'));
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
      setSuccess(t('buildingUtilityInvoicePage.alerts.calculated', {
        occupiedUnitsCount,
        vacantUnitsCount,
        unallocatedArea: unallocatedArea.toFixed(0)
      }));
      
    } catch (error: any) {
      setError(t('buildingUtilityInvoicePage.errors.failedCalculate', { error: error.message || 'Unknown error' }));
      console.error('Error calculating CAM:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save Mall Owner Expense to backend
  const saveMallOwnerExpense = async () => {
    if (!selectedBuildingId || !camSummary) {
      setError(t('buildingUtilityInvoicePage.errors.calculateFirst'));
      return;
    }
    
    if (!periodStart || !periodEnd) {
      setError(t('buildingUtilityInvoicePage.errors.selectPeriod'));
      return;
    }
    
    try {
      // Calculate total mall owner area
      const totalMallOwnerArea = camSummary.totalVacantArea + camSummary.unallocatedArea;
      
      // Get selected building
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      if (!selectedBuilding) {
        setError(t('buildingUtilityInvoicePage.errors.buildingNotFound'));
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
        description: expenseDescription || t('buildingUtilityInvoicePage.saveExpense.title'),
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
      
      setSuccess(t('buildingUtilityInvoicePage.alerts.expenseSaved', { amount: formatCurrency(camSummary.ownerCAM) }));
      setExpenseDescription(t('buildingUtilityInvoicePage.form.descriptionPlaceholder'));
      
      // Refresh expenses list
      await loadExpensesFromBackend();
      
      // Clear calculation after saving
      setTimeout(() => {
        setCamSummary(null);
        setShowCAMPreview(false);
      }, 2000);
      
    } catch (error: any) {
      setError(t('buildingUtilityInvoicePage.errors.failedSave', { error: error.message || 'Unknown error' }));
      console.error('Error saving expense:', error);
    }
  };

  // Update expense status in backend
  const updateExpenseStatus = async (expenseId: number, newStatus: string) => {
    try {
      await expenseApi.updateExpenseStatus(expenseId, newStatus);
      await loadExpensesFromBackend();
      setSuccess(t('buildingUtilityInvoicePage.alerts.statusUpdated', { status: newStatus }));
    } catch (error: any) {
      setError(t('buildingUtilityInvoicePage.errors.failedUpdate', { error: error.message || 'Unknown error' }));
    }
  };

  // Delete expense from backend
  const deleteExpense = async (expenseId: number) => {
    if (!window.confirm(t('buildingUtilityInvoicePage.deleteConfirm'))) {
      return;
    }
    
    try {
      await expenseApi.deleteExpense(expenseId);
      await loadExpensesFromBackend();
      setSuccess(t('buildingUtilityInvoicePage.alerts.expenseDeleted'));
    } catch (error: any) {
      setError(t('buildingUtilityInvoicePage.errors.failedDelete', { error: error.message || 'Unknown error' }));
    }
  };

  // Export expenses
  const exportExpenses = async () => {
    if (mallOwnerExpenses.length === 0) {
      setError(t('buildingUtilityInvoicePage.alerts.noExpensesExport'));
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
    
    setSuccess(t('buildingUtilityInvoicePage.alerts.exportSuccess', { format: exportFormat }));
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
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('buildingUtilityInvoicePage.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('buildingUtilityInvoicePage.subtitle')}
              </p>
              {!isAdmin && assignedBuildingId && (
                <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {t('buildingUtilityInvoicePage.assignedBuildingInfo', {
                    buildingName: buildings.find(b => b.id === assignedBuildingId)?.buildingName || 'My Assigned Building'
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
                {t('buildingUtilityInvoicePage.buttons.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 border border-red-200">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{t('buildingUtilityInvoicePage.error')}</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-2 border border-green-200">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{t('buildingUtilityInvoicePage.success')}</p>
                <p className="text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Statistics - Show only if user has expenses */}
          {filteredExpenses.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-sm text-gray-500">{t('buildingUtilityInvoicePage.statistics.totalExpenses')}</div>
                <div className="text-2xl font-bold">{filteredExpenses.length}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-sm text-gray-500">{t('buildingUtilityInvoicePage.statistics.totalAmount')}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0))}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-sm text-gray-500">{t('buildingUtilityInvoicePage.statistics.pending')}</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredExpenses.filter(exp => exp.status === 'PENDING').length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-sm text-gray-500">{t('buildingUtilityInvoicePage.statistics.paid')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredExpenses.filter(exp => exp.status === 'PAID' || exp.status === 'APPROVED').length}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('buildingUtilityInvoicePage.form.selectBuilding')}
                </label>
                <select
                  value={selectedBuildingId || ''}
                  onChange={(e) => {
                    const newBuildingId = Number(e.target.value);
                    // Check if user has permission for this building
                    if (assignedBuildingId && newBuildingId !== assignedBuildingId && !isAdmin) {
                      alert(t('buildingUtilityInvoicePage.errors.noAccess'));
                      return;
                    }
                    setSelectedBuildingId(newBuildingId);
                    setCamSummary(null);
                    setShowCAMPreview(false);
                    setUnits([]);
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || (!isAdmin && assignedBuildingId !== null)}
                >
                  <option value="">{t('buildingUtilityInvoicePage.form.selectBuildingPlaceholder')}</option>
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
                    <option value="">{t('buildingUtilityInvoicePage.form.noBuildingAssigned')}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('buildingUtilityInvoicePage.form.periodStart')}
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
                  {t('buildingUtilityInvoicePage.form.periodEnd')}
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setShowExpenseHistory(!showExpenseHistory)}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition duration-200 font-medium"
                >
                  <History className="w-4 h-4" />
                  {showExpenseHistory 
                    ? t('buildingUtilityInvoicePage.buttons.hideHistory')
                    : t('buildingUtilityInvoicePage.buttons.viewHistory')
                  }
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={calculateCAMDistsribution}
                disabled={!selectedBuildingId || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition duration-200 font-medium"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t('buildingUtilityInvoicePage.buttons.calculating')}
                  </>
                ) : (
                  <>
                    <PieChart className="w-5 h-5" />
                    {t('buildingUtilityInvoicePage.buttons.calculateExpenses')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CAM Distribution Preview */}
          {showCAMPreview && camSummary && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    {t('buildingUtilityInvoicePage.camPreview.title', {
                      buildingName: selectedBuilding?.buildingName
                    })}
                  </h2>
                  <p className="text-gray-600">
                    {t('buildingUtilityInvoicePage.camPreview.period', {
                      startDate: formatDate(periodStart),
                      endDate: formatDate(periodEnd)
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCAMPreview(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    {t('buildingUtilityInvoicePage.buttons.hidePreview')}
                  </button>
                </div>
              </div>

              {/* Building Area Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-700 mb-2">
                    {t('buildingUtilityInvoicePage.areaBreakdown.title')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('buildingUtilityInvoicePage.areaBreakdown.totalLeasableArea')}</span>
                      <span className="font-bold">{camSummary.totalLeasableArea.toLocaleString()} sq.ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">{t('buildingUtilityInvoicePage.areaBreakdown.occupiedArea')}</span>
                      <span className="font-bold">{camSummary.totalOccupiedArea.toLocaleString()} sq.ft ({camSummary.occupiedPercentage}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">{t('buildingUtilityInvoicePage.areaBreakdown.vacantArea')}</span>
                      <span className="font-bold">{camSummary.totalVacantArea.toLocaleString()} sq.ft ({camSummary.vacantPercentage}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">{t('buildingUtilityInvoicePage.areaBreakdown.unallocatedArea')}</span>
                      <span className="font-bold">{camSummary.unallocatedArea.toLocaleString()} sq.ft ({camSummary.unallocatedPercentage}%)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-700 mb-2">
                    {t('buildingUtilityInvoicePage.costBreakdown.title')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('buildingUtilityInvoicePage.costBreakdown.generatorFee')}</span>
                      <span className="font-bold">{formatCurrency(selectedBuilding?.generatorFee || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('buildingUtilityInvoicePage.costBreakdown.transformerFee')}</span>
                      <span className="font-bold">{formatCurrency(selectedBuilding?.transformerFee || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('buildingUtilityInvoicePage.costBreakdown.otherCAMCosts')}</span>
                      <span className="font-bold">{formatCurrency(otherCAMCosts)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-green-200">
                      <span className="font-bold text-green-700">{t('buildingUtilityInvoicePage.costBreakdown.totalCAMCosts')}</span>
                      <span className="font-bold text-green-700">{formatCurrency(camSummary.totalCAMCosts)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-700 mb-2">
                    {t('buildingUtilityInvoicePage.distribution.title')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-green-600">{t('buildingUtilityInvoicePage.distribution.tenantsPay')}</span>
                        <span className="font-bold text-green-700">{formatCurrency(camSummary.tenantsCAM)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(camSummary.tenantsCAM / camSummary.totalCAMCosts) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('buildingUtilityInvoicePage.distribution.occupiedUnits', {
                          count: camSummary.occupiedUnitsCount,
                          percentage: camSummary.occupiedPercentage
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-red-600">{t('buildingUtilityInvoicePage.distribution.mallOwnerPays')}</span>
                        <span className="font-bold text-red-700">{formatCurrency(camSummary.ownerCAM)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(camSummary.ownerCAM / camSummary.totalCAMCosts) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('buildingUtilityInvoicePage.distribution.vacantUnits', {
                          vacantCount: camSummary.vacantUnitsCount,
                          percentage: (100 - camSummary.occupiedPercentage).toFixed(2)
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Expense Section */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-700 mb-3">
                  {t('buildingUtilityInvoicePage.saveExpense.title')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">
                      {t('buildingUtilityInvoicePage.form.expenseDescription')}
                    </label>
                    <textarea
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      className="w-full border border-yellow-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      rows={2}
                      placeholder={t('buildingUtilityInvoicePage.form.descriptionPlaceholder')}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-yellow-700">{t('buildingUtilityInvoicePage.camPreview.mallOwnerShare')}</div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(camSummary.ownerCAM)}</div>
                    </div>
                    <button
                      onClick={saveMallOwnerExpense}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition duration-200 font-medium"
                    >
                      <Save className="w-5 h-5" />
                      {t('buildingUtilityInvoicePage.buttons.saveExpenseRecord')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expense History Panel */}
          {showExpenseHistory && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {isAdmin 
                    ? t('buildingUtilityInvoicePage.expenseHistory.allExpenses')
                    : t('buildingUtilityInvoicePage.expenseHistory.yourHistory')
                  }
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {t('buildingUtilityInvoicePage.expenseHistory.records', { count: filteredExpenses.length })}
                  </span>
                </h3>
              </div>

              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('buildingUtilityInvoicePage.expenseHistory.buildingPeriod')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('buildingUtilityInvoicePage.expenseHistory.amountDetails')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('buildingUtilityInvoicePage.expenseHistory.status')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('buildingUtilityInvoicePage.expenseHistory.dateRecorded')}
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
                              {t('buildingUtilityInvoicePage.expenseHistory.generator')} {formatCurrency(expense.generatorShare || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t('buildingUtilityInvoicePage.expenseHistory.transformer')} {formatCurrency(expense.transformerShare || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t('buildingUtilityInvoicePage.expenseHistory.otherCAM')} {formatCurrency(expense.otherCAMShare || 0)}
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
                                {t(`buildingUtilityInvoicePage.status.${expense.status.toLowerCase()}`) || expense.status}
                              </span>
                              {(isAdmin || isAccountant) && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => updateExpenseStatus(expense.id, 'PENDING')}
                                    className={`px-2 py-1 text-xs rounded-lg ${expense.status === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                                    title={t('buildingUtilityInvoicePage.buttons.markAsPending')}
                                  >
                                    {t('buildingUtilityInvoicePage.buttons.markAsPending')}
                                  </button>
                                  <button
                                    onClick={() => updateExpenseStatus(expense.id, 'PAID')}
                                    className={`px-2 py-1 text-xs rounded-lg ${expense.status === 'PAID' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                                    title={t('buildingUtilityInvoicePage.buttons.markAsPaid')}
                                  >
                                    {t('buildingUtilityInvoicePage.buttons.markAsPaid')}
                                  </button>
                                  <button
                                    onClick={() => updateExpenseStatus(expense.id, 'CANCELLED')}
                                    className={`px-2 py-1 text-xs rounded-lg ${expense.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                    title={t('buildingUtilityInvoicePage.buttons.markAsCancelled')}
                                  >
                                    {t('buildingUtilityInvoicePage.buttons.markAsCancelled')}
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
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-right">
                          <div className="text-sm text-gray-600 inline-flex items-center gap-4">
                            <span>{t('buildingUtilityInvoicePage.expenseHistory.totalRecords')} {filteredExpenses.length}</span>
                            <span className="text-green-600">
                              {t('buildingUtilityInvoicePage.expenseHistory.paidAmount')} {formatCurrency(filteredExpenses
                                .filter(e => e.status === 'PAID' || e.status === 'APPROVED')
                                .reduce((sum, e) => sum + e.totalAmount, 0))}
                            </span>
                            <span className="text-yellow-600">
                              {t('buildingUtilityInvoicePage.expenseHistory.pendingAmount')} {formatCurrency(filteredExpenses
                                .filter(e => e.status === 'PENDING')
                                .reduce((sum, e) => sum + e.totalAmount, 0))}
                            </span>
                            <span className="text-blue-600">
                              {t('buildingUtilityInvoicePage.expenseHistory.totalAmount')} {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0))}
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t('buildingUtilityInvoicePage.expenseHistory.noExpensesTitle')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('buildingUtilityInvoicePage.expenseHistory.noExpensesDescription')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Guide */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('buildingUtilityInvoicePage.howItWorks.title')}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2">
                  {t('buildingUtilityInvoicePage.howItWorks.keyPrinciple')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('buildingUtilityInvoicePage.howItWorks.keyPrincipleText')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">
                    {t('buildingUtilityInvoicePage.howItWorks.steps.calculateTotal')}
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('buildingUtilityInvoicePage.howItWorks.steps.calculateTotalText')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">
                    {t('buildingUtilityInvoicePage.howItWorks.steps.determineOccupied')}
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('buildingUtilityInvoicePage.howItWorks.steps.determineOccupiedText')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">
                    {t('buildingUtilityInvoicePage.howItWorks.steps.calculateOwnerShare')}
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('buildingUtilityInvoicePage.howItWorks.steps.calculateOwnerShareText')}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-700 mb-2">
                  {t('buildingUtilityInvoicePage.howItWorks.example.title')}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    {t('buildingUtilityInvoicePage.howItWorks.example.totalLeasable', { area: '5,000 sq.ft' })}
                  </div>
                  <div>
                    {t('buildingUtilityInvoicePage.howItWorks.example.occupied', { area: '1,000 sq.ft', percentage: '20%' })}
                  </div>
                  <div>
                    {t('buildingUtilityInvoicePage.howItWorks.example.vacant', { area: '3,000 sq.ft', percentage: '60%' })}
                  </div>
                  <div>
                    {t('buildingUtilityInvoicePage.howItWorks.example.unallocated', { area: '1,000 sq.ft', percentage: '20%' })}
                  </div>
                  <div>
                    {t('buildingUtilityInvoicePage.howItWorks.example.totalCAM', { amount: '1,000,000 MMK' })}
                  </div>
                  <div className="mt-2 font-bold">
                    {t('buildingUtilityInvoicePage.howItWorks.example.tenantsPay', {
                      area: '1,000 sq.ft',
                      totalCost: '1,000,000',
                      totalArea: '5,000',
                      amount: '200,000 MMK'
                    })}
                  </div>
                  <div className="font-bold">
                    {t('buildingUtilityInvoicePage.howItWorks.example.ownerPays', {
                      totalCost: '1,000,000',
                      tenantsPay: '200,000',
                      amount: '800,000 MMK'
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700">
                <strong>{t('buildingUtilityInvoicePage.howItWorks.note', {
                  roleInfo: isAdmin 
                    ? t('buildingUtilityInvoicePage.howItWorks.adminNote')
                    : t('buildingUtilityInvoicePage.howItWorks.nonAdminNote')
                })}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingUtilityInvoicePage;