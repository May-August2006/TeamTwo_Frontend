export interface Room {
  id: number;
  roomNumber: string;
  level: Level;
  roomType: RoomType;
  roomSpace: number;
  meterType: 'ELECTRICITY' | 'WATER';
  isAvailable: boolean;
  rentalFee: number;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
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
  branch: any;
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
  meterType: 'ELECTRICITY' | 'WATER';
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