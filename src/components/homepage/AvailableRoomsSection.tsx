/** @format */

// src/components/homepage/AvailableRoomsSection.tsx
import React, { useState, useEffect } from "react";
import type { Unit, UnitSearchParams } from "../../types/unit";
import { RoomCard } from "./RoomCard";
import { SearchFilters } from "./SearchFilters";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";
import { Button } from "../common/ui/Button";
import { AppointmentForm } from "./AppointmentForm";
import { appointmentApi } from "../../api/appointmentApi";
import { useAuth } from "../../context/AuthContext";

interface AvailableRoomsSectionProps {
  onRoomDetail?: (room: Unit) => void;
}

export const AvailableRoomsSection: React.FC<AvailableRoomsSectionProps> = ({
  onRoomDetail,
}) => {
  const [availableRooms, setAvailableRooms] = useState<Unit[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Unit[]>([]);
  const [searchParams, setSearchParams] = useState<UnitSearchParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Appointment Modal state
  const [selectedRoom, setSelectedRoom] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const { isAuthenticated, userId } = useAuth();

  // Load rooms on mount
  useEffect(() => {
    loadAvailableRooms();
  }, []);

  // Filter rooms when search changes
  useEffect(() => {
    filterRooms();
  }, [searchParams, availableRooms]);

  // Fetch available rooms
  const loadAvailableRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading available rooms...");

      const response = await fetch("http://localhost:8080/api/units/available");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let data = await response.json();

      // Handle different API response structures
      if (data.content) data = data.content;
      else if (data.data) data = data.data;

      if (!Array.isArray(data)) throw new Error("Invalid data format");

      setAvailableRooms(data);
      console.log(`✅ Loaded ${data.length} rooms`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load rooms");
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filters
  const filterRooms = () => {
    let filtered = [...availableRooms];

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

    setFilteredRooms(filtered);
  };

  // View room details
  const handleRoomDetail = (room: Unit) => {
    console.log("👁️ Viewing room:", room.unitNumber);
    if (onRoomDetail) onRoomDetail(room);
  };

  // Open appointment modal
  const handleAppointment = (room: Unit) => {
    console.log("📅 Booking appointment for:", room.unitNumber);
    setSelectedRoom(room);
    setIsAppointmentOpen(true);
  };

  // Close appointment modal
  const closeAppointmentModal = () => {
    setSelectedRoom(null);
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
      alert("You must be logged in to book an appointment");
      return;
    }

    try {
      setIsBooking(true);

      const response = await appointmentApi.book(userId || 0, data);
      console.log("✅ Appointment booked:", response.data);

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
    <section id="available-rooms" className="py-16 bg-[#E5E8EB]">
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
              onClick={loadAvailableRooms}
              variant="secondary"
              className="border-[#0D1B2A]"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Room List */}
        {!loading && !error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[#0D1B2A] opacity-80">
                Showing {filteredRooms.length} of {availableRooms.length}{" "}
                available spaces
              </p>
              {availableRooms.length > 0 && (
                <Button
                  onClick={loadAvailableRooms}
                  variant="secondary"
                  size="sm"
                  className="border-[#0D1B2A]"
                >
                  Refresh
                </Button>
              )}
            </div>

            {filteredRooms.length === 0 ? (
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
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onViewDetails={handleRoomDetail}
                    onAppointment={handleAppointment}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Appointment Modal */}
        {selectedRoom && (
          <AppointmentForm
            room={selectedRoom}
            isOpen={isAppointmentOpen}
            onClose={closeAppointmentModal}
            onSubmit={submitAppointment}
            isLoading={isBooking}
            isLoggedIn={isAuthenticated}
          />
        )}
      </div>
    </section>
  );
};
