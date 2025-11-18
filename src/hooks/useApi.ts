import { useCallback } from 'react';

export const useApi = () => {
  const callApi = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error: any) {
      // Axios interceptor already handles token refresh automatically
      throw error;
    }
  }, []);

  return { callApi };
};