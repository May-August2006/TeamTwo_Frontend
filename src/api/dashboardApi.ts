// api/dashboardApi.ts - FIXED VERSION
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