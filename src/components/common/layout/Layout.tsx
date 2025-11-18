// src/components/common/layout/Layout.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  isLoggedIn?: boolean;
  userName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showHeader = true, 
  showFooter = true,
  isLoggedIn = false,
  userName
}) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login'); // Use navigate instead of window.location.href
  };

  const handleRegister = () => {
    navigate('/register'); // Use navigate instead of window.location.href
  };

  const handleLogout = () => {
    // Add your logout logic here
    console.log('Logout clicked');
    // Clear auth tokens, context, etc.
    navigate('/'); // Redirect to home after logout
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <Header 
          isLoggedIn={isLoggedIn}
          userName={userName}
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