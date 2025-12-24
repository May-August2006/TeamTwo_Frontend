// src/components/homepage/Homepage.tsx
import React from 'react';
import { HeroSection } from './HeroSection';
import { AvailableUnitsSection } from './AvailableUnitsSection';
import { FeaturesSection } from './FeaturesSection';
import { ContactSection } from './ContactSection';

interface HomepageProps {
  onUnitDetail?: (unit: any) => void;
  onViewSpaces?: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ 
  onUnitDetail,
  onViewSpaces
}) => {
  console.log('🏠 Homepage rendered with props:', {
    hasOnUnitDetail: !!onUnitDetail,
    hasOnViewSpaces: !!onViewSpaces
  });

  return (
    <div className="min-h-screen bg-white">
      <HeroSection 
        onViewSpaces={onViewSpaces}
      />
      <AvailableUnitsSection 
        onUnitDetail={onUnitDetail}
        onViewSpaces={onViewSpaces}
      />
      <FeaturesSection />
      <ContactSection />
    </div>
  );
};

export default Homepage;