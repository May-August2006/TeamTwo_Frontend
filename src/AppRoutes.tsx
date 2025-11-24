/** @format */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import Unauthorized from "./pages/Unauthorized";
import AccountantDashboard from "./pages/dashboard/AccountantDashboard";
import BODDashboard from "./pages/dashboard/BODDashboard";
import TenantDashboard from "./pages/dashboard/TenantDashboard";
import HomePage from "./pages/HomePage";

const AppRoutes: React.FC = () => {
  const { isAuthenticated, roles } = useAuth();

  const isAdmin = roles.includes("ROLE_ADMIN");
  const isManager = roles.includes("ROLE_MANAGER");
  const isAccountant = roles.includes("ROLE_ACCOUNTANT");
  const isBOD = roles.includes("ROLE_BOD");
  const isTenant = roles.includes("ROLE_TENANT");
  const isGuest = roles.includes("ROLE_GUEST");

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Redirect root to appropriate dashboard */}
      <Route
        path="/"
        element={
          isAdmin ? (
            <Navigate to="/admin" replace />
          ) : isManager ? (
            <Navigate to="/manager" replace />
          ) : isAccountant ? (
            <Navigate to="/accountant" replace />
          ) : isBOD ? (
            <Navigate to="/bod" replace />
          ) : isTenant ? (
            <Navigate to="/tenant" replace />
          ) : isGuest ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/user-dashboard" replace />
          )
        }
      />

      {/* Admin routes */}
      {isAdmin && <Route path="/admin/*" element={<AdminDashboard />} />}

      {/* Manager routes */}
      {isManager && <Route path="/manager/*" element={<ManagerDashboard />} />}

      {/* Accountant routes */}
      {isAccountant && (
        <Route path="/accountant/*" element={<AccountantDashboard />} />
      )}

      {/* BOD routes */}
      {isBOD && <Route path="/bod/*" element={<BODDashboard />} />}

      {/* Tenant routes */}
      {isTenant && <Route path="/tenant/*" element={<TenantDashboard />} />}

      {/* Tenant routes */}
      {isGuest && <Route path="/home/*" element={<HomePage />} />}

      {/* Auth routes */}
      <Route path="/logout" element={<Logout />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
