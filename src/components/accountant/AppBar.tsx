/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/SeinGayHarLogo.png";
import { Menu, User, LogOut, Settings, ChevronDown } from "lucide-react";

interface AppBarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const AppBar: React.FC<AppBarProps> = ({
  onMenuClick,
  showMenuButton = false,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { username, roles } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUserMenuOpen(false);
    navigate("/logout");
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    // Add profile navigation logic here
    console.log("Navigate to profile");
  };

  const handleSettings = () => {
    setUserMenuOpen(false);
    // Add settings navigation logic here
    console.log("Navigate to settings");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-stone-200">
      <div className="flex items-center justify-between h-16 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Left Section - Menu Button and Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {showMenuButton && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-150 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <div className="flex items-center">
            <img
              src={Logo}
              alt="Sein Gay Har Logo"
              className="h-12 sm:h-14 md:h-16 w-auto"
            />
            <span className="ml-2 sm:ml-3 text-sm sm:text-base md:text-lg font-bold text-stone-800 hidden sm:block"></span>
          </div>
        </div>

        {/* Center Section - Title (Empty for now) */}
        <div className="flex-grow text-center hidden lg:block">
          {/* Optional: Add title or breadcrumbs here */}
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          {/* Username Display */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-800 truncate max-w-[150px]">
                {username || "Accountant"}
              </p>
              <p className="text-xs text-stone-500 truncate max-w-[150px]">
                {roles[0] || "Accountant"}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 transition-colors duration-150 group"
              aria-label="User menu"
            >
              {/* Mobile username badge */}
              <div className="md:hidden flex flex-col items-end">
                <span className="text-xs font-medium text-stone-700">
                  {username?.split(" ")[0] || "User"}
                </span>
                <span className="text-[10px] text-stone-500">Accountant</span>
              </div>

              {/* User Avatar/Icon */}
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                  {username?.charAt(0).toUpperCase() || "A"}
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
                      {username?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {username || "Accountant User"}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {roles[0] || "Accountant"}
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
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={handleSettings}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150 group"
                  >
                    <Settings className="w-4 h-4 mr-3 text-stone-400 group-hover:text-blue-600" />
                    <span>Settings</span>
                  </button>

                  <div className="h-px bg-stone-100 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 group"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>Logout</span>
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
    </div>
  );
};

export default AppBar;
