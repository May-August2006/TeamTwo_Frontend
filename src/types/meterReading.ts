export interface MeterReading {
  id: number;
  roomId: number;
  roomNumber: string;
  utilityTypeId: number;
  utilityName: string;
  readingDate: string;
  currentReading: number;
  previousReading?: number;
  consumption?: number;
  createdAt?: string;
}

export interface CreateMeterReadingRequest {
  roomId: number;
  utilityTypeId: number;
  readingDate: string;
  currentReading: number;
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