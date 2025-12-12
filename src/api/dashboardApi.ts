// api/dashboardApi.ts - UPDATED VERSION
import API from "./api";

export interface DashboardMetrics {
  totalRevenue: number;
  occupancyRate: number;
  collectionEfficiency: number;
  activeTenants: number;
  revenueThisMonth?: number;
  revenueThisQuarter?: number;
  revenueThisYear?: number;
}

export interface BuildingOccupancyDTO {
  buildingId: number;
  buildingName: string;
  branchName: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
}

export interface OccupancySummary {
  totalBuildings: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  overallOccupancyRate: number;
  buildingStats: BuildingOccupancyDTO[];
}

export interface PerformanceMetricsDTO {
  rentCollectionRate?: number;
  rentCollectionChange?: number;
  utilityEfficiency?: number;
  utilityEfficiencyChange?: number;
  buildingUtilityData?: Array<{
    buildingName: string;
    cost2023: number;
    cost2024: number;
    improvement: number;  // Changed from string to number
    status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  }>;
  utilityTrendData?: Array<{
    year: string;
    cost: number;
    label: string;
  }>;
  cumulativeSavings?: number;
  industryAverageUtility?: number;
  targetCollectionRate?: number;
}

// Helper to convert BigDecimal to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && 'doubleValue' in value) {
    return value.doubleValue();
  }
  return Number(value) || 0;
};

export const dashboardApi = {
  // Get all dashboard metrics - using the existing /stats endpoint
  getMetrics: (): Promise<DashboardMetrics> =>
    API.get('/api/dashboard/stats')
      .then(response => {
        const data = response.data;
        console.log('Dashboard stats:', data); // For debugging
        
        // Calculate collection efficiency
        const totalBilled = toNumber(data.totalRevenue) + toNumber(data.outstandingPayments);
        const totalPaid = toNumber(data.totalRevenue);
        const collectionEfficiency = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
        
        return {
          totalRevenue: toNumber(data.totalRevenue),
          occupancyRate: toNumber(data.occupancyRate),
          collectionEfficiency: collectionEfficiency,
          activeTenants: data.activeTenants || 0,
          revenueThisMonth: toNumber(data.monthlyRevenue),
          revenueThisYear: toNumber(data.totalRevenue) // For now, using total as yearly
        };
      }),

      getPerformanceMetrics: (): Promise<PerformanceMetricsDTO> =>
    API.get('/api/dashboard/performance-metrics')
      .then(response => {
        console.log('Performance metrics API response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('Error fetching performance metrics:', error);
        throw error;
      }),
  

  // Get occupancy summary with building details
  getOccupancySummary: (): Promise<OccupancySummary> =>
    API.get('/api/occupancy/summary')
      .then(response => {
        const data = response.data;
        return {
          totalBuildings: data.totalBuildings || 0,
          totalUnits: data.totalUnits || 0,
          occupiedUnits: data.occupiedUnits || 0,
          vacantUnits: data.vacantUnits || 0,
          overallOccupancyRate: data.overallOccupancyRate || 0,
          buildingStats: data.buildingStats || []
        };
      }),

  // Get building occupancy stats
  getBuildingOccupancyStats: (): Promise<BuildingOccupancyDTO[]> =>
    API.get('/api/occupancy/building-stats')
      .then(response => response.data),

      getFinancialMetrics: (): Promise<DashboardMetrics> =>
        API.get('/api/dashboard/metrics-full')
            .then(response => {
                const data = response.data;
                return {
                    totalRevenue: toNumber(data.totalRevenue),
                    totalExpenses: toNumber(data.totalExpenses),
                    netProfit: toNumber(data.netProfit),
                    profitMargin: toNumber(data.profitMargin),
                    occupancyRate: toNumber(data.occupancyRate),
                    collectionEfficiency: toNumber(data.collectionEfficiency),
                    totalUnits: data.totalUnits || 0,
                    occupiedUnits: data.occupiedUnits || 0,
                    activeTenants: data.activeTenants || 0,
                    activeContracts: data.activeContracts || 0,
                    // Calculate vacant units
                    vacantUnits: (data.totalUnits || 0) - (data.occupiedUnits || 0)
                };
            }),

  // Get revenue summary with optional period filter
  getRevenueSummary: (period?: string): Promise<DashboardMetrics> => {
    let endpoint = '/api/dashboard/revenue/current-month';
    if (period === 'quarter') {
      // You'll need to implement quarterly endpoint
      endpoint = '/api/dashboard/revenue/current-month';
    } else if (period === 'year') {
      endpoint = '/api/dashboard/revenue/year-to-date';
    }
    
    const params = period ? { period } : {};
    return API.get(endpoint, { params })
      .then(response => {
        const data = response.data;
        
        // We still need to get stats for other metrics
        return API.get('/api/dashboard/stats')
          .then(statsResponse => {
            const statsData = statsResponse.data;
            
            // Calculate collection efficiency
            const totalBilled = toNumber(statsData.totalRevenue) + toNumber(statsData.outstandingPayments);
            const totalPaid = toNumber(statsData.totalRevenue);
            const collectionEfficiency = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
            
            return {
              totalRevenue: toNumber(data.totalRevenue) || toNumber(statsData.totalRevenue),
              occupancyRate: toNumber(statsData.occupancyRate),
              collectionEfficiency: collectionEfficiency,
              activeTenants: statsData.activeTenants || 0,
              revenueThisMonth: toNumber(data.totalRevenue),
              revenueThisYear: toNumber(statsData.totalRevenue)
            };
          });
      });
  }
};