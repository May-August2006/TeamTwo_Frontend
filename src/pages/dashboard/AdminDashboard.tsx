// AdminDashboard.tsx - Updated
/** @format */

import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminHome from "../../components/admin/AdminHome";
import BranchManagement from "../BranchManagement";
import BuildingManagement from "../BuildingManagement";
import LevelManagement from "../LevelManagement";
import AdminBillingConfiguration from "../../components/admin/BillingConfiguration";
import UserManagement from "../../components/admin/UserManagement";
import RoomManagement from "../RoomManagement";
import { useTranslation } from "react-i18next";
import UtilityTypeManagement from "../../components/admin/UtilityTypeManagement";

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    navigate("/logout");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation for mobile
  };

  const getPageTitle = () => {
    if (location.pathname === "/admin") return t('admin.dashboard');
    if (location.pathname.includes("branches")) return t('sidebar.branchManagement');
    if (location.pathname.includes("buildings")) return t('sidebar.buildingManagement');
    if (location.pathname.includes("levels")) return t('sidebar.levelManagement');
    if (location.pathname.includes("utilityTypeManagement")) return t('sidebar.utilityTypeManagement');
    if (location.pathname.includes("billing")) return t('sidebar.billing');
    if (location.pathname.includes("users")) return t('sidebar.users');
    if (location.pathname.includes("rooms")) return t('sidebar.roomManagement');
    return t('admin.dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar - Increased z-index */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
      />

      {/* Fixed Header - Lower z-index */}
      <AdminHeader
        onMenuToggle={() => setSidebarOpen(true)}
        onLogout={handleLogout}
        pageTitle={getPageTitle()}
      />

      {/* Main Content Area - Adjusted for fixed header and sidebar */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('admin.operations')}
              </p>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <Routes>
                <Route
                  path="/"
                  element={<AdminHome onNavigate={handleNavigate} />}
                />
                <Route path="/branches" element={<BranchManagement />} />
                <Route path="/buildings" element={<BuildingManagement />} />
                <Route path="/levels" element={<LevelManagement />} />
                <Route path="utility-types" element={<UtilityTypeManagement />} />
                 <Route path="/billing" element={<AdminBillingConfiguration />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/rooms" element={<RoomManagement />} />
              </Routes>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;