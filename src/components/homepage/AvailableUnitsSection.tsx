// src/components/homepage/AvailableUnitsSection.tsx
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
  onViewSpaces?: () => void;
}

export const AvailableUnitsSection: React.FC<AvailableUnitsSectionProps> = ({
  onUnitDetail,
  onAppointment,
  onViewSpaces,
}) => {
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [activeSearchParams, setActiveSearchParams] = useState<UnitSearchParams>({});
  const [pendingSearchParams, setPendingSearchParams] = useState<UnitSearchParams>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showFilters, setShowFilters] = useState(false); // NEW: Control filter visibility

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "view" | "appointment";
    unit: Unit;
  } | null>(null);

  const { isAuthenticated, userId } = useAuth();

  // Load units on initial mount
  useEffect(() => {
    loadAvailableUnits();
  }, []);

  const publicFetch = async (url: string, options?: RequestInit) => {
    try {
      console.log("🌐 Making request to:", url);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (response.status === 401 || response.status === 403) {
        console.warn(
          `Public endpoint ${url} returned auth error, but we'll continue`
        );
        return { data: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Response data:", data);
      return { data };
    } catch (err) {
      console.error("Public fetch error:", err);
      throw err;
    }
  };

  const loadAvailableUnits = async (params?: UnitSearchParams) => {
    try {
      if (params && Object.keys(params).length > 0) {
        setSearching(true);
      } else {
        setLoading(true);
      }

      setError(null);

      console.log("📋 Original params:", params);
      
      const baseParams: UnitSearchParams = {
        isAvailable: true,
        ...params
      };

      console.log("📋 Base params with availability:", baseParams);

      const cleanParams: UnitSearchParams = {};
      Object.entries(baseParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== 0) {
          cleanParams[key as keyof UnitSearchParams] = value;
        }
      });

      console.log("🧹 Cleaned params:", cleanParams);

      let url = "http://localhost:8080/api/units";
      
      if (Object.keys(cleanParams).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(cleanParams).forEach(([key, value]) => {
          queryParams.append(key, value.toString());
        });
        url = `http://localhost:8080/api/units/search?${queryParams}`;
      } else {
        url = "http://localhost:8080/api/units/available";
      }

      console.log("🔍 Fetching URL:", url);

      const response = await publicFetch(url);
      let data = response.data;

      console.log("📦 Raw response data:", data);

      if (data && Array.isArray(data.content)) {
        data = data.content;
        console.log("📄 Extracted content array:", data);
      } else if (data && Array.isArray(data.data)) {
        data = data.data;
        console.log("📄 Extracted data array:", data);
      } else if (data && Array.isArray(data)) {
        console.log("📄 Already an array:", data);
      } else {
        console.error("❌ Invalid data format:", data);
        throw new Error("Invalid data format");
      }

      const availableUnitsOnly = data.filter((unit: any) => {
        const isAvailable = unit.isAvailable === true || unit.isAvailable === "true";
        console.log(`🏢 Unit ${unit.unitNumber} - isAvailable: ${unit.isAvailable} -> ${isAvailable}`);
        return isAvailable;
      });

      console.log("✅ Available units after filtering:", availableUnitsOnly.length);

      const transformedData = availableUnitsOnly.map((unit: any) => ({
        ...unit,
        utilities: unit.utilities || [],
        imageUrls: unit.imageUrls || [],
        isAvailable: true,
      }));
      
      console.log("✨ Transformed data:", transformedData);
      setAvailableUnits(transformedData);

      if (params && Object.keys(params).length > 0) {
        setActiveSearchParams(params);
      } else {
        setActiveSearchParams({});
      }
    } catch (err: any) {
      console.error("❌ Error loading units:", err);
      setError(err.message || "Failed to load units");
      setAvailableUnits([]);
    } finally {
      setLoading(false);
      setSearching(false);
      setIsInitialLoad(false);
    }
  };

  const handleApplySearch = async () => {
    console.log("🚀 Applying search with params:", pendingSearchParams);
    await loadAvailableUnits(pendingSearchParams);
    setShowFilters(false); // Hide filters after search
  };

  const handleResetSearch = () => {
    console.log("🔄 Resetting search");
    setPendingSearchParams({});
    setShowFilters(false);
    loadAvailableUnits();
  };

  const handlePendingFilterChange = (params: UnitSearchParams) => {
    console.log("📝 Pending filters updated:", params);
    setPendingSearchParams(params);
  };

  const handleUnitDetail = async (unit: Unit) => {
    console.log("👁️ Viewing unit details:", unit.unitNumber);
    
    if (!isAuthenticated) {
      console.log("🔒 User not authenticated, showing login prompt");
      setPendingAction({ type: "view", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    try {
      setIsCheckingApproval(true);
      const res = await userApi.getById(userId!);
      if (res.data.approvalStatus !== "APPROVED") {
        alert("Your account is pending approval. Redirecting to home page.");
        window.location.href = "/";
        return;
      }
      
      if (onUnitDetail) {
        onUnitDetail(unit);
      } else {
        console.log("ℹ️ No onUnitDetail handler provided");
        alert(`Unit ${unit.unitNumber} details:\nSpace: ${unit.unitSpace} sqm\nType: ${unit.roomType?.typeName || 'N/A'}`);
      }
    } catch (err) {
      console.error("Failed to verify approval:", err);
      alert("Failed to verify your account. Redirecting to home page.");
      window.location.href = "/";
      return;
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const handleAppointment = (unit: Unit) => {
    console.log("📅 Opening appointment for unit:", unit.unitNumber);
    
    if (!isAuthenticated) {
      console.log("🔒 User not authenticated, showing login prompt");
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

  const handleLoginConfirm = async () => {
    console.log("✅ Login confirmed");
    setIsLoginPromptOpen(false);

    if (pendingAction) {
      sessionStorage.setItem("pendingAction", JSON.stringify(pendingAction));
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "/login";
    }
  };

  const handleLoginCancel = () => {
    console.log("❌ Login cancelled");
    setIsLoginPromptOpen(false);
    setPendingAction(null);
  };

  const closeAppointmentModal = () => {
    console.log("🗑️ Closing appointment modal");
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
      alert("Please login to book an appointment");
      return;
    }

    try {
      setIsBooking(true);
      console.log("📤 Submitting appointment:", data);
      const response = await appointmentApi.book(userId || 0, data);
      console.log("✅ Appointment booked:", response);
      alert("Appointment booked successfully!");
      closeAppointmentModal();
    } catch (err: any) {
      console.error("❌ Failed to book appointment:", err);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const countActiveFilters = () => {
    const count = Object.values(activeSearchParams).filter(
      (val) => val !== undefined && val !== "" && val !== null && val !== 0
    ).length;
    return count;
  };

  const countPendingFilters = () => {
    const count = Object.values(pendingSearchParams).filter(
      (val) => val !== undefined && val !== "" && val !== null && val !== 0
    ).length;
    return count;
  };

  const activeFiltersCount = countActiveFilters();
  const pendingFiltersCount = countPendingFilters();

  return (
    <section id="available-units" className="py-8 bg-[#F8FAFC]">
      <div className="container mx-auto px-4">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
            Available Retail Spaces
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our premium retail spaces - all shown are currently available
          </p>
        </div>

        {/* NEW: Collapsible Search Filters Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full bg-white rounded-lg border border-[#E2E8F0] p-4 mb-3 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <svg 
                className={`w-5 h-5 text-[#1E40AF] transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium text-[#0F172A]">Search & Filter Spaces</span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#1E40AF] text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount} active
                </span>
              )}
            </div>
            <span className="text-gray-500 text-sm">
              {showFilters ? 'Hide filters' : 'Show filters'}
            </span>
          </button>
          
          {/* Filters Panel (Collapsible) - Only show when toggled */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
              <SearchFilters
                onSearch={handlePendingFilterChange}
                onReset={handleResetSearch}
                onApplySearch={handleApplySearch}
                pendingFilters={pendingSearchParams}
                activeFilters={activeSearchParams}
              />
            </div>
          )}
        </div>

        {/* Units Grid Section - This is where "View Available Spaces" scrolls to */}
        <div id="units-grid-section" className="bg-white rounded-lg border border-[#E2E8F0]">
          {/* Results Header */}
          <div className="border-b border-[#E2E8F0] p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">Available Spaces</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1E40AF]/10 text-[#1E40AF] text-sm">
                    {availableUnits.length} Available Spaces
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#D97706] text-sm">
                      {activeFiltersCount} Filter{activeFiltersCount !== 1 ? 's' : ''} Applied
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={handleResetSearch}
                    variant="secondary"
                    size="sm"
                    className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="secondary"
                  size="sm"
                  className="border-gray-400 text-gray-600 hover:bg-gray-600 hover:text-white"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
            </div>
            
            {/* Pending Filters Alert */}
            {pendingFiltersCount > 0 &&
              pendingFiltersCount !== activeFiltersCount && (
                <div className="mt-4 p-3 bg-gradient-to-r from-[#1E40AF]/5 to-[#3B82F6]/5 border border-[#1E40AF]/20 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-[#1E40AF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[#1E40AF] text-sm">
                      You have {pendingFiltersCount} filter{pendingFiltersCount !== 1 ? 's' : ''} set but not applied. 
                      Click <strong>"Apply Filters"</strong> to see results.
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* Loading State */}
          {(loading || searching) && (
            <div className="py-12 flex flex-col items-center justify-center">
              <LoadingSpinner size="md" className="mb-3" />
              <p className="text-gray-500">
                {loading && isInitialLoad
                  ? "Loading available spaces..."
                  : searching
                  ? "Searching spaces..."
                  : "Loading..."}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && !searching && (
            <div className="py-12 px-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                {activeFiltersCount > 0
                  ? "Unable to Search Spaces"
                  : "Unable to Load Spaces"}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">{error}</p>
              <Button
                onClick={() => loadAvailableUnits(activeSearchParams)}
                variant="secondary"
                size="sm"
                className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* No Results State */}
          {!loading && !searching && !error && availableUnits.length === 0 && (
            <div className="py-12 px-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                {activeFiltersCount > 0
                  ? "No available spaces match your search"
                  : "No available spaces at the moment"}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {activeFiltersCount > 0
                  ? "Try adjusting your filters or browse all available spaces."
                  : "Check back soon for new retail space opportunities."}
              </p>
              {activeFiltersCount > 0 && (
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleResetSearch}
                    variant="secondary"
                    size="sm"
                    className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => loadAvailableUnits()}
                    variant="primary"
                    size="sm"
                    className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white"
                  >
                    Show All Available Spaces
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Results Grid */}
          {!loading && !searching && !error && availableUnits.length > 0 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableUnits.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onViewDetails={handleUnitDetail}
                    onAppointment={handleAppointment}
                  />
                ))}
              </div>
              
              {/* Results Summary */}
              {/* <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">
                      Showing <span className="font-semibold text-[#0F172A]">{availableUnits.length}</span> available spaces
                      {activeFiltersCount > 0 && (
                        <span className="ml-2 text-[#64748B]">
                          (filtered from total)
                        </span>
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm text-[#64748B] hover:text-[#1E40AF] transition-colors duration-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Need Help?
                  </button>
                </div>
              </div> */}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {/* <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-[#1E40AF]/5 to-[#3B82F6]/5 border border-[#1E40AF]/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-3">
              Need help finding the perfect space?
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
              All spaces shown are currently available for lease.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                variant="secondary"
                size="sm"
                className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
              >
                Contact Our Team
              </Button>
              <Button
                onClick={() => window.open('tel:+959123456789')}
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now
              </Button>
            </div>
          </div>
        </div> */}

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