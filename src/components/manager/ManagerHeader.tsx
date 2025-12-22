/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AlertsDropdown } from "../AlertsDropdown";
import { LogOut, User, Menu, Settings, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "../../assets/SeinGayHarLogo.png";
import ChangePasswordButton from "../ChangePasswordButton";
import { LanguageSwitcher } from "../LanguageSwitcher";

interface ManagerHeaderProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  onLogout: () => void;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  onMenuToggle,
  isMobile,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { username, roles } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    setUserMenuOpen(false);
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    console.log("Navigate to profile");
  };

  const handleSettings = () => {
    setUserMenuOpen(false);
    console.log("Navigate to settings");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-stone-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: Menu toggle (mobile only) + Logo */}
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-150"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <img src={Logo} alt="Sein Gay Har Logo" className="h-14 w-auto" />
        </div>

        {/* Center Section - Title (Optional) */}
        <div className="flex-grow text-center hidden lg:block">
          {/* Optional: Add title or breadcrumbs here */}
        </div>

        {/* Right: Language + Alerts + User Menu */}
        <div className="flex items-center space-x-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Alerts */}
          <div className="hidden sm:block">
            <AlertsDropdown />
          </div>

          {/* Username Display */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-800 truncate max-w-[150px]">
                {username || t('common.manager', 'Manager')}
              </p>
              <p className="text-xs text-stone-500 truncate max-w-[150px]">
                {roles[0] || t('common.manager', 'Manager')}
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-100 transition-colors duration-150 group"
              aria-label="User menu"
            >
              {/* Mobile username badge */}
              <div className="md:hidden flex flex-col items-end">
                <span className="text-xs font-medium text-stone-700">
                  {username?.split(" ")[0] || t('common.manager', 'Manager')}
                </span>
                <span className="text-[10px] text-stone-500">{t('common.manager', 'Manager')}</span>
              </div>

              {/* User Avatar/Icon */}
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                  {username?.charAt(0).toUpperCase() || "M"}
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-stone-500 absolute -bottom-1 -right-1 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-fadeIn">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-stone-100 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold">
                      {username?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {username || t('common.managerUser', 'Manager User')}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {roles[0] || t('common.manager', 'Manager')}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Sein Gay Har
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfile}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                  >
                    <User className="w-4 h-4 mr-3 text-stone-400 group-hover:text-blue-600" />
                    <span>{t('common.myProfile', 'My Profile')}</span>
                  </button>

                  <button
                    onClick={handleSettings}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                  >
                    <Settings className="w-4 h-4 mr-3 text-stone-400 group-hover:text-blue-600" />
                    <span>{t('common.settings', 'Settings')}</span>
                  </button>

                  {/* Fixed ChangePasswordButton integration */}
                  <ChangePasswordButton
                    buttonStyle="dropdown"
                    buttonSize="md"
                    buttonText={t('common.changePassword', 'Change Password')}
                    onCloseDropdown={() => setUserMenuOpen(false)}
                    className="w-full justify-start px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                  />

                  <div className="h-px bg-stone-100 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 group"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>{t('common.logout', 'Logout')}</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-stone-100 bg-stone-50">
                  <p className="text-xs text-stone-500">
                    Version 1.0.0 • © 2024
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};