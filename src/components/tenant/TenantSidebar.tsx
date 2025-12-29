/** @format */
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Home,
  FileText,
  CreditCard,
  FileCheck,
  Wrench,
  User,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";

interface TenantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const TenantSidebar: React.FC<TenantSidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();

  // Memoize menuItems to prevent unnecessary re-renders
  const menuItems = useMemo(
    () => [
      {
        name: t("sidebarT.menu.dashboard"),
        icon: <Home className="w-5 h-5" />,
        path: "/tenant",
        translationKey: "dashboard",
      },
      {
        name: t("sidebarT.menu.invoices"),
        icon: <FileText className="w-5 h-5" />,
        path: "/tenant/invoices",
        translationKey: "invoices",
      },
      {
        name: t("sidebarT.menu.paymentHistory"),
        icon: <CreditCard className="w-5 h-5" />,
        path: "/tenant/payment-history",
        translationKey: "paymentHistory",
      },
      {
        name: t("sidebarT.menu.contract"),
        icon: <FileCheck className="w-5 h-5" />,
        path: "/tenant/contract",
        translationKey: "contract",
      },
      {
        name: t("sidebarT.menu.maintenance"),
        icon: <Wrench className="w-5 h-5" />,
        path: "/tenant/maintenance",
        translationKey: "maintenance",
      },
      {
        name: t("sidebarT.menu.announcements"),
        icon: <Bell className="w-5 h-5" />,
        path: "/tenant/announcements",
        translationKey: "announcements",
      },
      {
        name: t("sidebarT.menu.reminders"),
        icon: <Bell className="w-5 h-5" />,
        path: "/tenant/reminders",
        translationKey: "reminders",
      },
      {
        name: t("sidebarT.menu.lateFees"),
        icon: <FileCheck className="w-5 h-5" />,
        path: "/tenant/lateFees",
        translationKey: "lateFees",
      },
      {
        name: t("sidebarT.menu.availableUnits"),
        icon: <FileCheck className="w-5 h-5" />,
        path: "/tenant/availableUnits",
        translationKey: "availableUnits",
      },
    ],
    [t]
  );

  const isActivePath = (path: string) => {
    if (path === "/tenant") {
      return currentPath === "/tenant";
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
    if (window.innerWidth < 1024) {
      // Close on mobile after navigation
      onClose();
    }
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
        {/* Logo Section - Only show icon when collapsed */}
        <div
          className={`flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 ${
            isCollapsed ? "px-3" : "px-6"
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
                <Home className="w-6 h-6 text-white font-bold" />
              </div>
              <div>
                <span className="text-lg font-bold text-stone-900">
                  {t("sidebarT.title")}
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md mx-auto">
              <Home className="w-6 h-6 text-white font-bold" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-300 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav
            className={`flex-1 p-4 space-y-1 overflow-y-auto ${
              isCollapsed ? "px-2" : ""
            }`}
            aria-label="Main navigation"
          >
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                  ${
                    isActivePath(item.path)
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-medium"
                      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                  }
                  ${isCollapsed ? "justify-center relative" : ""}
                `}
                title={isCollapsed ? item.name : ""}
                aria-current={isActivePath(item.path) ? "page" : undefined}
              >
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-200 ${
                    isActivePath(item.path) ? "from-blue-100 to-blue-50" : ""
                  } ${isCollapsed ? "" : "mr-2"}`}
                >
                  {React.cloneElement(item.icon, {
                    className: `w-4 h-4 ${
                      isActivePath(item.path)
                        ? "text-blue-600 font-bold"
                        : "text-stone-600"
                    }`,
                  })}
                </div>
                {!isCollapsed && (
                  <span className="font-semibold">{item.name}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User Info Section */}
          <div className="border-t border-stone-200 bg-stone-50">
            {!isCollapsed && (
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-stone-200 to-stone-300 rounded-lg shadow-sm">
                    <User className="w-4 h-4 text-stone-700 font-bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {t("sidebarT.user.name")}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {t("sidebarT.user.description")}
                    </p>
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

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
};

export default TenantSidebar;
