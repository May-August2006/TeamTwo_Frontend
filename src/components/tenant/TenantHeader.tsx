/** @format */

import React from "react";
import { Menu, LogOut, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../common/ui/LanguageSwitcher";
import Logo from '../../assets/SeinGayHarLogo.png';
import ChangePasswordButton from "../ChangePasswordButton";

interface TenantHeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  pageTitle?: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ 
  onMenuToggle, 
  onLogout 
}) => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-stone-200">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section - Logo and Menu Button */}
        <div className="flex items-center space-x-4">
          <img 
            src={Logo} 
            alt="Sein Gay Har Logo" 
            className="h-16 w-auto"
          />
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section - Language Switcher, Notifications and Logout */}
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          <button className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150 border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">{t('header.logout')}</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <ChangePasswordButton 
            buttonStyle="primary"
            buttonSize="md"
            buttonText="Change Password"
          />
        </div>
      </div>
    </header>
  );
};

export default TenantHeader;