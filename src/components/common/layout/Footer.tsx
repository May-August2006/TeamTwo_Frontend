// src/components/common/layout/Footer.tsx
import React from 'react';
import Logo from '../../../assets/SeinGayHarLogo.png';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Logo and Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-start mb-3">
              <img
                src={Logo}
                alt="Sein Gay Har Logo"
                className="w-14 h-auto mr-3 object-contain"
              />
              <div>
                <h3 className="font-bold text-gray-900">
                  Sein Gay Har Mall
                </h3>
                <p className="text-xs text-gray-500">
                  Premium retail spaces
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Modern shopping mall with premium retail spaces for businesses of all sizes.
            </p>
            <div className="flex space-x-2">
              <a href="#" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#1E40AF] flex items-center justify-center transition-colors duration-300">
                <span className="text-gray-500 hover:text-white text-xs">FB</span>
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#1E40AF] flex items-center justify-center transition-colors duration-300">
                <span className="text-gray-500 hover:text-white text-xs">IG</span>
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#1E40AF] flex items-center justify-center transition-colors duration-300">
                <span className="text-gray-500 hover:text-white text-xs">TW</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-500 hover:text-[#1E40AF] text-sm transition-colors duration-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <a 
                  href="#available-units" 
                  className="text-gray-500 hover:text-[#1E40AF] text-sm transition-colors duration-300"
                >
                  Available Spaces
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="text-gray-500 hover:text-[#1E40AF] text-sm transition-colors duration-300"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link 
                  to="/login" 
                  className="text-gray-500 hover:text-[#1E40AF] text-sm transition-colors duration-300"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wider">
              Our Services
            </h4>
            <ul className="space-y-2">
              <li className="text-gray-500 text-sm">Retail Space Rental</li>
              <li className="text-gray-500 text-sm">Business Consultation</li>
              <li className="text-gray-500 text-sm">Property Management</li>
              <li className="text-gray-500 text-sm">24/7 Security</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wider">
              Contact Info
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm">123 Mall Road, Yangon</span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm">+95 9 123 456789</span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm">info@seingayhar.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-xs mb-3 md:mb-0">
              &copy; {new Date().getFullYear()} Sein Gay Har Mall. All rights reserved.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-[#1E40AF] text-xs transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1E40AF] text-xs transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1E40AF] text-xs transition-colors duration-300">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};