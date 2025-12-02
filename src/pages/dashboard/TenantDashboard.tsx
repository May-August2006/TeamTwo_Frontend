/** @format */

import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import TenantSidebar from "../../components/tenant/TenantSidebar";
import TenantHeader from "../../components/tenant/TenantHeader";
import TenantHome from "../../components/tenant/TenantHome";
import MyInvoices from "../../components/tenant/MyInvoices";
import PaymentHistory from "../../components/tenant/PaymentHistory";
import MyContract from "../../components/tenant/MyContract";
import MaintenanceRequests from "../../components/tenant/MaintenanceRequests";
import { TenantAnnouncements } from "../../components/tenant/TenantAnnouncements";
import MyReminders from "../../components/tenant/MyReminders";
import MyLateFee from "../../components/tenant/MyLateFees";
import MyLateFees from "../../components/tenant/MyLateFees";

const TenantDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/logout");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation for mobile
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getPageTitle = () => {
    if (location.pathname === "/tenant") return "Tenant Dashboard";
    if (location.pathname.includes("invoices")) return "My Invoices";
    if (location.pathname.includes("payment-history")) return "Payment History";
    if (location.pathname.includes("contract")) return "My Contract";
    if (location.pathname.includes("announcements")) return "Announcements";
    if (location.pathname.includes("reminders")) return "Reminders";
    if (location.pathname.includes("maintenance"))
      return "Maintenance Requests";
    return "Tenant Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <TenantHeader
        onMenuToggle={() => setSidebarOpen(true)}
        onLogout={handleLogout}
        pageTitle={getPageTitle()}
      />

      {/* Fixed Sidebar */}
      <TenantSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area - Adjusted for fixed header and sidebar */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <Routes>
                <Route path="/" element={<TenantHome />} />
                <Route path="/invoices" element={<MyInvoices />} />
                <Route path="/payment-history" element={<PaymentHistory />} />
                <Route path="/contract" element={<MyContract />} />
                <Route
                  path="/announcements"
                  element={<TenantAnnouncements />}
                />
                <Route path="/reminders" element={<MyReminders />} />
                <Route path="/maintenance" element={<MaintenanceRequests />} />
                <Route path="/lateFees" element={<MyLateFees />} />
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

export default TenantDashboard;