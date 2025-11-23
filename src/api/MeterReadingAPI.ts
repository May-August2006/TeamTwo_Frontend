// api/MeterReadingAPI.ts
import API from "./api";
import type { MeterReading, MeterReadingRequest } from "../types/billing";

export const meterReadingApi = {
  // Get all meter readings
  getAll: () => API.get<MeterReading[]>('/api/meter-readings'),
  
  // Get meter reading by ID
  getById: (id: number) => API.get<MeterReading>(`/api/meter-readings/${id}`),
  
  // Get meter readings by room ID
  getByRoom: (roomId: number) => API.get<MeterReading[]>(`/api/meter-readings/room/${roomId}`),
  
  // Get meter readings by utility type ID
  getByUtilityType: (utilityTypeId: number) => API.get<MeterReading[]>(`/api/meter-readings/utility/${utilityTypeId}`),
  
  // Get latest meter reading for a room and utility type
  getLatest: (roomId: number, utilityTypeId: number) => 
    API.get<MeterReading>(`/api/meter-readings/latest/room/${roomId}/utility/${utilityTypeId}`),
  
  // Create new meter reading
  create: (data: MeterReadingRequest) => API.post<MeterReading>('/api/meter-readings', data),
  
  // Update meter reading
  update: (id: number, data: MeterReadingRequest) => API.put<MeterReading>(`/api/meter-readings/${id}`, data),
  
  // Delete meter reading
  delete: (id: number) => API.delete<void>(`/api/meter-readings/${id}`),
};