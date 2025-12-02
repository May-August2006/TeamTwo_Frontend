import API from "./api";
import type { CreateMeterReadingRequest, MeterReading } from '../types/meterReading';
import type { Unit, UtilityType } from '../types/unit'; // Changed from Room to Unit

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

  // ✅ Changed from getMeterReadingsByRoom to getMeterReadingsByUnit
  getMeterReadingsByUnit: (unitId: number): Promise<MeterReading[]> =>
    API.get(`/api/meter-readings/unit/${unitId}`).then(response => response.data),

  getMeterReadingsByUtilityType: (utilityTypeId: number): Promise<MeterReading[]> =>
    API.get(`/api/meter-readings/utility-type/${utilityTypeId}`).then(response => response.data),

  // ✅ Changed parameter from roomId to unitId
  getPreviousReading: (unitId: number, utilityTypeId: number): Promise<MeterReading> =>
    API.get('/api/meter-readings/previous-reading', {
      params: { unitId, utilityTypeId } // Changed from roomId to unitId
    }).then(response => response.data),
};

export const utilityTypeApi = {
  getAllUtilityTypes: (): Promise<UtilityType[]> =>
    API.get('/api/utility-types').then(response => response.data),

  getActiveUtilityTypes: (): Promise<UtilityType[]> =>
    API.get('/api/utility-types/active').then(response => response.data),

  getUtilityTypeById: (id: number): Promise<UtilityType> =>
    API.get(`/api/utility-types/${id}`).then(response => response.data),

  createUtilityType: (data: any): Promise<UtilityType> =>
    API.post('/api/utility-types', data).then(response => response.data),

  updateUtilityType: (id: number, data: any): Promise<UtilityType> =>
    API.put(`/api/utility-types/${id}`, data).then(response => response.data),

  deleteUtilityType: (id: number): Promise<void> =>
    API.delete(`/api/utility-types/${id}`),
};

// ✅ Changed from roomService to unitService
export const unitService = {
  getAllUnits: (): Promise<Unit[]> =>
    API.get('/api/units').then(response => response.data),

  getUnitById: (id: number): Promise<Unit> =>
    API.get(`/api/units/${id}`).then(response => response.data),

  getUnitsByType: (unitType: string): Promise<Unit[]> =>
    API.get(`/api/units/type/${unitType}`).then(response => response.data),

  getAvailableUnits: (): Promise<Unit[]> =>
    API.get('/api/units/available').then(response => response.data),

  searchUnits: (params: any): Promise<Unit[]> =>
    API.get('/api/units/search', { params }).then(response => response.data),
};

// ✅ For backward compatibility (temporary)
export const roomService = unitService;