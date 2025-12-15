/** @format */

import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import BODSidebar from "../../components/bod/BODSidebar";
import BODHeader from "../../components/bod/BODHeader";
import BODHome from "../../components/bod/BODHome";
import FinancialSummary from "../../components/bod/FinancialSummary";
import PerformanceMetrics from "../../components/bod/PerformanceMetrics";
import OccupancyLease from "../../components/bod/OccupancyLease";
import Reports from "../../components/bod/Reports";

const BODDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    console.log("Logging out...");
    navigate("/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Sidebar */}
      <BODSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Header */}
      <BODHeader
        onMenuToggle={() => setSidebarOpen(true)}
        onLogout={handleLogout}
        pageTitle={""}
        isSidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<BODHome />} />
              <Route path="/occupancy" element={<OccupancyLease />} />
              <Route path="/performance" element={<PerformanceMetrics />} />
              <Route path="/financial-summary" element={<FinancialSummary />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-70 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default BODDashboard;