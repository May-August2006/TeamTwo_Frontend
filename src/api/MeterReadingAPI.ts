import API from "./api"; // Import your centralized API instance
import type { CreateMeterReadingRequest, MeterReading } from '../types/meterReading';
import type { Room, UtilityType } from '../types/room';

export const meterReadingApi = {
  getAllMeterReadings: (): Promise<MeterReading[]> =>
    API.get('/api/meter-readings').then(response => response.data),

  getMeterReadingById: (id: number): Promise<MeterReading> =>
    API.get(`/api/meter-readings/${id}`).then(response => response.data),

  createMeterReading: (request: CreateMeterReadingRequest): Promise<MeterReading> =>
    API.post('/api/meter-readings', request).then(response => response.data),

  updateMeterReading: (id: number, request: CreateMeterReadingRequest): Promise<MeterReading> =>
    API.put(`/api/meter-readings/${id}`, request).then(response => response.data),

  deleteMeterReading: (id: number): Promise<void> =>
    API.delete(`/api/meter-readings/${id}`),

  getMeterReadingsByRoom: (roomId: number): Promise<MeterReading[]> =>
    API.get(`/api/meter-readings/room/${roomId}`).then(response => response.data),

  getMeterReadingsByUtilityType: (utilityTypeId: number): Promise<MeterReading[]> =>
    API.get(`/api/meter-readings/utility-type/${utilityTypeId}`).then(response => response.data),

  getPreviousReading: (roomId: number, utilityTypeId: number): Promise<MeterReading> =>
    API.get('/api/meter-readings/previous-reading', {
      params: { roomId, utilityTypeId }
    }).then(response => response.data),
};

export const utilityTypeApi = {
  getAllUtilityTypes: (): Promise<UtilityType[]> =>
    API.get('/api/utility-types').then(response => response.data),

  getActiveUtilityTypes: (): Promise<UtilityType[]> =>
    API.get('/api/utility-types/active').then(response => response.data),
};

export const roomService = {
  getAllRooms: (): Promise<Room[]> =>
    API.get('/api/rooms').then(response => response.data),
};