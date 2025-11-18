/** @format */

// Key constants
export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USERNAME_KEY = "username";
export const ROLES_KEY = "roles";

// Token payload interface (for JWT)
interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

// Auth data structure for saving
interface AuthData {
  username: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
}

/**
 * Save tokens & username to localStorage
 */
export const saveAuthData = ({
  username,
  accessToken,
  refreshToken,
  roles,
}: AuthData): void => {
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles)); // save array
};

/**
 * Getters for stored auth data
 */
export const getUsername = (): string | null =>
  localStorage.getItem(USERNAME_KEY);

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const getRoles = (): string[] => {
  const roles = localStorage.getItem(ROLES_KEY);
  return roles ? JSON.parse(roles) : [];
};

/**
 * Clear all auth data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLES_KEY);
};

/**
 * Decode JWT payload safely
 */
const decodeJwt = (token?: string | null): JwtPayload | null => {
  if (!token) return null; // handle null/undefined

  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null; // ensure parts[1] exists

    const payload = JSON.parse(atob(parts[1])); // now TypeScript knows it's a string
    return payload;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;

  const exp = payload.exp * 1000; // convert seconds → ms
  return Date.now() > exp;
};

/**
 * Get token expiration date
 */
const decodeTokenExpiration = (token: string | null): Date | null => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
};

/**
 * Get access token expiration date
 */
export const getAccessTokenExpirationDate = (): Date | null =>
  decodeTokenExpiration(getAccessToken());

/**
 * Get refresh token expiration date
 */
export const getRefreshTokenExpirationDate = (): Date | null =>
  decodeTokenExpiration(getRefreshToken());

/**
 * Get remaining time in milliseconds for access token
 */
export const getAccessTokenRemainingTime = (): number => {
  const expDate = getAccessTokenExpirationDate();
  return expDate ? expDate.getTime() - Date.now() : 0;
};

/**
 * Get remaining time in milliseconds for refresh token
 */
export const getRefreshTokenRemainingTime = (): number => {
  const expDate = getRefreshTokenExpirationDate();
  return expDate ? expDate.getTime() - Date.now() : 0;
};

/**
 * Get remaining time in milliseconds for any token
 */
export const getTokenRemainingTime = (): number => {
  const expDate = decodeTokenExpiration(getAccessToken());
  return expDate ? expDate.getTime() - Date.now() : 0;
};
