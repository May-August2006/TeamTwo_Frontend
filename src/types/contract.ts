// types/contract.ts
export interface CreateContractRequest {
  contractNumber: string;
  tenantId: number;
  roomId: number;
  startDate: string;
  endDate: string;
  rentalFee: number;
  securityDeposit?: number;
  contractDurationType: ContractDurationType;
  gracePeriodDays?: number;
  noticePeriodDays?: number;
  renewalNoticeDays?: number;
  contractTerms?: string;
  utilityTypeIds?: number[];
  agreedToTerms?: boolean;
  termsAgreementVersion?: string;
}

export interface Contract {
  id: number;
  contractNumber: string;
  tenant?: Tenant;
  room?: Room;
  startDate: string;
  endDate: string;
  rentalFee: number;
  securityDeposit?: number;
  contractDurationType: ContractDurationType;
  gracePeriodDays?: number;
  noticePeriodDays?: number;
  renewalNoticeDays?: number;
  contractTerms?: string;
  contractStatus: ContractStatus;
  contractFilePath?: string;
  createdAt?: string;
  updatedAt?: string;
  includedUtilities?: UtilityType[];
  createdBy?: {
    id: number;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  tenantSearchName?: string;
  tenantSearchEmail?: string;
  tenantSearchPhone?: string;
}

export interface Tenant {
  id: number;
  tenantName: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  nrc_no?: string;
  businessType?: string;
  tenantCategoryName?: string;
}

export interface Room {
  id: number;
  roomNumber: string;
  rentalFee?: number;
  roomSpace?: number;
  isAvailable?: boolean;
  level?: {
    id: number;
    levelName: string;
    building?: {
      id: number;
      buildingName: string;
      branch?: {
        id: number;
        branchName: string;
      };
    };
  };
  roomType?: {
    id: number;
    typeName: string;
  };
}

export interface UtilityType {
  id: number;
  utilityName: string;
  description?: string;
  ratePerUnit?: number;
  calculationMethod?: 'FIXED' | 'METERED';
}

export type ContractStatus = 'ACTIVE' | 'EXPIRING' | 'TERMINATED' | 'EXPIRED';

export type ContractDurationType = 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR' | 'TWO_YEARS';