/** @format */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { buildingApi } from '../../api/BuildingAPI';
import { contractApi } from '../../api/ContractAPI';
import { maintenanceApi } from '../../api/maintenanceApi';
import { tenantApi } from '../../api/TenantAPI';
import { appointmentApi } from '../../api/appointmentApi';
import { useTranslation } from 'react-i18next';

interface DashboardKPI {
  id: string;
  title: string;
  value: number;
  icon: string;
  colorClass: string;
  format?: 'currency' | 'number' | 'percentage';
  link: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  colorClass: string;
}

export const OverviewPage: React.FC = () => {
  const { userId, username, isAuthenticated } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buildingName, setBuildingName] = useState<string>('');
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchBuildingData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, userId]);

  const fetchBuildingData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      if (!userId) {
        throw new Error('No user ID found');
      }

      console.log(`Fetching building data for Manager ${userId}`);

      // 1. Get manager's assigned building - use the SAME method as ContractList
      const buildingResponse = await buildingApi.getMyAssignedBuilding();
      if (!buildingResponse.data) {
        throw new Error('No building assigned to you yet');
      }

      const building = buildingResponse.data;
      const currentBuildingId = building.id;
      
      setBuildingId(currentBuildingId);
      setBuildingName(building.buildingName);

      console.log(`Building: ${building.buildingName} (ID: ${currentBuildingId})`);

      // 2. Fetch ALL building-specific data - use methods that actually exist
      const [
        contractsResponse,
        maintenanceResponse,
        tenantsResponse,
        appointmentsResponse
      ] = await Promise.allSettled([
        // Use building-specific endpoints if they exist, otherwise filter manually
        getBuildingContracts(currentBuildingId),
        maintenanceApi.getRequestsByBuilding(currentBuildingId),
        getBuildingTenants(currentBuildingId),
        appointmentApi.getByManager(userId)
      ]);

      // Process data
      let contracts: any[] = [];
      let maintenance: any[] = [];
      let tenants: any[] = [];
      let appointments: any[] = [];

      // Contracts
      if (contractsResponse.status === 'fulfilled') {
        contracts = contractsResponse.value || [];
        console.log(`📄 Contracts in building: ${contracts.length}`);
        console.log('Contract statuses:', contracts.map(c => ({ 
          id: c.id, 
          status: c.status,
          contractStatus: c.contractStatus 
        })));
      }

      // Maintenance
      if (maintenanceResponse.status === 'fulfilled') {
        maintenance = maintenanceResponse.value.data || [];
        console.log(`🔧 Maintenance requests: ${maintenance.length}`);
        console.log('Maintenance statuses:', maintenance.map(m => ({ 
          id: m.id, 
          status: m.status 
        })));
      }

      // Tenants
      if (tenantsResponse.status === 'fulfilled') {
        tenants = tenantsResponse.value || [];
        console.log(`👥 Tenants in building: ${tenants.length}`);
      }

      // Appointments
      if (appointmentsResponse.status === 'fulfilled') {
        appointments = appointmentsResponse.value.data || [];
        console.log(`📅 Appointments: ${appointments.length}`);
        console.log('Appointment statuses:', appointments.map(a => ({ 
          id: a.id, 
          status: a.status 
        })));
      }

      // Get total units from building (hardcode for now, or get from building response)
      const totalUnits = building.totalUnits || 50; // Default to 50 if not available

      // Calculate KPIs for THIS building only
      const buildingKPIs = calculateBuildingKPIs(contracts, maintenance, tenants, appointments, totalUnits);
      
      setKpis(buildingKPIs);
      setLastUpdated(new Date().toLocaleTimeString());

      console.log('✅ Building dashboard loaded successfully');

    } catch (err) {
      console.error('❌ Error fetching building data:', err);
      setError(t('overview.fetchError', 'Failed to load building data. Please try again.'));
      setKpis(getEmptyKPIs());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getBuildingContracts = async (buildingId: number): Promise<any[]> => {
    try {
      // Try building-specific endpoint first
      if (buildingApi.getContractsByBuilding) {
        const response = await buildingApi.getContractsByBuilding(buildingId);
        return response.data || [];
      }
      // Fallback: get all contracts and filter by building
      const allContracts = await contractApi.getAll();
      const contracts = allContracts.data || [];
      return contracts.filter(contract => 
        contract.buildingId === buildingId || 
        contract.unit?.buildingId === buildingId
      );
    } catch (err) {
      console.error('Error getting building contracts:', err);
      return [];
    }
  };

  const getBuildingTenants = async (buildingId: number): Promise<any[]> => {
    try {
      // Try building-specific endpoint first
      if (buildingApi.getTenantsByBuilding) {
        const response = await buildingApi.getTenantsByBuilding(buildingId);
        return response.data || [];
      }
      // Fallback: use manager view (should already be building-specific)
      return await tenantApi.getForManagerView();
    } catch (err) {
      console.error('Error getting building tenants:', err);
      return [];
    }
  };

  const calculateBuildingKPIs = (
    contracts: any[],
    maintenance: any[],
    tenants: any[],
    appointments: any[],
    totalUnits: number
  ): DashboardKPI[] => {
    console.log('Calculating KPIs with data:', {
      contractCount: contracts.length,
      tenantCount: tenants.length,
      maintenanceCount: maintenance.length,
      appointmentCount: appointments.length,
      totalUnits
    });

    // 1. Total contracts in building
    const totalContracts = contracts.length;

    // 2. Active contracts (check both status and contractStatus)
    const activeContracts = contracts.filter(contract => {
      const status = (contract.status || contract.contractStatus || '').toUpperCase();
      return status === 'ACTIVE';
    }).length;
    console.log(`Active contracts: ${activeContracts} out of ${totalContracts}`);

    // 3. Active tenants in building (tenants with active contracts)
    const activeTenants = tenants.length;
    console.log(`Active tenants: ${activeTenants}`);

    // 4. Occupancy rate (active contracts / total units)
    const occupancyRate = totalUnits > 0 ? Math.round((activeContracts / totalUnits) * 100) : 0;
    console.log(`Occupancy rate: ${occupancyRate}% (${activeContracts}/${totalUnits})`);

    // 5. Pending maintenance requests
    const pendingMaintenance = maintenance.filter(req => {
      const status = (req.status || '').toUpperCase();
      return status === 'PENDING';
    }).length;
    console.log(`Pending maintenance: ${pendingMaintenance}`);

    // 6. Scheduled appointments
    const scheduledAppointments = appointments.filter(app => {
      const status = (app.status || '').toUpperCase();
      return status === 'SCHEDULED' || status === 'CONFIRMED';
    }).length;
    console.log(`Scheduled appointments: ${scheduledAppointments}`);

    return [
      {
        id: 'total-contracts',
        title: t('overview.totalLeases', 'Total Leases'),
        value: totalContracts,
        icon: '📄',
        colorClass: 'bg-blue-100 text-blue-600 border-blue-200',
        format: 'number',
        link: '/manager/leases'
      },
      {
        id: 'active-contracts',
        title: t('overview.activeLeases', 'Active Leases'),
        value: activeContracts,
        icon: '✅',
        colorClass: 'bg-green-100 text-green-600 border-green-200',
        format: 'number',
        link: '/manager/leases?status=ACTIVE'
      },
      {
        id: 'active-tenants',
        title: t('overview.activeTenants', 'Active Tenants'),
        value: activeTenants,
        icon: '👥',
        colorClass: 'bg-purple-100 text-purple-600 border-purple-200',
        format: 'number',
        link: '/manager/tenants'
      },
      {
        id: 'occupancy',
        title: t('overview.occupancyRate', 'Occupancy Rate'),
        value: occupancyRate,
        icon: '🏠',
        colorClass: 'bg-amber-100 text-amber-600 border-amber-200',
        format: 'percentage',
        link: '/manager/leases'
      },
      {
        id: 'pending-maintenance',
        title: t('overview.pendingMaintenance', 'Pending Maintenance'),
        value: pendingMaintenance,
        icon: '🔧',
        colorClass: 'bg-red-100 text-red-600 border-red-200',
        format: 'number',
        link: '/manager/maintenance'
      },
      {
        id: 'scheduled-appointments',
        title: t('overview.scheduledAppointments', 'Scheduled Appointments'),
        value: scheduledAppointments,
        icon: '📅',
        colorClass: 'bg-indigo-100 text-indigo-600 border-indigo-200',
        format: 'number',
        link: '/manager/appointments'
      }
    ];
  };

  const getEmptyKPIs = (): DashboardKPI[] => {
    return [
      {
        id: 'total-contracts',
        title: t('overview.totalLeases', 'Total Leases'),
        value: 0,
        icon: '📄',
        colorClass: 'bg-blue-100 text-blue-600 border-blue-200',
        format: 'number',
        link: '/manager/leases'
      },
      {
        id: 'active-contracts',
        title: t('overview.activeLeases', 'Active Leases'),
        value: 0,
        icon: '✅',
        colorClass: 'bg-green-100 text-green-600 border-green-200',
        format: 'number',
        link: '/manager/leases?status=ACTIVE'
      },
      {
        id: 'active-tenants',
        title: t('overview.activeTenants', 'Active Tenants'),
        value: 0,
        icon: '👥',
        colorClass: 'bg-purple-100 text-purple-600 border-purple-200',
        format: 'number',
        link: '/manager/tenants'
      },
      {
        id: 'occupancy',
        title: t('overview.occupancyRate', 'Occupancy Rate'),
        value: 0,
        icon: '🏠',
        colorClass: 'bg-amber-100 text-amber-600 border-amber-200',
        format: 'percentage',
        link: '/manager/leases'
      },
      {
        id: 'pending-maintenance',
        title: t('overview.pendingMaintenance', 'Pending Maintenance'),
        value: 0,
        icon: '🔧',
        colorClass: 'bg-red-100 text-red-600 border-red-200',
        format: 'number',
        link: '/manager/maintenance'
      },
      {
        id: 'scheduled-appointments',
        title: t('overview.scheduledAppointments', 'Scheduled Appointments'),
        value: 0,
        icon: '📅',
        colorClass: 'bg-indigo-100 text-indigo-600 border-indigo-200',
        format: 'number',
        link: '/manager/appointments'
      }
    ];
  };

  const formatValue = (value: number, format?: string): string => {
    switch (format) {
      case 'currency':
        return `${value.toLocaleString()} MMK`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const handleRefresh = () => {
    fetchBuildingData(true);
  };

  const handleKPIClick = (link: string) => {
    window.location.href = link;
  };

  const quickActions: QuickAction[] = [
    {
      id: 'appointments',
      title: t('overview.quickAppointments', 'Appointments'),
      description: t('overview.quickAppointmentsDesc', 'Schedule & manage viewings'),
      icon: '📅',
      link: '/manager/appointments',
      colorClass: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
    },
    {
      id: 'contracts',
      title: t('overview.quickLeases', 'Leases'),
      description: t('overview.quickLeasesDesc', 'Create & manage leases'),
      icon: '📄',
      link: '/manager/leases',
      colorClass: 'border-green-200 hover:border-green-400 hover:bg-green-50'
    },
    {
      id: 'maintenance',
      title: t('overview.quickMaintenance', 'Maintenance'),
      description: t('overview.quickMaintenanceDesc', 'Handle repair requests'),
      icon: '🔧',
      link: '/manager/maintenance',
      colorClass: 'border-red-200 hover:border-red-400 hover:bg-red-50'
    },
    {
      id: 'tenants',
      title: t('overview.quickTenants', 'Tenants'),
      description: t('overview.quickTenantsDesc', 'View resident directory'),
      icon: '👥',
      link: '/manager/tenants',
      colorClass: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
    }
  ];

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8 animate-pulse"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('common.loginRequired', 'Login Required')}
          </h1>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            {t('common.goToLogin', 'Go to Login')}
          </button>
        </div>
      </div>
    );
  }

  if (!buildingId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('overview.noBuilding', 'No Building Assigned')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('overview.noBuildingDesc', 'You don\'t have a building assigned yet. Please contact your administrator.')}
          </p>
          <div className="text-sm text-gray-500">
            {t('overview.managerId', 'Manager')}: {username} • {t('overview.userId', 'User ID')}: {userId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('overview.dashboard', 'Overview Dashboard')}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-gray-600">
                  {t('common.welcome', 'Welcome')}, {username} 
                </span>
                
              </div>
            </div>
            
            {/* <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.refreshing', 'Refreshing...')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('common.refreshData', 'Refresh Data')}
                </>
              )}
            </button> */}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Building Info Card */}
          {/* <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl text-blue-600">🏢</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{buildingName}</h2>
                <p className="text-sm text-gray-600">
                  {t('overview.buildingId', 'Building ID')}: {buildingId} • {t('overview.buildingData', 'All data shown is specific to this building only')}
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* KPI Grid - Simple & Clean */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpis.map((kpi) => (
            <div 
              key={kpi.id}
              onClick={() => handleKPIClick(kpi.link)}
              className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              style={{ borderColor: kpi.colorClass.split(' ')[0].replace('bg-', 'border-') }}
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.colorClass}`}>
                  <span className="text-2xl">{kpi.icon}</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatValue(kpi.value, kpi.format)}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {t('overview.clickToView', 'Click to view details')} →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - FIXED LINKS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('overview.quickActions', 'Quick Actions')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button 
                key={action.id}
                onClick={() => window.location.href = action.link}
                className={`bg-white p-5 rounded-xl border ${action.colorClass} shadow-sm hover:shadow-md transition-all duration-200 text-left`}
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{action.icon}</span>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
                <div className="mt-4 text-sm text-blue-600 flex items-center">
                  {t('overview.goToPage', 'Go to page')}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};