/** @format */

import React from "react";
import {
  Home,
  Users,
  Calendar,
  Megaphone,
  FileText,
  Wrench,
  BarChart3,
  X,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface ManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();

  const menuItems = [
    {
      name: t('sidebar.overview', 'Overview'),
      icon: <Home className="w-5 h-5" />,
      path: "/manager/overview",
    },
    {
      name: t('sidebar.tenantManagement', 'Tenant Management'),
      icon: <Users className="w-5 h-5" />,
      path: "/manager/tenants",
    },
    {
      name: t('sidebar.appointments', 'Appointments'),
      icon: <Calendar className="w-5 h-5" />,
      path: "/manager/appointments",
    },
    {
      name: t('sidebar.announcements', 'Announcements'),
      icon: <Megaphone className="w-5 h-5" />,
      path: "/manager/announcements",
    },
    {
      name: t('sidebar.leaseManagement', 'Lease Management'),
      icon: <FileText className="w-5 h-5" />,
      path: "/manager/leases",
    },
    {
      name: t('sidebar.maintenance', 'Maintenance'),
      icon: <Wrench className="w-5 h-5" />,
      path: "/manager/maintenance",
    },
    {
      name: t('sidebar.reports', 'Reports'),
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/manager/reports",
    },
  ];

  const isActivePath = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <div
        className={`
          fixed top-16 left-0 bottom-0 z-30 bg-white shadow-xl transform transition-all duration-300 ease-in-out border-r border-stone-200
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo Section */}
        <div className={`flex items-center justify-between p-4 border-b border-stone-200 bg-gradient-to-r from-blue-50 to-white ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
                <Building2 className="w-6 h-6 text-white font-bold" />
              </div>
              <div>
                <span className="text-lg font-bold text-stone-900">
                  {t('sidebar.managerPortal', 'Manager Portal')}
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md mx-auto">
              <Building2 className="w-6 h-6 text-white font-bold" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : ''}`}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path!)}
                className={`
                  flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                  ${
                    isActivePath(item.path!)
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-2 border-blue-600 font-medium"
                      : "text-stone-700 hover:bg-gradient-to-r from-blue-50/50 to-blue-50 hover:text-stone-900"
                  }
                  ${isCollapsed ? 'justify-center relative' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-200 ${
                  isActivePath(item.path!) ? 'from-blue-100 to-blue-50' : ''
                } ${isCollapsed ? '' : 'mr-2'}`}>
                  {React.cloneElement(item.icon, { 
                    className: `w-4 h-4 ${isActivePath(item.path!) ? 'text-blue-600 font-bold' : 'text-stone-600'}`
                  })}
                </div>
                {!isCollapsed && <span className="font-semibold">{item.name}</span>}
              </button>
            ))}
          </nav>

          {/* User Info Section */}
          <div className="border-t border-stone-200 bg-gradient-to-r from-blue-50 to-white">
            {!isCollapsed && (
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-white rounded-lg shadow-sm">
                    <Users className="w-4 h-4 text-blue-600 font-bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {t('common.managerUser', 'Manager User')}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {t('common.manager', 'Manager')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="p-4 flex justify-center">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-white rounded-lg shadow-sm">
                  <Users className="w-4 h-4 text-blue-600 font-bold" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-900 bg-opacity-70 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};