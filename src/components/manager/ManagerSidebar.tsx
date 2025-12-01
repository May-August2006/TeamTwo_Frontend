/** @format */

import React from "react";

interface DashboardSidebarProps {
  mobileOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  onDrawerClose: () => void;
  onDrawerTransitionEnd: () => void;
  onToggleSidebar: () => void;
  onNavigation: (path: string) => void;
}

const menuItems = [
  { value: "overview", label: "Overview", path: "/manager/overview" },
  { value: "tenants", label: "Tenant Management", path: "/manager/tenants" },
  {
    value: "appointments",
    label: "Appointments",
    path: "/manager/appointments",
  },
  {
    value: "announcements",
    label: "Announcements",
    path: "/manager/announcements",
  },
  { value: "leases", label: "Lease Management", path: "/manager/leases" },
  { value: "billing", label: "Billing & Utilities", path: "/manager/billing" },
  { value: "payments", label: "Payments", path: "/manager/payments" },
  { value: "maintenance", label: "Maintenance", path: "/manager/maintenance" },
  { value: "reports", label: "Reports", path: "/manager/reports" },
  { value: "invoices", label: "Invoices", path: "/manager/invoices" },
  { value: "lateFee", label: "LateFee", path: "/manager/lateFee" },
  {
    value: "overdueOrOustanding",
    label: "OverdueOrOustanding",
    path: "/manager/overdueOrOustanding",
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  mobileOpen,
  isCollapsed,
  isMobile,
  onDrawerClose,
  onDrawerTransitionEnd,
  onToggleSidebar,
  onNavigation,
}) => {
  const currentPath = window.location.pathname;
  const currentTab = currentPath.split("/").pop() || "overview";

  const drawerContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 min-h-[80px]">
        {!isCollapsed ? (
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              SG
            </div>
            <div>
              <div className="font-bold text-blue-600 text-lg leading-tight">
                Sein Gay Har
              </div>
              <div className="text-gray-600 text-sm font-medium">
                Mall Management
              </div>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto">
            SG
          </div>
        )}

        {/* Collapse Button (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggleSidebar}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onNavigation(item.path)}
              className={`group w-full flex items-center rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              } ${isCollapsed ? "justify-center px-3 py-4" : "px-4 py-4"}`}
            >
              <span
                className={`transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-blue-600"
                }`}
              >
                {/* you can keep icons here if needed */}● ●
              </span>

              {!isCollapsed && (
                <span
                  className={`ml-4 text-base font-medium transition-colors ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </span>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* ✅ Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onDrawerClose}
        />
      )}

      {/* ✅ Main sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        ${isMobile ? "w-64" : isCollapsed ? "lg:w-24" : "lg:w-80"}
        ${
          isMobile
            ? mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        }
        bg-white border-r border-gray-200 flex flex-col shadow-xl`}
        onTransitionEnd={onDrawerTransitionEnd}
      >
        {drawerContent}
      </aside>
    </>
  );
};
