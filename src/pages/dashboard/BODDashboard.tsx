/** @format */

import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import BODSidebar from "../../components/bod/BODSidebar";
import BODHeader from "../../components/bod/BODHeader";
import BODHome from "../../components/bod/BODHome";
import FinancialSummary from "../../components/bod/FinancialSummary";
import RevenueAnalysis from "../../components/bod/RevenueAnalysis";
import PerformanceMetrics from "../../components/bod/PerformanceMetrics";

const BODDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/logout");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation for mobile
  };

  const getPageTitle = () => {
    if (location.pathname === "/bod")
      return "Board of Directors Dashboard";
    if (location.pathname.includes("financial-summary"))
      return "Financial Summary";
    if (location.pathname.includes("revenue-analysis"))
      return "Revenue Analysis";
    if (location.pathname.includes("performance-metrics"))
      return "Performance Metrics";
    return "Board of Directors Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <BODSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
      />

      {/* Fixed Header */}
      <BODHeader
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
                Strategic overview and financial performance insights
              </p>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <Routes>
                <Route path="/" element={<BODHome />} />
                <Route
                  path="/financial-summary"
                  element={<FinancialSummary />}
                />
                <Route path="/revenue-analysis" element={<RevenueAnalysis />} />
                <Route
                  path="/performance-metrics"
                  element={<PerformanceMetrics />}
                />
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

export default BODDashboard;
