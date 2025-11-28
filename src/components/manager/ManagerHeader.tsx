/** @format */

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AlertsDropdown } from "../AlertsDropdown";
import { LogOut, User, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from '../../assets/SeinGayHarLogo.png';

interface ManagerHeaderProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  onLogout: () => void;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  onMenuToggle,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { username } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    onLogout();
    setUserMenuOpen(false);
  };

  const handleProfile = () => {
    // Handle profile navigation
    setUserMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-[#EBDCCB]">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section - Mobile Menu Button & Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-[#1F1F1F] hover:text-[#C8102E] hover:bg-[#EBDCCB] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={Logo} 
              alt="Sein Gay Har Logo" 
              className="h-12 w-auto"
            />
          </div>
        </div>

        {/* Center Section - Page Title */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-[#1F1F1F]">
            Manager Dashboard
          </h1>
        </div>

        {/* Right Section - Alerts, User Menu, and Logout */}
        <div className="flex items-center space-x-3">
          {/* Alerts Dropdown */}
          <div className="hidden sm:block">
            <AlertsDropdown />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 text-[#1F1F1F] hover:text-[#C8102E] hover:bg-[#EBDCCB] rounded-lg transition-colors"
            >
              <div className="p-1.5 bg-gradient-to-br from-[#EBDCCB] to-[#FFFFFF] rounded-lg shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:block text-sm font-medium">
                {username || "Manager"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-[#EBDCCB] py-2 z-50">
                <button
                  onClick={handleProfile}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#1F1F1F] hover:bg-[#EBDCCB] transition-colors"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#C8102E] hover:bg-[#EBDCCB] transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="hidden md:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-[#C8102E] hover:text-[#C8102E] hover:bg-[#EBDCCB] rounded-lg transition-colors duration-150 border border-[#C8102E]"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('header.logout')}</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile dropdown */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};