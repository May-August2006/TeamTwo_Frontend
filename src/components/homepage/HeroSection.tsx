// src/components/homepage/HeroSection.tsx
import React from 'react';
import { Button } from '../common/ui/Button';

interface HeroSectionProps {
  onViewSpaces?: () => void;
  onContact?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onViewSpaces, onContact }) => {
  const handleViewSpaces = () => {
    if (onViewSpaces) {
      onViewSpaces();
    } else {
      document.getElementById('available-units')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContact = () => {
    if (onContact) {
      onContact();
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-white to-gray-50 text-gray-900 overflow-hidden">
      {/* Simplified Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            {/* Smaller Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full px-3 py-1.5 mb-4">
              <span className="w-2 h-2 bg-[#1E40AF] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-blue-700">Premium Retail Spaces Available</span>
            </div>

            {/* Compact Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Find Your Perfect 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] mt-1">
                Retail Space
              </span>
            </h1>
            
            {/* Shorter Subtitle */}
            <p className="text-base md:text-lg text-gray-600 mb-6 max-w-xl mx-auto">
              Premium retail spaces in our modern shopping mall. Perfect for boutiques, restaurants, and businesses.
            </p>
            
            {/* Compact CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <Button 
                onClick={handleViewSpaces}
                size="md"
                className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white px-6 py-3 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                View Available Spaces
              </Button>
              <Button 
                variant="secondary"
                size="md"
                onClick={handleContact}
                className="bg-white border-2 border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white px-6 py-3 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                Contact Us
              </Button>
            </div>
            
            {/* Smaller Scroll Indicator */}
            <button 
              onClick={() => document.getElementById('available-units')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-gray-400 hover:text-[#1E40AF] transition-colors duration-300"
            >
              <div className="animate-bounce">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};