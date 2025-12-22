// src/components/common/layout/Header.tsx
import React, { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setIsMobileMenuOpen(false);
        }
      }, 150);
    }
  };

  const handleLogin = () => {
    setIsMobileMenuOpen(false);
    if (onLogin) onLogin();
  };

  const handleRegister = () => {
    setIsMobileMenuOpen(false);
    if (onRegister) onRegister();
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-5">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src={Logo}
                alt="Sein Gay Har Logo"
                className="w-20 h-auto mr-4 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  Sein Gay Har Mall
                </h1>
                <p className="text-sm text-[#64748B]">Premium Retail Spaces</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              <Link
                to="/"
                className="text-[#475569] font-medium text-lg hover:text-[#1E40AF] transition-colors duration-300 relative group"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1E40AF] group-hover:w-full transition-all duration-300"></span>
              </Link>

              <button
                onClick={() => scrollToSection('available-units')}
                className="text-[#475569] font-medium text-lg hover:text-[#1E40AF] transition-colors duration-300 relative group"
              >
                Available Spaces
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1E40AF] group-hover:w-full transition-all duration-300"></span>
              </button>

              <button
                onClick={() => scrollToSection('contact')}
                className="text-[#475569] font-medium text-lg hover:text-[#1E40AF] transition-colors duration-300 relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1E40AF] group-hover:w-full transition-all duration-300"></span>
              </button>

              {isLoggedIn && (
                <Link
                  to="/admin/rooms"
                  className="text-[#475569] font-medium text-lg hover:text-[#1E40AF] transition-colors duration-300 relative group"
                >
                  Admin
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1E40AF] group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-6">
              {isLoggedIn ? (
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-semibold">
                      {userName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B]">Welcome back</p>
                      <p className="font-medium text-[#0F172A]">{userName}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    size="md"
                    className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-all duration-300"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Button
                    onClick={handleLogin}
                    variant="secondary"
                    size="md"
                    className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-all duration-300"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleRegister}
                    size="md"
                    className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex flex-col justify-center items-center space-y-1.5"
            >
              <span className={`w-6 h-0.5 bg-[#475569] transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-[#475569] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-[#475569] transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-x-0 top-[88px] bg-white/95 backdrop-blur-md shadow-xl z-40 transition-all duration-300 ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-lg font-medium text-[#475569] hover:text-[#1E40AF] transition-colors duration-300 py-2"
            >
              Home
            </Link>

            <button
              onClick={() => scrollToSection('available-units')}
              className="block w-full text-left text-lg font-medium text-[#475569] hover:text-[#1E40AF] transition-colors duration-300 py-2"
            >
              Available Spaces
            </button>

            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left text-lg font-medium text-[#475569] hover:text-[#1E40AF] transition-colors duration-300 py-2"
            >
              Contact
            </button>

            {isLoggedIn && (
              <Link
                to="/admin/rooms"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium text-[#475569] hover:text-[#1E40AF] transition-colors duration-300 py-2"
              >
                Admin
              </Link>
            )}

            <div className="pt-6 border-t border-[#E2E8F0]">
              {isLoggedIn ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-semibold text-lg">
                      {userName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B]">Welcome back</p>
                      <p className="font-medium text-[#0F172A] text-lg">{userName}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    size="lg"
                    className="w-full border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-all duration-300"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={handleLogin}
                    variant="secondary"
                    size="lg"
                    className="w-full border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-all duration-300"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleRegister}
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};