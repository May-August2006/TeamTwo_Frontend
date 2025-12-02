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
import { useTranslation } from "react-i18next";
import UtilityTypeManagement from "../../components/admin/UtilityTypeManagement";
import UnitManagement from "../UnitManagement";

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getPageTitle = () => {
    if (location.pathname === "/admin") return t('admin.dashboard');
    if (location.pathname.includes("branches")) return t('sidebar.branchManagement');
    if (location.pathname.includes("buildings")) return t('sidebar.buildingManagement');
    if (location.pathname.includes("levels")) return t('sidebar.levelManagement');
    if (location.pathname.includes("utility-types")) return t('sidebar.utilityTypeManagement');
    if (location.pathname.includes("billing")) return t('sidebar.billing');
    if (location.pathname.includes("users")) return t('sidebar.users');
    if (location.pathname.includes("units")) return t('sidebar.unitManagement');
    return t('admin.dashboard');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Fixed Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Fixed Header */}
      <AdminHeader
        onMenuToggle={() => setSidebarOpen(true)}
        onLogout={handleLogout}
        pageTitle={getPageTitle()}
      />

      {/* Main Content Area */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
              <Routes>
                <Route
                  path="/"
                  element={<AdminHome onNavigate={handleNavigate} />}
                />
                <Route path="/branches" element={<BranchManagement />} />
                <Route path="/buildings" element={<BuildingManagement />} />
                <Route path="/levels" element={<LevelManagement />} />
                <Route path="/utility-types" element={<UtilityTypeManagement />} />
                <Route path="/billing" element={<AdminBillingConfiguration />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/units" element={<UnitManagement />} />
              </Routes>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900 bg-opacity-70 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;