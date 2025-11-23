// types/expiring-contracts.ts
export interface ExpiringContract {
  contractId: number;
  contractNumber: string;
  tenantName: string;
  roomNumber: string;
  buildingName: string;
  branchName: string;
  startDate: string;
  endDate: string;
  daysUntilExpiry: number;
  rentalFee: number;
  businessType: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'EXPIRING_SOON' | 'EXPIRED' | 'NEEDS_RENEWAL';
}