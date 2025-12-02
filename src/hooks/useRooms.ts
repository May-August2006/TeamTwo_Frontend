// hooks/useRooms.ts (Updated & Clean Version)

import { useState, useEffect } from 'react';
import type {  Room, RoomSearchParams } from '../types/unit';
import { roomApi } from '../api/RoomAPI';
import type { AxiosError } from 'axios';

export const useRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Generic error message extractor (fully type-safe)
  const extractErrorMessage = (err: AxiosError): string => {
    if (err.response?.data && typeof err.response.data === 'object') {
      const data = err.response.data as Record<string, unknown>;
      if (typeof data.message === 'string') return data.message;
    }
    return err.message || 'An unexpected error occurred';
  };

  const loadRooms = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await roomApi.getAll();
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error loading rooms:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const searchRooms = async (params: RoomSearchParams): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await roomApi.search(params);
      setFilteredRooms(response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error searching rooms:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (formData: FormData): Promise<boolean> => {
    try {
      setError(null);

      await roomApi.create(formData);
      await loadRooms();
      return true;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error creating room:', err);
      setError(extractErrorMessage(err));
      return false;
    }
  };

  const updateRoom = async (id: number, formData: FormData): Promise<boolean> => {
    try {
      setError(null);

      await roomApi.update(id, formData);
      await loadRooms();
      return true;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error updating room:', err);
      setError(extractErrorMessage(err));
      return false;
    }
  };

  const deleteRoom = async (id: number): Promise<boolean> => {
    try {
      setError(null);

      await roomApi.delete(id);
      await loadRooms();
      return true;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error deleting room:', err);
      setError(extractErrorMessage(err));
      return false;
    }
  };

  const resetSearch = (): void => {
    setFilteredRooms(rooms);
  };

  useEffect(() => {
    loadRooms(); // no manual token checks
  }, []);

  return {
    rooms,
    filteredRooms,
    loading,
    error,
    loadRooms,
    searchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    resetSearch,
    setError,
  };
};
