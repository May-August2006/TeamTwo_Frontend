// src/components/common/layout/Footer.tsx
import React from 'react';
import Logo from '../../../assets/SeinGayHarLogo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0D1B2A] text-[#E5E8EB]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img
                src={Logo}
                alt="Sein Gay Har Logo"
                className="w-20 h-auto mr-3 object-contain"
              />
              <h3 className="text-xl font-semibold text-white">
                Sein Gay Har Mall Management
              </h3>
            </div>
            <p className="text-[#E5E8EB] mb-4 opacity-80">
              Premium spaces for retail and business growth in the heart of the city.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="hover:text-[#D32F2F] transition-colors duration-200">Home</a></li>
              <li><a href="#available-rooms" className="hover:text-[#D32F2F] transition-colors duration-200">Available Spaces</a></li>
              <li><a href="#contact" className="hover:text-[#D32F2F] transition-colors duration-200">Contact Us</a></li>
              <li><a href="/login" className="hover:text-[#D32F2F] transition-colors duration-200">Login</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-[#E5E8EB] opacity-80">
              <li>123 Mall Road, Yangon</li>
              <li>+95 9 123 456789</li>
              <li>info@seingayhar.com</li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-[#1B263B] mt-8 pt-8 text-center text-[#E5E8EB] opacity-70">
          <p>&copy; {new Date().getFullYear()} Sein Gay Har Mall. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};