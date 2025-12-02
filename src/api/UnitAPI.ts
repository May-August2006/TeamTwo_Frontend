// api/UnitAPI.ts
import API from "./api";
import type {
  Unit,
  CreateUnitRequest,
  UnitSearchParams,
  RoomType,
  RoomTypeRequest,
  SpaceType,
  SpaceTypeRequest,
  HallType,
  HallTypeRequest
} from "../types/unit";

export const unitApi = {
  getAll: () => API.get<Unit[]>('/api/units'),
  getById: (id: number) => API.get<Unit>(`/api/units/${id}`),
  getByType: (unitType: string) => API.get<Unit[]>(`/api/units/type/${unitType}`),
  
  // Create unit with FormData
  create: (formData: FormData) => API.post<Unit>('/api/units', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Update unit with FormData
  update: (id: number, formData: FormData) => API.put<Unit>(`/api/units/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  delete: (id: number) => API.delete<void>(`/api/units/${id}`),
  search: (params: UnitSearchParams) => API.get<Unit[]>('/api/units/search', { params }),
  getAvailable: () => API.get<Unit[]>('/api/units/available'),
  
  // Image management endpoints
  addImages: (id: number, formData: FormData) => API.post<Unit>(`/api/units/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  removeImage: (id: number, imageUrl: string) => {
    const encodedImageUrl = encodeURIComponent(imageUrl);
    return API.delete<Unit>(`/api/units/${id}/images?imageUrl=${encodedImageUrl}`);
  },

  addUtilities: (unitId: number, utilityTypeIds: number[]) => 
    API.post<Unit>(`/api/units/${unitId}/utilities`, { utilityTypeIds }),
  
  removeUtility: (unitId: number, utilityTypeId: number) => 
    API.delete<Unit>(`/api/units/${unitId}/utilities/${utilityTypeId}`),
  
  updateUnitUtilities: (unitId: number, utilityTypeIds: number[]) => 
    API.put<Unit>(`/api/units/${unitId}/utilities`, { utilityTypeIds }),

  toggleUnitUtility: (unitId: number, utilityTypeId: number, isActive: boolean) => 
    API.patch(`/api/units/${unitId}/utilities/${utilityTypeId}/status`, { isActive }),
};

export const roomTypeApi = {
  getAll: () => API.get<RoomType[]>('/api/room-types'),
  getById: (id: number) => API.get<RoomType>(`/api/room-types/${id}`),
  create: (data: RoomTypeRequest) => API.post<RoomType>('/api/room-types', data),
  update: (id: number, data: RoomTypeRequest) => API.put<RoomType>(`/api/room-types/${id}`, data),
  delete: (id: number) => API.delete<void>(`/api/room-types/${id}`),
};

export const spaceTypeApi = {
  getAll: () => API.get<SpaceType[]>('/api/space-types'),
  getActive: () => API.get<SpaceType[]>('/api/space-types/active'),
  getById: (id: number) => API.get<SpaceType>(`/api/space-types/${id}`),
  create: (data: SpaceTypeRequest) => API.post<SpaceType>('/api/space-types', data),
  update: (id: number, data: SpaceTypeRequest) => API.put<SpaceType>(`/api/space-types/${id}`, data),
  delete: (id: number) => API.delete<void>(`/api/space-types/${id}`),
};

export const hallTypeApi = {
  getAll: () => API.get<HallType[]>('/api/hall-types'),
  getActive: () => API.get<HallType[]>('/api/hall-types/active'),
  getById: (id: number) => API.get<HallType>(`/api/hall-types/${id}`),
  create: (data: HallTypeRequest) => API.post<HallType>('/api/hall-types', data),
  update: (id: number, data: HallTypeRequest) => API.put<HallType>(`/api/hall-types/${id}`, data),
  delete: (id: number) => API.delete<void>(`/api/hall-types/${id}`),
};