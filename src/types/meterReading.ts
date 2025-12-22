// types/meterReading.ts
export interface MeterReading {
  utilityId: number;
  id: number;
  unitId: number; // ✅ Changed from roomId
  unitNumber: string; // ✅ Changed from roomNumber
  utilityTypeId: number;
  utilityName: string;
  readingDate: string;
  currentReading: number;
  previousReading?: number;
  consumption?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeterReadingRequest {
  unitId: number; // ✅ Changed from roomId
  utilityTypeId: number;
  readingDate: string;
  currentReading: number;
  previousReading?: number;
}
export interface Room {
  id: number;
  roomNumber: string;
  space: number;
  isActive: boolean;
}

export interface UtilityType {
  id: number;
  utilityName: string;
  rate: number;
  baseCost?: number;
  unit: string;
  isActive: boolean;
}