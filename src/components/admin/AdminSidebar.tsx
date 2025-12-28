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
  Building,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set(["Master Data Management"])
  );

  const menuItems = [
    {
      name: t('adminsidebar.dashboard'),
      icon: <Home className="w-5 h-5" />,
      path: "/admin",
    },
    {
      name: t('adminsidebar.masterData'),
      icon: <Settings className="w-5 h-5" />,
      children: [
        {
          name: t('adminsidebar.branchManagement'),
          path: "/admin/branches",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          name: t('adminsidebar.buildingManagement'),
          path: "/admin/buildings",
          icon: <Building className="w-4 h-4" />,
        },
        {
          name: t('adminsidebar.levelManagement'),
          path: "/admin/levels",
          icon: <Layers className="w-4 h-4" />,
        },
        {
          name: t('adminsidebar.unitManagement'),
          path: "/admin/units",
          icon: <Package className="w-4 h-4" />,
        },
      ],
    },
    {
      name: t('adminsidebar.utilityTypeManagement'),
      path: "/admin/utility-types",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      name: t('adminsidebar.users'),
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
    // Close the dropdown after navigation when sidebar is collapsed
    if (isCollapsed) {
      const newOpenSections = new Set(openSections);
      newOpenSections.delete(t('sidebar.masterData'));
      setOpenSections(newOpenSections);
    }
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
        <div className={`flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
                <Building2 className="w-6 h-6 text-white font-bold" />
              </div>
              <div>
                <span className="text-lg font-bold text-stone-900">
                  Admin Dashboard
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
              <div key={index}>
                {item.children ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`flex items-center justify-between w-full p-3 text-left rounded-lg text-stone-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 group ${
                        isCollapsed ? 'justify-center relative' : ''
                      }`}
                      title={isCollapsed ? item.name : ''}
                    >
                      <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-200 ${
                          isActivePath(item.path!) ? 'from-blue-100 to-blue-50' : ''
                        }`}>
                          {React.cloneElement(item.icon, { 
                            className: `w-4 h-4 ${isActivePath(item.path!) ? 'text-blue-600 font-bold' : 'text-stone-600'}`
                          })}
                        </div>
                        {!isCollapsed && <span className="font-semibold">{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        openSections.has(item.name) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )
                      )}
                    </button>

                    {/* Dropdown for collapsed sidebar */}
                    {isCollapsed && openSections.has(item.name) && (
                      <div className="absolute left-20 ml-2 z-40 bg-white rounded-lg shadow-xl border border-stone-200 py-2 min-w-48">
                        {item.children.map((child, childIndex) => (
                          <button
                            key={childIndex}
                            onClick={() => handleNavigation(child.path)}
                            className={`
                              flex items-center space-x-3 w-full px-4 py-3 text-left transition-colors duration-150
                              ${
                                isActivePath(child.path)
                                  ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-medium"
                                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                              }
                            `}
                          >
                            <div className={`p-1.5 rounded-md ${
                              isActivePath(child.path) ? 'bg-blue-100' : 'bg-stone-100'
                            }`}>
                              {React.cloneElement(child.icon, { 
                                className: `w-4 h-4 ${isActivePath(child.path) ? 'text-blue-600 font-bold' : 'text-stone-600'}`
                              })}
                            </div>
                            <span className="text-sm font-medium">{child.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Regular expanded sidebar children */}
                    {!isCollapsed && openSections.has(item.name) && (
                      <div className="ml-4 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <button
                            key={childIndex}
                            onClick={() => handleNavigation(child.path)}
                            className={`
                              flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                              ${
                                isActivePath(child.path)
                                  ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-medium"
                                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                              }
                            `}
                          >
                            <div className={`p-1.5 rounded-md group-hover:bg-white transition-colors duration-150 ${
                              isActivePath(child.path) ? 'bg-white' : 'bg-stone-100'
                            }`}>
                              {React.cloneElement(child.icon, { 
                                className: `w-4 h-4 ${isActivePath(child.path) ? 'text-blue-600 font-bold' : 'text-stone-600'}`
                              })}
                            </div>
                            <span className="text-sm font-medium">{child.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.path!)}
                    className={`
                      flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                      ${
                        isActivePath(item.path!)
                          ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-medium"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
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
                )}
              </div>
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
                      {t('sidebar.adminUser')}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{t('sidebar.administrator')}</p>
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
          className="fixed inset-0 bg-stone-900 bg-opacity-70 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default AdminSidebar;