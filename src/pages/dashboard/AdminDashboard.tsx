/** @format */

import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminHome from "../../components/admin/AdminHome";
import BranchManagement from "../BranchManagement";
import BuildingManagement from "../BuildingManagement";
import LevelManagement from "../LevelManagement";
import UserManagement from "../../components/admin/UserManagement";
import { useTranslation } from "react-i18next";
import UtilityTypeManagement from "../../components/admin/UtilityTypeManagement";
import UnitManagement from "../UnitManagement";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    navigate("/logout");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation for mobile
  };

  const handleToggleCollapse = () => {
    if (!isMobile) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  const renderContent = () => {
    if (location.pathname === "/admin") return <AdminHome onNavigate={handleNavigate} />;
    if (location.pathname.includes("branches")) return <BranchManagement />;
    if (location.pathname.includes("buildings")) return <BuildingManagement />;
    if (location.pathname.includes("levels")) return <LevelManagement />;
    if (location.pathname.includes("utility-types")) return <UtilityTypeManagement />;
    if (location.pathname.includes("users")) return <UserManagement />;
    if (location.pathname.includes("units")) return <UnitManagement />;
    return <AdminHome onNavigate={handleNavigate} />;
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <style>{`
        body { 
          margin:0; 
          padding:0; 
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif; 
          -webkit-font-smoothing:antialiased; 
          -moz-osx-font-smoothing:grayscale; 
          background-color:#fafaf9; 
        }
        * { box-sizing:border-box; }
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        isCollapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <main
        className={`flex-grow transition-all duration-300 w-full
          ${isMobile ? "ml-0" : sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <AdminHeader
          onLogout={handleLogout}
          pageTitle={getPageTitle()}
          onMenuClick={toggleSidebar}
          showMenuButton={isMobile}
        />
        <div className="h-16"></div>

        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;