/** @format */

import React, { useState } from "react";
import { Menu, LogOut, Globe, ChevronDown } from "lucide-react";
import Logo from '../../assets/SeinGayHarLogo.png';
import { useTranslation } from "react-i18next";

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
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'mm', name: 'Burmese', nativeName: 'မြန်မာ' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguageMenuOpen(false);
  };

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

        {/* Right Section - Language Toggle, Menu Toggle and Logout */}
        <div className="flex items-center space-x-3">
          {/* Language Selector - Desktop */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-150 border border-blue-200"
              aria-label="Change language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentLanguage.code.toUpperCase()}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${languageMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {languageMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-blue-200 py-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-blue-100 bg-blue-50 rounded-t-xl">
                  <p className="text-xs font-medium text-blue-600">Select Language</p>
                </div>
                <div className="py-1">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors duration-150 ${
                        i18n.language === language.code
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      <span>{language.nativeName}</span>
                      <span className="text-xs text-gray-400">{language.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle - Mobile */}
          <div className="md:hidden relative">
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-150"
              aria-label="Change language"
            >
              <Globe className="w-5 h-5" />
            </button>

            {languageMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-blue-200 py-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-blue-100 bg-blue-50 rounded-t-xl">
                  <p className="text-xs font-medium text-blue-600">Select Language</p>
                </div>
                <div className="py-1">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors duration-150 ${
                        i18n.language === language.code
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${i18n.language === language.code ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        <span className="font-medium">{language.nativeName}</span>
                      </div>
                      <span className="text-xs text-gray-400">{language.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Menu Toggle for Mobile */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-150"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-lg transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for dropdown menu */}
      {languageMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setLanguageMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default BODHeader;