/** @format */

import React, { useState, useEffect } from "react";
import type { Unit, UnitSearchParams } from "../../types/unit";
import { UnitCard } from "./UnitCard";
import { SearchFilters } from "./SearchFilters";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";
import { Button } from "../common/ui/Button";
import { AppointmentForm } from "./AppointmentForm";
import { appointmentApi } from "../../api/appointmentApi";
import { useAuth } from "../../context/AuthContext";
import { LoginPromptModal } from "../common/ui/LoginPromptModal";
import { userApi } from "../../api/UserAPI";

interface AvailableUnitsSectionProps {
  onUnitDetail?: (unit: Unit) => void;
  onAppointment?: (unit: Unit) => void;
}

export const AvailableUnitsSection: React.FC<AvailableUnitsSectionProps> = ({
  onUnitDetail,
  onAppointment,
}) => {
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [searchParams, setSearchParams] = useState<UnitSearchParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "view" | "appointment";
    unit: Unit;
  } | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);

  const { isAuthenticated, userId } = useAuth();

  // Load units
  useEffect(() => {
    loadAvailableUnits();
  }, []);

  useEffect(() => {
    filterUnits();
  }, [searchParams, availableUnits]);

  const loadAvailableUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8080/api/units/available");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data = await response.json();
      if (data?.data) data = data.data;
      if (Array.isArray(data?.content)) data = data.content;
      if (!Array.isArray(data)) throw new Error("Invalid data format");
      const transformedData = data.map((unit: any) => ({
        ...unit,
        utilities: unit.utilities || [],
        imageUrls: unit.imageUrls || [],
      }));
      setAvailableUnits(transformedData);
    } catch (err: any) {
      console.error("Error loading units:", err);
      setError(err.message || "Failed to load units");
      setAvailableUnits([]);
    } finally {
      setLoading(false);
    }
  };

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
      filtered = filtered.filter((r) => r.unitType === searchParams.unitType);
    if (searchParams.roomTypeId)
      filtered = filtered.filter(
        (r) => r.roomType?.id === searchParams.roomTypeId
      );
    setFilteredUnits(filtered);
  };

  /** View unit details (approval required) */
  const handleUnitDetail = async (unit: Unit) => {
    if (!isAuthenticated || !userId) {
      setPendingAction({ type: "view", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    try {
      const res = await userApi.getById(userId);
      if (res.data.approvalStatus !== "APPROVED") {
        alert("Your account is pending approval. Redirecting to home page.");
        return;
      }
    } catch (err) {
      console.error("Failed to verify approval:", err);
      alert("Failed to verify your account. Redirecting to home page.");
      window.location.href = "/";
      return;
    }

    if (onUnitDetail) onUnitDetail(unit);
  };

  /** Book appointment (login required, no approval) */
  const handleAppointment = async (unit: Unit) => {
    if (!isAuthenticated || !userId) {
      setPendingAction({ type: "appointment", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    if (onAppointment) {
      onAppointment(unit);
      return;
    }

    setSelectedUnit(unit);
    setIsAppointmentOpen(true);
  };

  /** Login confirm modal */
  const handleLoginConfirm = async () => {
    setIsLoginPromptOpen(false);
    if (!pendingAction) return;

    // If already authenticated, check approval immediately
    if (isAuthenticated && userId) {
      await checkApprovalAndExecuteAfterLogin(pendingAction);
      return;
    }

    // Not authenticated, save action and redirect to login
    sessionStorage.setItem("pendingAction", JSON.stringify(pendingAction));
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    window.location.href = "/login";
  };

  const checkApprovalAndExecuteAfterLogin = async (action: {
    type: "view" | "appointment";
    unit: Unit;
  }) => {
    setIsCheckingApproval(true);
    try {
      const res = await userApi.getById(userId!);
      console.log("✅ approvalStatus:", res.data.approvalStatus);

      if (action.type === "view" && res.data.approvalStatus !== "APPROVED") {
        alert(
          "Your account is still pending approval. Viewing details unavailable."
        );
        setPendingAction(null);
        sessionStorage.removeItem("pendingAction");
        return;
      }

      // Execute the action
      if (action.type === "view") {
        if (onUnitDetail) onUnitDetail(action.unit);
      } else if (action.type === "appointment") {
        if (onAppointment) {
          onAppointment(action.unit);
        } else {
          setSelectedUnit(action.unit);
          setIsAppointmentOpen(true);
        }
      }

      setPendingAction(null);
      sessionStorage.removeItem("pendingAction");
    } catch (err) {
      console.error("Failed to verify approval:", err);
      alert("Failed to verify your account. Please try again.");
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const handleLoginCancel = () => {
    setIsLoginPromptOpen(false);
    setPendingAction(null);
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
    if (!userId) return;
    try {
      setIsBooking(true);
      await appointmentApi.book(userId, data);
      alert("Appointment booked successfully!");
      closeAppointmentModal();
    } catch (err: any) {
      console.error("Failed to book appointment:", err);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  /** Resume pending action if redirected back after login */
  useEffect(() => {
    const checkAndResumePendingAction = async () => {
      const storedAction = sessionStorage.getItem("pendingAction");

      if (!storedAction || !isAuthenticated || !userId) return;

      const action = JSON.parse(storedAction) as {
        type: "view" | "appointment";
        unit: Unit;
      };

      // Remove immediately to prevent double execution
      sessionStorage.removeItem("pendingAction");

      // Check approval and execute
      await checkApprovalAndExecuteAfterLogin(action);
    };

    checkAndResumePendingAction();
  }, [isAuthenticated, userId]);

  return (
    <section id="available-units" className="py-16 bg-[#E5E8EB]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-4">
            Available Retail Spaces
          </h2>
          <p className="text-lg text-[#0D1B2A] opacity-80 max-w-2xl mx-auto">
            Browse our selection of retail spaces designed to help your business
            thrive.
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
            title={
              pendingAction.type === "view"
                ? "View Details"
                : "Book Appointment"
            }
            message={
              pendingAction.type === "view"
                ? "You need to login to view unit details and pricing."
                : "You need to login to book an appointment."
            }
            confirmText="Login Now"
            cancelText="Maybe Later"
          />
        )}
      </div>
    </section>
  );
};
