// types/occupancy.ts
export interface OccupancyStats {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  vacancyRate: number;
}

export interface BuildingOccupancy {
  buildingId: number;
  buildingName: string;
  branchName: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
}

export interface FloorOccupancy {
  floorId: number;
  floorName: string;
  buildingName: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
}

export interface RoomStatus {
  roomId: number;
  roomNumber: string;
  roomType: string;
  floor: string;
  building: string;
  branch: string;
  status: 'OCCUPIED' | 'VACANT';
  currentTenant?: string;
  contractEndDate?: string;
  size: number;
  rentalFee: number;
  isAvailable: boolean;
}