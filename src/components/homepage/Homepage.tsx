// src/components/homepage/Homepage.tsx
import React from 'react';
import { HeroSection } from './HeroSection';
import { AvailableRoomsSection } from './AvailableRoomsSection';
import { FeaturesSection } from './FeaturesSection';
import { ContactSection } from './ContactSection';

interface HomepageProps {
  onRoomDetail?: (room: any) => void;
  onAppointment?: (room: any) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ 
  onRoomDetail, 
  onAppointment 
}) => {
  console.log('🏠 Homepage rendered with props:', {
    hasOnRoomDetail: !!onRoomDetail,
    hasOnAppointment: !!onAppointment
  });

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <AvailableRoomsSection 
        onRoomDetail={onRoomDetail}
        onAppointment={onAppointment}
      />
      <FeaturesSection />
      <ContactSection />
    </div>
  );
};

export default Homepage;