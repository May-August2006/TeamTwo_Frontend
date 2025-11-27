/** @format */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  getRefreshToken,
  saveAuthData,
  clearAuthData,
  isTokenExpired,
  getUserId,
  getUsername,
  getRoles,
} from "../Auth.js";

// Define response type from refresh-token API
interface RefreshTokenResponse {
  token: string; // or accessToken
  refreshToken?: string;
  roles?: string[];
}

// Create Axios instance
const API: AxiosInstance = axios.create({
  baseURL: "http://localhost:8081",
});

// Helper: refresh access token using refresh token
export const tryRefreshToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  const userId = getUserId();
  const username = getUsername();

  if (!refreshToken || !username) return false;

  try {
    const res = await axios.post<RefreshTokenResponse>(
      "http://localhost:8081/api/auth/refresh-token",
      { refreshToken }
    );

    const newAccessToken = res.data.token;
    const newRefreshToken = res.data.refreshToken || refreshToken;

    const newRoles = res.data.roles || getRoles() || ["ROLE_GUEST"];

    saveAuthData({
      userId: userId || 0,
      username,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      roles: newRoles, // optionally include roles if returned from backend
    });

    return true;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    clearAuthData();
    return false;
  }
};

// Request interceptor: attach token
API.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    let token = getAccessToken();

    if (token && isTokenExpired(token)) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        token = getAccessToken();
      } else {
        window.location.href = "/login";
        return Promise.reject("Access token expired");
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (unauthorized)
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const token = getAccessToken();
        if (originalRequest.headers && token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return axios(originalRequest);
      } else {
        clearAuthData();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
