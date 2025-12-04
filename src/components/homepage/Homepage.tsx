import React from 'react';
import { HeroSection } from './HeroSection';
import { AvailableUnitsSection } from './AvailableUnitsSection';
import { FeaturesSection } from './FeaturesSection';
import { ContactSection } from './ContactSection';

interface HomepageProps {
  onUnitDetail?: (unit: any) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ 
  onUnitDetail
}) => {
  console.log('🏠 Homepage rendered with props:', {
    hasOnUnitDetail: !!onUnitDetail
  });

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <AvailableUnitsSection 
        onUnitDetail={onUnitDetail}
      />
      <FeaturesSection />
      <ContactSection />
    </div>
  );
};

export default Homepage;
