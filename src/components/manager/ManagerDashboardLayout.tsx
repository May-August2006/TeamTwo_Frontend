/** @format */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "./ManagerHeader";
import { DashboardSidebar } from "./ManagerSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const ManagerDashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const navigate = useNavigate();

  // ✅ Resize handler (keeps sidebar responsive)
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // ✅ Keep states consistent when switching modes
  useEffect(() => {
    if (isMobile) {
      // On mobile: sidebar should not be collapsed
      setIsCollapsed(false);
    } else {
      // On desktop: ensure drawer is closed
      setMobileOpen(false);
    }
  }, [isMobile]);

  // ✅ Toggle sidebar — different logic for mobile vs desktop
  const handleDrawerToggle = () => {
    if (isClosing) return;
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  // ✅ Navigation handler
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) handleDrawerClose();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        onDrawerClose={handleDrawerClose}
        onDrawerTransitionEnd={handleDrawerTransitionEnd}
        onToggleSidebar={handleDrawerToggle}
        onNavigation={handleNavigation}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${isMobile ? "" : isCollapsed ? "lg:ml-24" : "lg:ml-80"}
        `}
      >
        {/* Header */}
        <DashboardHeader
          onMenuToggle={handleDrawerToggle}
          sidebarCollapsed={isCollapsed}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 mt-16 lg:mt-0 overflow-auto">
          <div className="w-full max-w-full">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={handleDrawerClose}
        ></div>
      )}
    </div>
  );
};
