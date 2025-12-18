// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/layout/Layout';
import { UnitDetailModal } from '../components/homepage/UnitDetailModal';
import { AppointmentForm } from '../components/homepage/AppointmentForm';
import { LoginPromptModal } from '../components/common/ui/LoginPromptModal';
import { ToastNotification } from '../components/common/ui/ToastNotification';
import type { Unit } from '../types/unit';
import Homepage from '../components/homepage/Homepage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'view' | 'appointment';
    unit: Unit;
  } | null>(null);
  
  // Get auth state from context
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Show toast notification
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Handle unit detail request
  const handleUnitDetail = (unit: Unit) => {
    console.log('🏠 HomePage: Unit detail requested', unit.unitNumber);
    
    // Check if user is logged in
    if (!isAuthenticated) {
      setPendingAction({ type: 'view', unit });
      setIsLoginPromptOpen(true);
      return;
    }
    
    setSelectedUnit(unit);
    setIsDetailModalOpen(true);
  };

  const handleViewSpaces = () => {
    // This will scroll directly to the units grid section
    setTimeout(() => {
      const unitsGrid = document.querySelector('#units-grid-section');
      if (unitsGrid) {
        unitsGrid.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  }; // <-- Added missing closing brace here

  // Handle appointment request
  const handleAppointment = (unit: Unit) => {
    console.log('🏠 HomePage: Appointment requested', unit.unitNumber);
    
    // Check if user is logged in
    if (!isAuthenticated) {
      setPendingAction({ type: 'appointment', unit });
      setIsLoginPromptOpen(true);
      return;
    }
    
    setSelectedUnit(unit);
    setIsAppointmentModalOpen(true);
  };

  // Handle login from login prompt
  const handleLoginConfirm = () => {
    setIsLoginPromptOpen(false);
    
    // Save the intended action and redirect to login
    if (pendingAction) {
      sessionStorage.setItem('pendingAction', JSON.stringify(pendingAction));
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    
    navigate('/login');
  };

  // Handle cancel from login prompt
  const handleLoginCancel = () => {
    setIsLoginPromptOpen(false);
    setPendingAction(null);
    showToast('info', 'You can login anytime to view details or book appointments.');
  };

  // Handle appointment submission
  const handleAppointmentSubmit = async (appointmentData: any) => {
    console.log('🏠 HomePage: Appointment submitted', appointmentData);
    
    try {
      // Here you would call your appointment API
      // Example:
      // const response = await appointmentApi.book(appointmentData);
      // console.log('Appointment booked:', response);
      
      showToast('success', 'Appointment booked successfully! We will contact you soon.');
      closeModals();
    } catch (error) {
      console.error('Failed to book appointment:', error);
      showToast('error', 'Failed to book appointment. Please try again.');
    }
  };

  // Check for pending actions after login
  useEffect(() => {
    if (isAuthenticated) {
      const pendingAction = sessionStorage.getItem('pendingAction');
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      
      if (pendingAction && redirectPath) {
        try {
          const action = JSON.parse(pendingAction);
          
          // Small delay to ensure context is ready
          setTimeout(() => {
            if (action.type === 'view') {
              setSelectedUnit(action.unit);
              setIsDetailModalOpen(true);
            } else if (action.type === 'appointment') {
              setSelectedUnit(action.unit);
              setIsAppointmentModalOpen(true);
            }
          }, 100);
          
          // Clear stored data
          sessionStorage.removeItem('pendingAction');
          sessionStorage.removeItem('redirectAfterLogin');
        } catch (err) {
          console.error('Error processing pending action:', err);
        }
      }
    }
  }, [isAuthenticated]);

  const closeModals = () => {
    console.log('🏠 HomePage: Closing modals');
    setIsDetailModalOpen(false);
    setIsAppointmentModalOpen(false);
    setSelectedUnit(null);
  };

  return (
    <Layout>
      {/* Toast Notifications */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <Homepage 
        onUnitDetail={handleUnitDetail}
        onViewSpaces={handleViewSpaces}
      />

      {/* Unit Detail Modal - Only shown when user is logged in */}
      {selectedUnit && isAuthenticated && (
        <UnitDetailModal
          unit={selectedUnit}
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          onAppointment={handleAppointment}
        />
      )}

      {/* Appointment Form Modal - Only shown when user is logged in */}
      {selectedUnit && isAuthenticated && (
        <AppointmentForm
          unit={selectedUnit}
          isOpen={isAppointmentModalOpen}
          onClose={closeModals}
          onSubmit={handleAppointmentSubmit}
          isLoading={false}
          isLoggedIn={isAuthenticated}
        />
      )}

      {/* Login Prompt Modal */}
      {pendingAction && (
        <LoginPromptModal
          isOpen={isLoginPromptOpen}
          onClose={handleLoginCancel}
          onConfirm={handleLoginConfirm}
          title={pendingAction.type === 'view' ? 'View Details' : 'Book Appointment'}
          message={
            pendingAction.type === 'view'
              ? 'You need to login to view unit details and pricing.'
              : 'You need to login to book an appointment.'
          }
          confirmText="Login Now"
          cancelText="Maybe Later"
        />
      )}
    </Layout>
  );
};

export default HomePage;