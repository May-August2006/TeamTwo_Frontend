/** @format */
export interface BillingFee {
  id: number;
  feeName: string;
  utilityTypeId: number;
  utilityTypeName: string; 
  calculationBase: string;
  rate: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  userId: number;
}

export interface BillingFeeRequest {
  feeName: string;
  utilityTypeId: number; 
  calculationBase: string;
  rate: number;
  description: string;
  isActive: boolean;
}