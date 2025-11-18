/** @format */

import React from "react";
import { Menu, LogOut } from "lucide-react";

interface BODHeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  pageTitle: string;
}

const BODHeader: React.FC<BODHeaderProps> = ({
  onMenuToggle,
  onLogout,
  pageTitle,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-gray-200 lg:left-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Menu Toggle and Title */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="lg:hidden mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          {/* Right Section - Logout */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BODHeader;
