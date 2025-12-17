export interface RentalRevenueByBusinessTypeDTO {
  businessType: string;
  totalRentalFee: number;
  percentage: number;
}
export interface MonthlyCollectionSummaryDTO {
  month: string;
  totalBilledAmount: number | string;
  totalCollectedAmount: number | string;
  difference: number | string;
  billedByType: Record<string, number | string>;
  collectedByType: Record<string, number | string>;
  getCollectionRate: () => number;
}