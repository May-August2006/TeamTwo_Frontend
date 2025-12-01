/** @format */

export interface Room {
  meterType: string;
  id: number;
  roomNumber: string;
  level: Level;
  roomType: RoomType;
  roomSpace: number;
  isAvailable: boolean;
  rentalFee: number;
  imageUrls: string[];
  utilities: UtilityType[];
  createdAt: string;
  updatedAt: string;
  currentTenantName?: string;
}

export interface RoomType {
  id: number;
  typeName: string;
  description: string;
  createdAt: string;
}

export interface Level {
  id: number;
  buildingId: number;
  buildingName: string;
  levelName: string;
  levelNumber: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
  building: Building;
}

export interface Building {
  id: number;
  branchId: number;
  branchName: string;
  buildingName: string;
  totalLevels: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: number;
  branchName: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  roomNumber: string;
  levelId: number;
  roomTypeId: number;
  roomSpace: number;
  utilityTypeIds?: number[];
  rentalFee: number;
  images?: File[];
}

export interface RoomTypeRequest {
  typeName: string;
  description: string;
}

export interface LevelRequest {
  buildingId: number;
  levelName: string;
  levelNumber: number;
}

export interface BuildingRequest {
  branchId: number;
  buildingName: string;
}

export interface BranchRequest {
  branchName: string;
  address: string;
  phone: string;
  email: string;
}

export interface RoomSearchParams {
  branchId?: number;
  buildingId?: number;
  levelId?: number;
  roomTypeId?: number;
  isAvailable?: boolean;
  minSpace?: number;
  maxSpace?: number;
  minRent?: number;
  maxRent?: number;
}

export interface UtilityType {
  id: number;
  utilityName: string;
  ratePerUnit: number;
  calculationMethod: "FIXED" | "METERED" | "ALLOCATED";
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface UtilityTypeRequest {
  utilityName: string;
  calculationMethod: 'FIXED' | 'METERED' | 'ALLOCATED';
  ratePerUnit: number;
  description: string;
}

export interface RoomUtility {
  id: number;
  roomId: number;
  utilityTypeId: number;
  isActive: boolean;
  createdAt: string;
  utilityType: UtilityType;
}

export interface UtilityTypeRequest {
  utilityName: string;
  ratePerUnit: number;
  calculationMethod: "FIXED" | "METERED" | "ALLOCATED";
  description: string;
}
