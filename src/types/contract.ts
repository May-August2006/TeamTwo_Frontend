/** @format */

// types/contract.ts
export interface CreateContractRequest {
  contractNumber: string;
  tenantId: number;
  unitId: number;
  startDate: string;
  endDate: string;
  rentalFee: number;
  securityDeposit?: number;
  contractDurationType: ContractDurationType | "";
  gracePeriodDays?: number;
  noticePeriodDays?: number;
  renewalNoticeDays?: number;
  contractTerms?: string;
  utilityTypeIds?: number[];
  agreedToTerms?: boolean;
  termsAgreementVersion?: string;
  contractFile?: File;
}

export interface Contract {
  agreedToTerms: any;
  id: number;
  contractNumber: string;
  tenant?: Tenant;
  unit?: Unit;
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
  terminationDate?: string;
  terminationReason?: string;
  fileName?: string;
  fileOriginalName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  mimeType?: string;
  filePublicId?: string;
  contractFilePath?: string;
  createdAt?: string;
  updatedAt?: string;
  includedUtilities?: UtilityType[];
  createdBy?: User;
  tenantSearchName?: string;
  tenantSearchEmail?: string;
  tenantSearchPhone?: string;
  canBeTerminated?: boolean;
  isDepositSettled?: boolean;
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
  tenantCategory?: {
    id: number;
    categoryName: string;
  };
}

export const UnitType = {
  ROOM: "ROOM",
  SPACE: "SPACE",
  HALL: "HALL",
} as const;

export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export interface Unit {
  id: number;
  unitNumber: string;
  unitType: UnitType;
  unitTypeDisplay?: string;
  hasMeter: boolean;
  level: Level;
  roomType?: RoomType;
  spaceType?: SpaceType;
  hallType?: HallType;
  unitSpace: number;
  isAvailable: boolean;
  rentalFee: number;
  imageUrls: string[];
  utilities: UtilityType[];
  createdAt: string;
  updatedAt: string;
  currentTenantName?: string;
}

export interface Level {
  id: number;
  levelName: string;
  levelNumber: number;
  totalunits: number;
  building?: Building;
  buildingName?: string;
}

export interface Building {
  id: number;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  totalLeasableArea: number;
  branch?: Branch;
  branchName?: string;
}

export interface Branch {
  id: number;
  branchName: string;
}

export interface RoomType {
  id: number;
  typeName: string;
}

export interface SpaceType {
  id: number;
  name: string;
}

export interface HallType {
  id: number;
  name: string;
}

export interface UtilityType {
  id: number;
  utilityName: string;
  description?: string;
  ratePerUnit?: number;
  calculationMethod?: "FIXED" | "METERED" | "PER_UNIT";
}

export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export type ContractStatus = "ACTIVE" | "EXPIRING" | "TERMINATED" | "EXPIRED";
export type ContractDurationType =
  | "THREE_MONTHS"
  | "SIX_MONTHS"
  | "ONE_YEAR"
  | "TWO_YEARS"
  | "";

export interface LeaseTerminationRequest {
  terminationDate: string;
  terminationReason: string;
}

export interface TerminationResult {
  contract: Contract;
  message: string;
  unitReleased: boolean;
}

export interface TerminationPreview {
  canBeTerminated: boolean;
  message?: string;
  contract?: Contract;
  currentStatus?: ContractStatus;
  unitNumber?: string;
  tenantName?: string;
}

export interface ContractDTO {
  id: number;
  contractNumber: string;
  tenant: TenantDTO;
  unit: UnitDTO;
  startDate: string;
  endDate: string;
  rentalFee: number;
  securityDeposit: number;
  contractDurationType: ContractDurationType;
  gracePeriodDays: number;
  noticePeriodDays: number;
  renewalNoticeDays: number;
  contractTerms?: string;
  contractStatus: ContractStatus;
  terminationDate?: string;
  terminationReason?: string;
  depositRefundAmount?: number;
  depositUsedAmount?: number;
  depositSettlementDate?: string;
  fileName?: string;
  fileOriginalName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  includedUtilities?: UtilityTypeDTO[];
  createdByUsername?: string;
  createdById?: number;
  canBeTerminated?: boolean;
  isDepositSettled?: boolean;
  daysRemaining?: number;
  totalContractValue?: number;
}

export interface TenantDTO {
  id: number;
  tenantName: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  nrc_no?: string;
  tenantCategoryName?: string;
}

export interface UnitDTO {
  id: number;
  unitNumber: string;
  rentalFee?: number;
  unitSpace?: number;
  isAvailable?: boolean;
  level?: LevelDTO;
  roomType?: RoomTypeDTO;
  spaceType?: SpaceTypeDTO;
  hallType?: HallTypeDTO;
  unitTypeDisplay?: string;
}

export interface LevelDTO {
  id: number;
  levelName: string;
  levelNumber: number;
  totalUnits: number;
  building?: BuildingDTO;
  buildingName?: string;
}

export interface BuildingDTO {
  id: number;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  totalLeasableArea: number;
  branch?: BranchDTO;
  branchName?: string;
}

export interface BranchDTO {
  id: number;
  branchName: string;
}

export interface RoomTypeDTO {
  id: number;
  typeName: string;
}

export interface SpaceTypeDTO {
  id: number;
  name: string;
}

export interface HallTypeDTO {
  id: number;
  name: string;
}

export interface UtilityTypeDTO {
  id: number;
  utilityName: string;
  description?: string;
  ratePerUnit?: number;
  calculationMethod?: string;
}

export interface RenewContractRequest extends CreateContractRequest {
  originalContractId?: number;
  renewalReason?: string;
}

export interface FileDownloadResponse {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  isPDF?: boolean;
  fileSize?: number;
}

export interface ContractHistory {
  id: number;
  contractId: number;
  actionType:
    | "CREATED"
    | "UPDATED"
    | "RENEWED"
    | "TERMINATED"
    | "AMENDED"
    | "DEPOSIT_SETTLED";
  description: string;
  changedBy: User;
  createdAt: string;
  oldValues?: string;
  newValues?: string;
}

export interface ContractFilter {
  status?: ContractStatus;
  tenantId?: number;
  unitId?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export interface PaginatedContracts {
  content: Contract[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Validation constants
export const CONTRACT_VALIDATION_RULES = {
  contractNumberPattern: /^SGH-\d{4}-\d{3}$/,
  minRentalFee: 1000,
  maxRentalFee: 999999999,
  maxNoticePeriodDays: 365,
  maxRenewalNoticeDays: 365,
  minGracePeriodDays: 0,
  maxGracePeriodDays: 30,
  maxContractTermsLength: 5000,
  maxSecurityDeposit: 999999999,
};

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
