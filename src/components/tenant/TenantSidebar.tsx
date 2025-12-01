/** @format */

import React from "react";
import {
  Home,
  FileText,
  CreditCard,
  FileCheck,
  Wrench,
  User,
  X,
  Bell,
  Download,
} from "lucide-react";

interface TenantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const TenantSidebar: React.FC<TenantSidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
}) => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      path: "/tenant",
    },
    {
      name: "My Invoices",
      icon: <FileText className="w-5 h-5" />,
      path: "/tenant/invoices",
    },
    {
      name: "Payment History",
      icon: <CreditCard className="w-5 h-5" />,
      path: "/tenant/payment-history",
    },
    {
      name: "My Contract",
      icon: <FileCheck className="w-5 h-5" />,
      path: "/tenant/contract",
    },
    {
      name: "Maintenance",
      icon: <Wrench className="w-5 h-5" />,
      path: "/tenant/maintenance",
    },
    {
      name: "Announcements",
      icon: <Bell className="w-5 h-5" />,
      path: "/tenant/announcements",
    },
    {
      name: "Reminders",
      icon: <Bell className="w-5 h-5" />,
      path: "/tenant/reminders",
    },
    {
      name: "Late Fee",
      icon: <FileCheck className="w-5 h-5" />,
      path: "/tenant/lateFees",
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/tenant") {
      return currentPath === "/tenant";
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
  };

  return (
    <>
      {/* Fixed Sidebar - Higher z-index */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo Section - Added top padding for header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:pt-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">
                Sein Gay Har
              </span>
              <p className="text-xs text-gray-500">Tenant Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Adjusted height calculation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto h-[calc(100vh-12rem)]">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors
                ${
                  isActivePath(item.path)
                    ? "bg-green-50 text-green-700 border-l-2 border-green-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* User Info Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                John Tenant
              </p>
              <p className="text-xs text-gray-500 truncate">
                Retail Store A-102
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default TenantSidebar;
