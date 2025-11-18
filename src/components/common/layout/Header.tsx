// src/components/common/layout/Header.tsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import Logo from '../../../assets/SeinGayHarLogo.png';

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  onLogin?: () => void;
  onLogout?: () => void;
  onRegister?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn = false,
  userName,
  onLogin,
  onLogout,
  onRegister
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      const section = document.getElementById(id);
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(id);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <header className="bg-white border-b border-[#E5E8EB] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={Logo}
              alt="Sein Gay Har Logo"
              className="w-16 h-auto mr-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-[#0D1B2A] tracking-tight">
              Sein Gay Har Mall
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-[#0D1B2A] font-medium hover:text-[#D32F2F] transition-colors duration-200"
            >
              Home
            </Link>

            <button
              onClick={() => scrollToSection('available-rooms')}
              className="text-[#0D1B2A] font-medium hover:text-[#D32F2F] transition-colors duration-200"
            >
              Spaces
            </button>

            <button
              onClick={() => scrollToSection('contact')}
              className="text-[#0D1B2A] font-medium hover:text-[#D32F2F] transition-colors duration-200"
            >
              Contact
            </button>

            {isLoggedIn && (
              <Link
                to="/admin/rooms"
                className="text-[#0D1B2A] font-medium hover:text-[#D32F2F] transition-colors duration-200"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-[#0D1B2A] font-medium">
                  Hello, {userName}
                </span>
                <Button
                  onClick={onLogout}
                  variant="secondary"
                  size="sm"
                  className="hover:bg-[#D32F2F] hover:text-white border border-[#0D1B2A]"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Button
                  onClick={onLogin}
                  variant="secondary"
                  size="sm"
                  className="hover:bg-[#0D1B2A] hover:text-white border border-[#0D1B2A]"
                >
                  Login
                </Button>
                <Button
                  onClick={onRegister}
                  size="sm"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};