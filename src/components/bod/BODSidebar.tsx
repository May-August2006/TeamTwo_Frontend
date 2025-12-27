/** @format */

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  BarChart3,
  User,
  X,
  Home,
  DollarSign,
  Target,
  ChevronRight,
  Building,
  FileText,
} from "lucide-react";

interface BODSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const BODSidebar: React.FC<BODSidebarProps> = ({
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
      name: t('bodSidebar.menu.dashboard.name'),
      icon: <Home className="w-5 h-5" />,
      path: "/bod",
      description: t('bodSidebar.menu.dashboard.description')
    },
    {
      name: t('bodSidebar.menu.occupancy.name'),
      icon: <Building className="w-5 h-5" />,
      path: "/bod/occupancy",
      description: t('bodSidebar.menu.occupancy.description')
    },
    {
      name: t('bodSidebar.menu.performance.name'),
      icon: <Target className="w-5 h-5" />,
      path: "/bod/performance",
      description: t('bodSidebar.menu.performance.description')
    },
    {
      name: t('bodSidebar.menu.financialSummary.name'),
      icon: <DollarSign className="w-5 h-5" />,
      path: "/bod/financial-summary",
      description: t('bodSidebar.menu.financialSummary.description')
    },
    {
      name: t('bodSidebar.menu.reports.name'),
      icon: <FileText className="w-5 h-5" />,
      path: "/bod/reports",
      description: t('bodSidebar.menu.reports.description')
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/bod") {
      return currentPath === "/bod";
    }
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
          fixed top-16 left-0 bottom-0 z-30 bg-white shadow-lg transform transition-all duration-300 ease-in-out border-r border-blue-100
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo Section */}
        <div className={`flex items-center justify-between p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/30 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {t('bodSidebar.title')}
                </span>
                <p className="text-xs text-gray-600">
                  {t('bodSidebar.subtitle')}
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md mx-auto">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-150"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-150"
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
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center w-full p-3 text-left rounded-lg transition-all duration-200 group
                  ${
                    isActivePath(item.path)
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-gray-900 border-l-2 border-blue-600 font-medium shadow-sm"
                      : "text-gray-700 hover:bg-blue-50 hover:text-gray-900 hover:shadow-sm"
                  }
                  ${isCollapsed ? 'justify-center relative' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  isActivePath(item.path) 
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 shadow-sm' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                } ${isCollapsed ? '' : 'mr-3'}`}>
                  {React.cloneElement(item.icon, { 
                    className: `w-4 h-4 ${isActivePath(item.path) ? 'text-blue-700' : 'text-blue-600'}`
                  })}
                </div>
                {!isCollapsed && (
                  <div className="flex-1">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* User Info Section */}
          <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/30">
            {!isCollapsed && (
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm">
                    <User className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {t('bodSidebar.user.role')}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {t('bodSidebar.user.access')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="p-4 flex justify-center">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm">
                  <User className="w-4 h-4 text-gray-700" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-70 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default BODSidebar;