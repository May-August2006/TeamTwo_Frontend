/** @format */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ManagerHeader } from "./ManagerHeader";
import { ManagerSidebar } from "./ManagerSidebar";
import { ToastProvider } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export const ManagerDashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    } else {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-stone-50 flex">

        {/* Sidebar */}
        <ManagerSidebar
          isOpen={mobileOpen}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          currentPath={location.pathname}
          onNavigate={(path) => {
            navigate(path);
            if (isMobile) setMobileOpen(false);
          }}
        />

        {/* Main Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300
          ${isMobile ? "" : isCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
        >
          <ManagerHeader
            onMenuToggle={handleDrawerToggle}
            sidebarCollapsed={isCollapsed}
            isMobile={isMobile}
            onLogout={handleLogout}
          />

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 mt-16 overflow-auto">
            {children}
          </main>
        </div>

        {isMobile && mobileOpen && (
          <div
            className="fixed inset-0 bg-stone-900 bg-opacity-70 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          ></div>
        )}
      </div>
    </ToastProvider>
  );
};