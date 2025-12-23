// src/components/common/layout/Layout.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '../../../context/AuthContext'; // Add this import

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showHeader = true, 
  showFooter = true
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useAuth(); // Get auth state

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogout = () => {
    // Clear authentication
    if (logout) {
      logout();
    } else {
      // Fallback if logout function doesn't exist
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      sessionStorage.clear();
    }
    navigate('/');
  };

  // Get user's name from user object
  const getUserName = () => {
    if (username) {
      return username || 'User';
    }
    return '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <Header 
          isLoggedIn={isAuthenticated} // Pass real auth state
          userName={getUserName()}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onLogout={handleLogout}
        />
      )}
      
      <main className="flex-grow bg-[#F9FAFB]">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};