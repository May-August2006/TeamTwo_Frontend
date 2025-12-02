/** @format */

import React from "react";
import {
  Building2,
  BarChart3,
  User,
  X,
  Home,
  DollarSign,
  Target,
  ChevronRight,
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
  const menuItems = [
    {
      name: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      path: "/bod",
    },
    {
      name: "Financial Summary",
      icon: <DollarSign className="w-5 h-5" />,
      path: "/bod/financial-summary",
    },
    {
      name: "Revenue Analysis",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/bod/revenue-analysis",
    },
    {
      name: "Performance Metrics",
      icon: <Target className="w-5 h-5" />,
      path: "/bod/performance-metrics",
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
      {/* Fixed Sidebar - Updated styles to match Admin */}
      <div
        className={`
          fixed top-16 left-0 bottom-0 z-30 bg-white shadow-xl transform transition-all duration-300 ease-in-out border-r border-stone-200
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo Section - Updated to match Admin */}
        <div className={`flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
                <Building2 className="w-6 h-6 text-white font-bold" />
              </div>
              <div>
                <span className="text-lg font-bold text-stone-900">
                  Board of Directors
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md mx-auto">
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

        {/* Navigation - Updated colors */}
        <div className="flex flex-col h-full">
          <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : ''}`}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                  ${
                    isActivePath(item.path)
                      ? "bg-red-50 text-red-700 border-l-2 border-red-600 font-medium"
                      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                  }
                  ${isCollapsed ? 'justify-center relative' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm group-hover:from-red-50 group-hover:to-red-100 transition-all duration-200 ${
                  isActivePath(item.path) ? 'from-red-100 to-red-50' : ''
                } ${isCollapsed ? '' : 'mr-2'}`}>
                  {React.cloneElement(item.icon, { 
                    className: `w-4 h-4 ${isActivePath(item.path) ? 'text-red-600 font-bold' : 'text-stone-600'}`
                  })}
                </div>
                {!isCollapsed && <span className="font-semibold">{item.name}</span>}
              </button>
            ))}
          </nav>

          {/* User Info Section - Updated colors */}
          <div className="border-t border-stone-200 bg-stone-50">
            {!isCollapsed && (
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-stone-200 to-stone-300 rounded-lg shadow-sm">
                    <User className="w-4 h-4 text-stone-700 font-bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      Board Member
                    </p>
                    <p className="text-xs text-stone-500 truncate">Board of Directors</p>
                  </div>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="p-4 flex justify-center">
                <div className="p-2 bg-gradient-to-br from-stone-200 to-stone-300 rounded-lg shadow-sm">
                  <User className="w-4 h-4 text-stone-700 font-bold" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay - Updated color */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-900 bg-opacity-70 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default BODSidebar;