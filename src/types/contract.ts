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
  contractFile?: File;
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

export interface Room {
  id: number;
  roomNumber: string;
  rentalFee?: number;
  roomSpace?: number;
  isAvailable?: boolean;
  level?: Level;
  roomType?: RoomType;
}

export interface Level {
  id: number;
  levelName: string;
  levelNumber: number;
  totalRooms: number;
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

export interface UtilityType {
  id: number;
  utilityName: string;
  description?: string;
  ratePerUnit?: number;
  calculationMethod?: 'FIXED' | 'METERED' | 'PER_UNIT';
}

export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export type ContractStatus = 'ACTIVE' | 'EXPIRING' | 'TERMINATED' | 'EXPIRED';
export type ContractDurationType = 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR' | 'TWO_YEARS';

export interface LeaseTerminationRequest {
  terminationDate: string;
  terminationReason: string;
}

export interface TerminationResult {
  contract: Contract;
  message: string;
  roomReleased: boolean;
}

export interface TerminationPreview {
  canBeTerminated: boolean;
  message?: string;
  contract?: Contract;
  currentStatus?: ContractStatus;
  roomNumber?: string;
  tenantName?: string;
}

export interface ContractDTO {
  id: number;
  contractNumber: string;
  tenant: TenantDTO;
  room: RoomDTO;
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

export interface RoomDTO {
  id: number;
  roomNumber: string;
  rentalFee?: number;
  roomSpace?: number;
  isAvailable?: boolean;
  level?: LevelDTO;
  roomType?: RoomTypeDTO;
}

export interface LevelDTO {
  id: number;
  levelName: string;
  levelNumber: number;
  totalRooms: number;
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
  actionType: 'CREATED' | 'UPDATED' | 'RENEWED' | 'TERMINATED' | 'AMENDED' | 'DEPOSIT_SETTLED';
  description: string;
  changedBy: User;
  createdAt: string;
  oldValues?: string;
  newValues?: string;
}

export interface ContractFilter {
  status?: ContractStatus;
  tenantId?: number;
  roomId?: number;
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