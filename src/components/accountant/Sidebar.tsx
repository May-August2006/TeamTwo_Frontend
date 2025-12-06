import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
  CreditCard, 
  Receipt,
  FileText,
  BarChart3,
  X,
  ChevronRight,
  ChevronDown,
  Zap,
  Tag,
  Calculator,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set()
  );

  const menuItems = [
    {
      name: "Overview",
      icon: <Home className="w-5 h-5" />,
      value: "overview",
    },
    {
      name: "Payment",
      icon: <CreditCard className="w-5 h-5" />,
      value: "payment",
    },
    {
      name: "Invoices & Receipts",
      icon: <Receipt className="w-5 h-5" />,
      value: "invoices",
    },
    {
      name: "Reports",
      icon: <BarChart3 className="w-5 h-5" />,
      value: "reports",
    },
    {
      name: "Audit Log",
      icon: <FileText className="w-5 h-5" />,
      value: "audit",
    },
    {
      name: "Billing & Utilities",
      icon: <DollarSign className="w-5 h-5" />,
      children: [

        {
          name: "Utility Calculation",
          value: "usage-entry",
          icon: <Calculator className="w-4 h-4" />,
        },
        {
          name: "Bulk Readings",
          value: "bulk-readings",
          icon: <FileText className="w-4 h-4" />,
        },
        {
          name: "Utility Expenses",
          value: "building-invoices",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          name: "Payment Management",
          value: "payments",
          icon: <CreditCard className="w-4 h-4" />,
        },
        {
          name: "Invoice Management",
          value: "invoices-management",
          icon: <Receipt className="w-4 h-4" />,
        },
        {
          name: "Late Fee",
          value: "late-fee",
          icon: <Tag className="w-4 h-4" />,
        },
        {
          name: "Overdue & Outstanding",
          value: "overdue-outstanding",
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
  ];

  const isActive = (value: string) => activeSection === value;

  const handleNavigation = (value: string) => {
    onSectionChange(value);
    if (isCollapsed) {
      const newOpenSections = new Set(openSections);
      newOpenSections.delete("Billing & Utilities");
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
        {/* Logo Section */}
        <div className={`flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-stone-900">
                  Accountant Dashboard
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
                      className={`flex items-center justify-between w-full p-3 text-left rounded-lg text-stone-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 group ${
                        isCollapsed ? 'justify-center relative' : ''
                      }`}
                      title={isCollapsed ? item.name : ''}
                    >
                      <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm group-hover:from-red-50 group-hover:to-red-100 transition-all duration-200 ${
                          item.children.some(child => isActive(child.value)) ? 'from-red-100 to-red-50' : ''
                        }`}>
                          {React.cloneElement(item.icon, { 
                            className: `w-4 h-4 ${item.children.some(child => isActive(child.value)) ? 'text-red-600 font-bold' : 'text-stone-600'}`
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
                            onClick={() => handleNavigation(child.value)}
                            className={`
                              flex items-center space-x-3 w-full px-4 py-3 text-left transition-colors duration-150
                              ${
                                isActive(child.value)
                                  ? "bg-red-50 text-red-700 border-l-2 border-red-600 font-medium"
                                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                              }
                            `}
                          >
                            <div className={`p-1.5 rounded-md ${
                              isActive(child.value) ? 'bg-red-100' : 'bg-stone-100'
                            }`}>
                              {React.cloneElement(child.icon, { 
                                className: `w-4 h-4 ${isActive(child.value) ? 'text-red-600 font-bold' : 'text-stone-600'}`
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
                            onClick={() => handleNavigation(child.value)}
                            className={`
                              flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                              ${
                                isActive(child.value)
                                  ? "bg-red-50 text-red-700 border-l-2 border-red-600 font-medium"
                                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                              }
                            `}
                          >
                            <div className={`p-1.5 rounded-md group-hover:bg-white transition-colors duration-150 ${
                              isActive(child.value) ? 'bg-white' : 'bg-stone-100'
                            }`}>
                              {React.cloneElement(child.icon, { 
                                className: `w-4 h-4 ${isActive(child.value) ? 'text-red-600 font-bold' : 'text-stone-600'}`
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
                    onClick={() => handleNavigation(item.value!)}
                    className={`
                      flex items-center space-x-3 w-full p-3 text-left rounded-lg transition-colors duration-150 group
                      ${
                        isActive(item.value!)
                          ? "bg-red-50 text-red-700 border-l-2 border-red-600 font-medium"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      }
                      ${isCollapsed ? 'justify-center relative' : ''}
                    `}
                    title={isCollapsed ? item.name : ''}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm group-hover:from-red-50 group-hover:to-red-100 transition-all duration-200 ${
                      isActive(item.value!) ? 'from-red-100 to-red-50' : ''
                    } ${isCollapsed ? '' : 'mr-2'}`}>
                      {React.cloneElement(item.icon, { 
                        className: `w-4 h-4 ${isActive(item.value!) ? 'text-red-600 font-bold' : 'text-stone-600'}`
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
                    <Users className="w-4 h-4 text-stone-700 font-bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      Accountant User
                    </p>
                    <p className="text-xs text-stone-500 truncate">Accountant</p>
                  </div>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="p-4 flex justify-center">
                <div className="p-2 bg-gradient-to-br from-stone-200 to-stone-300 rounded-lg shadow-sm">
                  <Users className="w-4 h-4 text-stone-700 font-bold" />
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

export default Sidebar;