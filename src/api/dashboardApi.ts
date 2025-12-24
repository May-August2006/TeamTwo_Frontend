// api/dashboardApi.ts - UPDATED VERSION
import API from "./api";

export interface DashboardMetrics {
  totalExpenses: number;
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
  utilityCostChange?: number; // Percentage change
  utilityCostChangeAmount?: number; // Absolute change
  buildingUtilityData?: Array<{
    buildingName: string;
    previousYearCost: number;
    currentYearCost: number;
    costChangePercentage: number; // Keep as number
    costChangeAmount: number; // Absolute change
    status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  }>;
  utilityTrendData?: Array<{
    year: string;
    totalCost: number;
    label: string;
  }>;
  cumulativeSavings?: number;
  industryAverageUtility?: number;
  targetCollectionRate?: number;
  realTimeDataAvailable?: boolean;
  lastUpdated?: string;
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

// Format currency for display
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

// Helper to check if response is HTML (backend error)
const isHtmlResponse = (data: any): boolean => {
  if (typeof data === 'string') {
    return data.includes('<!doctype html>') || 
           data.includes('<html') || 
           data.includes('<!DOCTYPE html>');
  }
  return false;
};

export const dashboardApi = {
  // Test if backend is reachable
  testBackend: (): Promise<{status: string}> => 
    API.get('/api/dashboard/stats')
      .then(response => ({status: 'OK'}))
      .catch(() => {
        // Try different endpoints
        return API.get('/api/dashboard/performance-metrics')
          .then(response => ({status: 'OK'}))
          .catch(() => ({status: 'ERROR'}));
      }),

  // Get all dashboard metrics - using the existing /stats endpoint
  getMetrics: (): Promise<DashboardMetrics> =>
    API.get('/api/dashboard/stats')
      .then(response => {
        // Check for HTML response
        if (isHtmlResponse(response.data)) {
          throw new Error('Backend returned HTML instead of JSON. Check if Spring Boot is running.');
        }
        
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
          revenueThisYear: toNumber(data.totalRevenue)
        };
      })
      .catch(error => {
        console.error('Error in getMetrics:', error);
        throw error;
      }),

  getPerformanceMetrics: (): Promise<PerformanceMetricsDTO> =>
    API.get('/api/dashboard/performance-metrics')
      .then(response => {
        // Check for HTML response
        if (isHtmlResponse(response.data)) {
          console.error('Backend returned HTML. Check Spring Boot logs.');
          // Return empty data to trigger sample data
          return {
            realTimeDataAvailable: false,
            lastUpdated: new Date().toISOString()
          };
        }
        
        console.log('Performance metrics API response:', response.data);
        
        const data = response.data;
        
        // If backend returned no data or error flag
        if (!data || data.realTimeDataAvailable === false) {
          return data || { realTimeDataAvailable: false };
        }
        
        // Format the data for display
        if (data.buildingUtilityData) {
          data.buildingUtilityData = data.buildingUtilityData.map((building: any) => ({
            ...building,
            costChangePercentage: building.costChangePercentage || 0,
            costChangeAmount: building.costChangeAmount || 0,
            previousYearCost: building.previousYearCost || 0,
            currentYearCost: building.currentYearCost || 0,
            // Format for display if needed
            formattedPreviousYearCost: formatCurrency(building.previousYearCost || 0),
            formattedCurrentYearCost: formatCurrency(building.currentYearCost || 0),
            formattedCostChangeAmount: building.costChangeAmount >= 0 
              ? `+${formatCurrency(building.costChangeAmount)}` 
              : `${formatCurrency(building.costChangeAmount)}`
          }));
        }
        
        return data;
      })
      .catch(error => {
        console.error('Error fetching performance metrics:', error);
        // Return empty to trigger sample data
        return {
          realTimeDataAvailable: false,
          lastUpdated: new Date().toISOString()
        };
      }),
  
  // Get occupancy summary with building details
  getOccupancySummary: (): Promise<OccupancySummary> =>
    API.get('/api/occupancy/summary')
      .then(response => {
        if (isHtmlResponse(response.data)) {
          throw new Error('Backend returned HTML');
        }
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
      .then(response => {
        if (isHtmlResponse(response.data)) {
          throw new Error('Backend returned HTML');
        }
        return response.data;
      }),

  getFinancialMetrics: (): Promise<DashboardMetrics> =>
    API.get('/api/dashboard/metrics-full')
        .then(response => {
          if (isHtmlResponse(response.data)) {
            throw new Error('Backend returned HTML');
          }
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
        })
        .catch(error => {
          console.error('Error in getFinancialMetrics:', error);
          throw error;
        }),

  // Get revenue summary with optional period filter
  getRevenueSummary: (period?: string): Promise<DashboardMetrics> => {
    let endpoint = '/api/dashboard/revenue/current-month';
    if (period === 'quarter') {
      endpoint = '/api/dashboard/revenue/quarterly';
    } else if (period === 'year') {
      endpoint = '/api/dashboard/revenue/year-to-date';
    }
    
    const params = period ? { period } : {};
    return API.get(endpoint, { params })
      .then(response => {
        if (isHtmlResponse(response.data)) {
          throw new Error('Backend returned HTML');
        }
        const data = response.data;
        
        // We still need to get stats for other metrics
        return API.get('/api/dashboard/stats')
          .then(statsResponse => {
            if (isHtmlResponse(statsResponse.data)) {
              throw new Error('Backend returned HTML');
            }
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
      })
      .catch(error => {
        console.error('Error in getRevenueSummary:', error);
        throw error;
      });
  }
};