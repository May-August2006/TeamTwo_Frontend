/** @format */

import React from "react";
import {
  Building2,
  Layers,
  DollarSign,
  Users,
  User,
  Settings,
  Home,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set(["Master Data Management"])
  );

  const menuItems = [
    {
      name: t('sidebar.dashboard'),
      icon: <Home className="w-5 h-5" />,
      path: "/admin",
    },
    {
      name: t('sidebar.masterData'),
      icon: <Settings className="w-5 h-5" />,
      children: [
        {
          name: t('sidebar.branchManagement'),
          path: "/admin/branches",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          name: t('sidebar.buildingManagement'),
          path: "/admin/buildings",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          name: t('sidebar.levelManagement'),
          path: "/admin/levels",
          icon: <Layers className="w-4 h-4" />,
        },
        {
          name: t('sidebar.roomManagement'),
          path: "/admin/rooms",
          icon: <Layers className="w-4 h-4" />,
        },
      ],
    },
    {
          name: t('sidebar.utilityTypeManagement'),
          path: "/admin/utility-types",
          icon: <Zap className="w-4 h-4" />,
        },
    {
      name: t('sidebar.billing'),
      icon: <DollarSign className="w-5 h-5" />,
      path: "/admin/billing",
    },
    {
      name: t('sidebar.users'),
      icon: <Users className="w-5 h-5" />,
      path: "/admin/users",
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
  };

  const toggleSection = (sectionName: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionName)) {
      newOpenSections.delete(sectionName);
    } else {
      newOpenSections.add(sectionName);
    }
    setOpenSections(newOpenSections);
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
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">
                Sein Gay Har
              </span>
              <p className="text-xs text-gray-500">{t('admin.dashboard')}</p>
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
            <div key={index}>
              {item.children ? (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleSection(item.name)}
                    className="flex items-center justify-between w-full p-3 text-left rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {openSections.has(item.name) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {openSections.has(item.name) && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child, childIndex) => (
                        <button
                          key={childIndex}
                          onClick={() => handleNavigation(child.path)}
                          className={`
                            flex items-center space-x-3 w-full p-2 text-left rounded-lg transition-colors
                            ${
                              isActivePath(child.path)
                                ? "bg-blue-50 text-blue-700 border-l-2 border-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          {child.icon}
                          <span className="text-sm">{child.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleNavigation(item.path!)}
                  className={`
                    flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors
                    ${
                      isActivePath(item.path!)
                        ? "bg-blue-50 text-blue-700 border-l-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </button>
              )}
            </div>
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
                Admin User
              </p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
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

export default AdminSidebar;