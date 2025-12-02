// src/pages/HomePage.tsx
import React, { useState } from 'react';
import { Layout } from '../components/common/layout/Layout';
import { RoomDetailModal } from '../components/homepage/RoomDetailModal';
import { AppointmentForm } from '../components/homepage/AppointmentForm';
import type { Unit } from '../types/unit';
import Homepage from '../components/homepage/Homepage';

const HomePage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<Unit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // You'll get this from your auth context

  const handleRoomDetail = (room: Unit) => {
    console.log('🏠 HomePage: Room detail requested', room.unitNumber);
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  const handleAppointment = (room: Unit) => {
    console.log('🏠 HomePage: Appointment requested', room.unitNumber);
    setSelectedRoom(room);
    setIsAppointmentModalOpen(true);
  };

  const handleLoginRequired = () => {
    console.log('🏠 HomePage: Login required, redirecting...');
    window.location.href = '/login';
  };

  const handleAppointmentSubmit = (appointmentData: any) => {
    console.log('🏠 HomePage: Appointment submitted', appointmentData);
    // Call your appointment API here
    alert('Appointment booked successfully! We will contact you soon.');
    setIsAppointmentModalOpen(false);
  };

  const closeModals = () => {
    console.log('🏠 HomePage: Closing modals');
    setIsDetailModalOpen(false);
    setIsAppointmentModalOpen(false);
    setSelectedRoom(null);
  };

  console.log('🏠 HomePage State:', {
    selectedRoom: selectedRoom?.unitNumber,
    isDetailModalOpen,
    isAppointmentModalOpen,
    isLoggedIn
  });

  return (
    <Layout>
      <Homepage 
        onRoomDetail={handleRoomDetail}
        onAppointment={handleAppointment}
      />

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          onAppointment={handleAppointment}
          isLoggedIn={isLoggedIn}
          onLoginRequired={handleLoginRequired}
        />
      )}

      {/* Appointment Form Modal */}
      {selectedRoom && (
        <AppointmentForm
          room={selectedRoom}
          isOpen={isAppointmentModalOpen}
          onClose={closeModals}
          onSubmit={handleAppointmentSubmit}
          isLoggedIn={isLoggedIn}
          userEmail={isLoggedIn ? "user@example.com" : undefined}
          userName={isLoggedIn ? "John Doe" : undefined}
        />
      )}
    </Layout>
  );
};

export default HomePage;