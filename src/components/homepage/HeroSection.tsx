// src/components/homepage/HeroSection.tsx
import React from 'react';
import { Button } from '../common/ui/Button';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  onViewSpaces?: () => void;
  onContact?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onViewSpaces, onContact }) => {
  const { t } = useTranslation();

  const handleViewSpaces = () => {
    if (onViewSpaces) {
      onViewSpaces();
    } else {
      setTimeout(() => {
        const unitsGrid = document.querySelector('#units-grid-section');
        if (unitsGrid) {
          unitsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
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
    <section className="relative text-gray-800 overflow-hidden" style={{ backgroundColor: '#D9DEF1' }}>
      <div className="relative container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            {/* Minimal Badge */}
            <div className="inline-flex items-center bg-white/90 backdrop-blur-sm border border-blue-200 rounded-full px-2.5 py-1 mb-2">
              <span className="w-1.5 h-1.5 bg-[#1E40AF] rounded-full mr-1.5"></span>
              <span className="text-xs font-medium text-[#1E40AF]">
                {t('homepage.hero.premiumSpaces')}
              </span>
            </div>

            {/* Compact Heading */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-snug">
              {t('homepage.hero.title')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]">
                {t('homepage.hero.retailSpace')}
              </span>
            </h1>
            
            {/* Short Subtitle */}
            <p className="text-sm text-gray-700 mb-4 max-w-md mx-auto">
              {t('homepage.hero.subtitle')}
            </p>
            
            {/* Compact CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-4">
              <Button 
                onClick={handleViewSpaces}
                size="sm"
                className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white px-4 py-2 font-medium rounded-lg text-sm"
              >
                {t('homepage.hero.viewSpaces')}
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={handleContact}
                className="bg-white/90 backdrop-blur-sm border border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white px-4 py-2 font-medium rounded-lg text-sm"
              >
                {t('homepage.hero.contactUs')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};