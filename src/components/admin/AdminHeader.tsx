/** @format */

import React from "react";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../common/ui/LanguageSwitcher";
import Logo from '../../assets/SeinGayHarLogo.png';

interface AdminHeaderProps {
  onLogout: () => void;
  pageTitle?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout }) => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-stone-200">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section - Logo */}
        <div className="flex-shrink-0">
          <img 
            src={Logo} 
            alt="Sein Gay Har Logo" 
            className="h-16 w-auto" // bigger logo
          />
        </div>

        {/* Right Section - Language Switcher and Logout */}
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150 border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">{t('header.logout')}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default AdminHeader;
