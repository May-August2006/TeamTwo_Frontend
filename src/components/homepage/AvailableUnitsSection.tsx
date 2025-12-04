import React, { useState, useEffect } from "react";
import type { Unit, UnitSearchParams } from "../../types/unit";
import { UnitCard } from "./UnitCard";
import { SearchFilters } from "./SearchFilters";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";
import { Button } from "../common/ui/Button";
import { AppointmentForm } from "./AppointmentForm";
import { appointmentApi } from "../../api/appointmentApi";
import { useAuth } from "../../context/AuthContext";
import { LoginPromptModal } from "../common/ui/LoginPromptModal"; // Add this import

interface AvailableUnitsSectionProps {
  onUnitDetail?: (unit: Unit) => void;
  onAppointment?: (unit: Unit) => void; // Add this prop
}

export const AvailableUnitsSection: React.FC<AvailableUnitsSectionProps> = ({
  onUnitDetail,
  onAppointment, // Destructure this
}) => {
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [searchParams, setSearchParams] = useState<UnitSearchParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Appointment Modal state
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  // Login Prompt state
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'view' | 'appointment';
    unit: Unit;
  } | null>(null);
  
  const { isAuthenticated, userId } = useAuth();

  // Load units on mount
  useEffect(() => {
    loadAvailableUnits();
  }, []);

  // Filter units when search changes
  useEffect(() => {
    filterUnits();
  }, [searchParams, availableUnits]);

  // Fetch available units
  const loadAvailableUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading available units...");

      const response = await fetch("http://localhost:8080/api/units/available");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let data = await response.json();
      console.log("📦 Raw API response:", data);

      // Handle Spring Boot's ResponseEntity structure
      if (data && data.data) {
        data = data.data;
      }
      
      // Handle pagination if needed
      if (data && Array.isArray(data.content)) {
        data = data.content;
      }

      if (!Array.isArray(data)) {
        console.error("❌ Invalid data format:", data);
        throw new Error("Invalid data format");
      }

      // Transform the data to match your frontend structure
      const transformedData = data.map((unit: any) => ({
        ...unit,
        utilities: unit.utilities || [],
        imageUrls: unit.imageUrls || []
      }));

      setAvailableUnits(transformedData);
      console.log(`✅ Loaded ${transformedData.length} units`, transformedData);
    } catch (err: any) {
      console.error("❌ Error loading units:", err);
      setError(err.message || "Failed to load units");
      setAvailableUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filters
  const filterUnits = () => {
    let filtered = [...availableUnits];

    if (searchParams.minSpace)
      filtered = filtered.filter((r) => r.unitSpace >= searchParams.minSpace!);
    if (searchParams.maxSpace)
      filtered = filtered.filter((r) => r.unitSpace <= searchParams.maxSpace!);
    if (searchParams.minRent)
      filtered = filtered.filter((r) => r.rentalFee >= searchParams.minRent!);
    if (searchParams.maxRent)
      filtered = filtered.filter((r) => r.rentalFee <= searchParams.maxRent!);
    if (searchParams.unitType)
      filtered = filtered.filter(
        (r) => r.unitType === searchParams.unitType
      );
    if (searchParams.roomTypeId)
      filtered = filtered.filter(
        (r) => r.roomType?.id === searchParams.roomTypeId
      );

    setFilteredUnits(filtered);
  };

  // View unit details
  const handleUnitDetail = (unit: Unit) => {
    if (!isAuthenticated) {
      // Show login prompt instead of alert
      setPendingAction({ type: 'view', unit });
      setIsLoginPromptOpen(true);
      return;
    }
    console.log("👁️ Viewing unit:", unit.unitNumber);
    if (onUnitDetail) onUnitDetail(unit);
  };

  // Open appointment modal
  const handleAppointment = (unit: Unit) => {
    if (!isAuthenticated) {
      // Show login prompt instead of alert
      setPendingAction({ type: 'appointment', unit });
      setIsLoginPromptOpen(true);
      return;
    }
    
    // If parent provides onAppointment handler, use it
    if (onAppointment) {
      onAppointment(unit);
      return;
    }
    
    // Otherwise use local appointment modal
    console.log("📅 Booking appointment for:", unit.unitNumber);
    setSelectedUnit(unit);
    setIsAppointmentOpen(true);
  };

  // Handle login prompt confirm
  const handleLoginConfirm = () => {
    setIsLoginPromptOpen(false);
    
    // Save the intended action to session storage
    if (pendingAction) {
      sessionStorage.setItem('pendingAction', JSON.stringify(pendingAction));
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  // Handle login prompt cancel
  const handleLoginCancel = () => {
    setIsLoginPromptOpen(false);
    setPendingAction(null);
  };

  // Close appointment modal
  const closeAppointmentModal = () => {
    setSelectedUnit(null);
    setIsAppointmentOpen(false);
  };

  // Submit appointment to backend
  const submitAppointment = async (data: {
    roomId: number;
    appointmentDate: string;
    appointmentTime: string;
    purpose: string;
    notes: string;
    guestPhone: string;
  }) => {
    if (!userId) {
      // This shouldn't happen since we check isAuthenticated first
      return;
    }

    try {
      setIsBooking(true);

      const response = await appointmentApi.book(userId || 0, data);
      console.log("✅ Appointment booked:", response.data);

      // Show success message (you can add toast notification here)
      alert("Appointment booked successfully!");
      closeAppointmentModal();
    } catch (err: any) {
      console.error("❌ Failed to book appointment:", err);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <section id="available-units" className="py-16 bg-[#E5E8EB]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-4">
            Available Retail Spaces
          </h2>
          <p className="text-lg text-[#0D1B2A] opacity-80 max-w-2xl mx-auto">
            Browse through our carefully curated selection of retail spaces.
            Each location is designed to help your business thrive.
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-[#0D1B2A]/10 p-6 mb-8">
          <SearchFilters
            onSearch={setSearchParams}
            onReset={() => setSearchParams({})}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-[#0D1B2A]/10">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-[#0D1B2A]">
              Loading available spaces...
            </span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-[#B71C1C] mb-2">
              Unable to Load Spaces
            </h3>
            <p className="text-[#D32F2F] mb-4">{error}</p>
            <Button
              onClick={loadAvailableUnits}
              variant="secondary"
              className="border-[#0D1B2A]"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Unit List */}
        {!loading && !error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[#0D1B2A] opacity-80">
                Showing {filteredUnits.length} of {availableUnits.length}{" "}
                available spaces
              </p>
              {availableUnits.length > 0 && (
                <Button
                  onClick={loadAvailableUnits}
                  variant="secondary"
                  size="sm"
                  className="border-[#0D1B2A]"
                >
                  Refresh
                </Button>
              )}
            </div>

            {filteredUnits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-[#0D1B2A]/10">
                <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">
                  No spaces match your criteria
                </h3>
                <Button
                  onClick={() => setSearchParams({})}
                  variant="secondary"
                  className="border-[#0D1B2A]"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredUnits.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onViewDetails={handleUnitDetail}
                    onAppointment={handleAppointment}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Appointment Modal */}
        {selectedUnit && (
          <AppointmentForm
            unit={selectedUnit}
            isOpen={isAppointmentOpen}
            onClose={closeAppointmentModal}
            onSubmit={submitAppointment}
            isLoading={isBooking}
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
      </div>
    </section>
  );
};