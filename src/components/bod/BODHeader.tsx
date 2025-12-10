/** @format */

import React from "react";
import { Menu, LogOut } from "lucide-react";
import Logo from '../../assets/SeinGayHarLogo.png';

interface BODHeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  pageTitle: string;
  isSidebarCollapsed?: boolean;
}

const BODHeader: React.FC<BODHeaderProps> = ({
  onMenuToggle,
  onLogout,
  pageTitle,
  isSidebarCollapsed = false,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-blue-100">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section - Logo */}
        <div className="flex-shrink-0">
          <img 
            src={Logo} 
            alt="Sein Gay Har Logo" 
            className="h-16 w-auto"
          />
        </div>

        {/* Right Section - Logout and Menu Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-150"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-lg transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default BODHeader;