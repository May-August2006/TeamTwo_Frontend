import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/SeinGayHarLogo.png';

const AppBar: React.FC = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { username } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUserMenuOpen(false);
    navigate('/logout');
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    // Add profile navigation logic here
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-stone-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section - Logo */}
        <div className="flex-shrink-0">
          <img 
            src={Logo} 
            alt="Sein Gay Har Logo" 
            className="h-16 w-auto" // bigger logo
          />
        </div>

        {/* Center Section - Title */}
        <div className="flex-grow text-center">
          
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center space-x-4">
          <span className="hidden sm:block text-sm text-stone-600 font-medium">
            Welcome, {username || 'User'}
          </span>
          
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center text-stone-700 p-2 hover:bg-stone-100 rounded-lg transition-colors duration-150"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-stone-100">
                  <p className="text-sm font-semibold text-stone-900">{username || 'User'}</p>
                  <p className="text-xs text-stone-500">Accountant</p>
                </div>
                
                <button
                  onClick={handleProfile}
                  className="flex items-center w-full px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors duration-150"
                >
                  <svg className="w-4 h-4 mr-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AppBar;