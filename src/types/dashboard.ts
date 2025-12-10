/** @format */

export interface DashboardRevenueDTO {
  totalRevenue: number;
  totalPaidAmount: number;
  totalOutstanding: number;
  occupancyRevenue: number;
  utilityRevenue: number;
  otherRevenue: number;
  previousMonthRevenue: number;
  revenueChangePercentage: number;
  activeTenantsCount: number;
  totalUnitsCount: number;
  occupancyRate: number;
  calculationDate: string;
  period: string;
}

export interface DashboardStatsDTO {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalTenants: number;
  activeTenants: number;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingPayments: number;
  overdueInvoices: number;
  pendingMaintenance: number;
  collectionEfficiency?: number;
  revenueGrowth?: number;
}

export interface DashboardMetrics {
  totalShops: number;
  occupiedShops: number;
  vacantShops: number;
  occupancyRate: number;
  totalRentCollected: number;
  collectionRate: number;
  totalRevenue: number;
  rentalIncome: number;
  otherIncome: number;
  totalExpenses: number;
  operationalCosts: number;
  maintenanceCosts: number;
  netProfit: number;
  profitMargin: number;
  utilityCostPerSqFt: number;
  utilityEfficiencyImprovement: number;
  utilitySavings: number;
}

export interface MonthlyRevenueResponse {
  monthlyData: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
}

export interface RevenueCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface QuarterlyPerformance {
  quarter: string;
  revenue: number;
  occupancy: number;
  profit: number;
}

export interface StrategicHighlight {
  title: string;
  value: string;
  description: string;
  icon: string;
}

export interface DashboardDataResponse {
  kpis: Array<{
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: string;
    description: string;
  }>;
  revenueByCategory: RevenueCategory[];
  quarterlyPerformance: QuarterlyPerformance[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
  strategicHighlights: StrategicHighlight[];
}