// components/LanguageSwitcher.tsx
/** @format */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "mm", name: "မြန်မာ", flag: "🇲🇲" },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-100 transition-colors duration-150"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5 text-stone-600" />
        <span className="hidden md:inline text-sm font-medium text-stone-700">
          {currentLanguage.code} 
          {/* {currentLanguage.name} */}
        </span>
        <span className="md:hidden text-sm font-medium text-stone-700">
          {currentLanguage.flag}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-fadeIn">
          <div className="px-4 py-2 border-b border-stone-100">
            <p className="text-xs font-semibold text-stone-500">Select Language</p>
          </div>
          
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`flex items-center w-full px-4 py-3 text-sm transition-colors duration-150 ${
                i18n.language === language.code
                  ? "bg-blue-50 text-blue-700"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className="text-lg mr-3">{language.flag}</span>
              <span className="flex-1 text-left">{language.name}</span>
              {i18n.language === language.code && (
                <span className="text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};