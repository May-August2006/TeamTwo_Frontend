// src/components/homepage/Homepage.tsx
import React, { useState } from 'react';
import { HeroSection } from './HeroSection';
import { AvailableUnitsSection } from './AvailableUnitsSection';
import { FeaturesSection } from './FeaturesSection';
import { ContactSection } from './ContactSection';
import { UnitDetailModal } from './UnitDetailModal';
import { AppointmentForm } from './AppointmentForm';
import { ToastNotification } from '../common/ui/ToastNotification';
import { appointmentApi } from '../../api/appointmentApi';
import { useAuth } from '../../context/AuthContext';
import type { Unit } from '../../types/unit';

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

  const { userId } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<Unit | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const showToast = (type: 'success'| 'warning' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const handleUnitDetail = (unit: Unit) => {
    console.log("🏠 Homepage: handleUnitDetail called for unit:", unit.unitNumber);
    setSelectedUnitForDetail(unit);
  };

  const handleAppointment = (unit: Unit) => {
    console.log("🏠 Homepage: handleAppointment called for unit:", unit.unitNumber);
    setSelectedUnit(unit);
    setIsAppointmentOpen(true);
  };

  const closeAppointmentModal = () => {
    setSelectedUnit(null);
    setIsAppointmentOpen(false);
  };

  const submitAppointment = async (data: {
    roomId: number;
    appointmentDate: string;
    appointmentTime: string;
    purpose: string;
    notes: string;
    guestPhone: string;
  }) => {
    if (!userId) {
      showToast('warning', 'Please login to book an appointment');
      return;
    }

    try {
      setIsBooking(true);
      console.log("📤 Submitting appointment:", data);
      
      const response = await appointmentApi.book(userId, data);
      console.log("✅ Appointment booked:", response);
      
      showToast('success', '✅ Appointment booked successfully! The manager will review your request.');
      closeAppointmentModal();
    } catch (err: any) {
      console.error("❌ Failed to book appointment:", err);
      
      let errorMessage = "Failed to book appointment. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showToast('error', `${errorMessage}`);
      closeAppointmentModal();
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notification */}
      {toast.show && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
          duration={toast.type === 'error' ? 7000 : 5000}
        />
      )}

      <HeroSection 
        onViewSpaces={onViewSpaces}
      />
      <AvailableUnitsSection 
        onUnitDetail={handleUnitDetail}
        onAppointment={handleAppointment}
        onViewSpaces={onViewSpaces}
      />
      <FeaturesSection />
      <ContactSection />

      {/* Unit Detail Modal */}
      {selectedUnitForDetail && (
        <UnitDetailModal
          unit={selectedUnitForDetail}
          isOpen={!!selectedUnitForDetail}
          onClose={() => setSelectedUnitForDetail(null)}
          onAppointment={handleAppointment}
        />
      )}

      {/* Appointment Modal */}
      {selectedUnit && (
        <AppointmentForm
          unit={selectedUnit}
          isOpen={isAppointmentOpen}
          onClose={closeAppointmentModal}
          onSubmit={submitAppointment}
          isLoading={isBooking}
          isLoggedIn={true}
        />
      )}
    </div>
  );
};

export default Homepage;