// api/RoomAPI.ts
import API from "./api";
import type {
  Room,
  CreateRoomRequest,
  RoomSearchParams,
  RoomType,
  RoomTypeRequest
} from "../types/room";

export const roomApi = {
  getAll: () => API.get<Room[]>('/api/rooms'),
  getById: (id: number) => API.get<Room>(`/api/rooms/${id}`),
  
  // Create room with FormData
  create: (formData: FormData) => API.post<Room>('/api/rooms', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Update room with FormData
  update: (id: number, formData: FormData) => API.put<Room>(`/api/rooms/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  delete: (id: number) => API.delete<void>(`/api/rooms/${id}`),
  search: (params: RoomSearchParams) => API.get<Room[]>('/api/rooms/search', { params }),
  // getAvailable: () => API.get<Room[]>('/api/rooms/available'),

  // Enhanced getAvailable with response handling
  getAvailable: () => API.get<any>('/api/rooms/available').then(response => {
    console.log('Raw API Response:', response);
    
    // Handle different response structures
    let data = response.data;
    
    if (data && data.content) {
      // Spring Pageable response
      console.log('Spring Pageable structure detected');
      return { ...response, data: data.content };
    } else if (data && Array.isArray(data.data)) {
      // Custom wrapper response
      console.log('Custom wrapper structure detected');
      return { ...response, data: data.data };
    } else if (data && Array.isArray(data)) {
      // Direct array response
      console.log('Direct array structure detected');
      return response;
    } else {
      // Fallback - try to extract array from response
      console.warn('Unexpected response structure, attempting to find array...', data);
      
      // Look for any array in the response
      const findArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) return obj;
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const result = findArray(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };
      
      const foundArray = findArray(data);
      if (foundArray) {
        console.log('Found array in nested structure:', foundArray);
        return { ...response, data: foundArray };
      }
      
      console.error('No array found in response, returning empty array');
      return { ...response, data: [] };
    }
  }),
  
  // Image management endpoints
  addImages: (id: number, formData: FormData) => API.post<Room>(`/api/rooms/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // ✅ FIXED: Remove image with proper encoding
  removeImage: (id: number, imageUrl: string) => {
    // Encode the imageUrl to handle special characters
    const encodedImageUrl = encodeURIComponent(imageUrl);
    return API.delete<Room>(`/api/rooms/${id}/images?imageUrl=${encodedImageUrl}`);
  },

    addUtilities: (roomId: number, utilityTypeIds: number[]) => 
    API.post<Room>(`/api/rooms/${roomId}/utilities`, { utilityTypeIds }),
  
  removeUtility: (roomId: number, utilityTypeId: number) => 
    API.delete<Room>(`/api/rooms/${roomId}/utilities/${utilityTypeId}`),
  
  updateRoomUtilities: (roomId: number, utilityTypeIds: number[]) => 
    API.put<Room>(`/api/rooms/${roomId}/utilities`, { utilityTypeIds }),

 toggleRoomUtility: (roomId: number, utilityTypeId: number, isActive: boolean) => 
    API.patch(`/api/rooms/${roomId}/utilities/${utilityTypeId}/status`, { isActive }),

};

export const roomTypeApi = {
  getAll: () => API.get<RoomType[]>('/api/room-types'),
  getById: (id: number) => API.get<RoomType>(`/api/room-types/${id}`),
  create: (data: RoomTypeRequest) => API.post<RoomType>('/api/room-types', data),
  update: (id: number, data: RoomTypeRequest) => API.put<RoomType>(`/api/room-types/${id}`, data),
  delete: (id: number) => API.delete<void>(`/api/room-types/${id}`),
};