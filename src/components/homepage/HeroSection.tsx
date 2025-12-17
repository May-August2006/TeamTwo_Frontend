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
      document.getElementById('available-rooms')?.scrollIntoView({ behavior: 'smooth' });
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
    <section className="bg-gradient-to-br from-[#0D1B2A] to-[#1B263B] text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect 
            <span className="text-[#D32F2F]"> Retail Space</span>
          </h1>
          <p className="text-xl text-[#E5E8EB] mb-8 max-w-2xl mx-auto">
            Discover premium retail spaces in our modern shopping mall. 
            Perfect locations for boutiques, restaurants, and businesses of all sizes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleViewSpaces}
              size="lg"
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white border-0"
            >
              View Available Spaces
            </Button>
            <Button 
  variant="secondary"
  size="lg"
  onClick={handleContact}
  className="bg-transparent border border-white text-[#0D1B2A]
            hover:bg-transparent hover:border-[#E5E8EB] hover:text-white"
>
  Contact Us
</Button>

          </div>
        </div>
      </div>
    </section>
  );
};