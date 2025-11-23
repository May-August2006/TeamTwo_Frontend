/** @format */
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  saveAuthData,
  clearAuthData,
  getUserId,
  getUsername,
  getAccessToken,
  getRefreshToken,
  getRoles,
} from "../Auth.tsx";

interface AuthData {
  userId: number;
  username: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
}

interface AuthContextType {
  userId: number | null;
  username: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  login: (data: AuthData) => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const defaultAuth: AuthContextType = {
  userId: null,
  username: getUsername(),
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  roles: getRoles(),
  login: () => {},
  logout: () => {},
  loading: false,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType>(defaultAuth);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(getUserId());
  const [username, setUsername] = useState<string | null>(getUsername());
  const [accessToken, setAccessToken] = useState<string | null>(
    getAccessToken()
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    getRefreshToken()
  );
  const [roles, setRoles] = useState<string[]>(getRoles());
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!accessToken;

  useEffect(() => {
    // You can add checks here if you want to validate tokens etc.
    setLoading(false);
  }, []);

  const login = ({
    userId,
    username,
    accessToken,
    refreshToken,
    roles,
  }: AuthData) => {
    setUserId(userId);
    setUsername(username);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setRoles(roles);
    saveAuthData({ userId, username, accessToken, refreshToken, roles });
  };

  const logout = () => {
    setUserId(null);
    setUsername(null);
    setAccessToken(null);
    setRefreshToken(null);
    setRoles([]);
    clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        username,
        accessToken,
        refreshToken,
        roles,
        login,
        logout,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
