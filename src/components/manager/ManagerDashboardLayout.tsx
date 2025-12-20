/** @format */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ManagerHeader } from "./ManagerHeader";
import { ManagerSidebar } from "./ManagerSidebar";
import { ToastProvider } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export const ManagerDashboardLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    if (mobile) {
      setIsCollapsed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <ManagerHeader
          onMenuToggle={handleDrawerToggle}
          sidebarCollapsed={isCollapsed}
          isMobile={isMobile}
          onLogout={handleLogout}
        />

        <div className="flex">
          {/* Sidebar */}
          <ManagerSidebar
            isOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            currentPath={location.pathname}
            onNavigate={(path) => {
              navigate(path);
              if (isMobile) setMobileOpen(false);
            }}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />

          {/* Main Content - IMPROVED SPACING */}
          <main className={`
            flex-1 min-h-screen transition-all duration-300 
            ${isMobile ? '' : isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
          `}>
            {/* Adjusted top spacing - increased from pt-20 to pt-24 */}
            <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};