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

interface AvailableUnitsSectionProps {
  onUnitDetail?: (unit: Unit) => void;
  onAppointment?: (unit: Unit) => void;
}

export const AvailableUnitsSection: React.FC<AvailableUnitsSectionProps> = ({
  onUnitDetail,
  onAppointment,
}) => {
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [activeSearchParams, setActiveSearchParams] = useState<UnitSearchParams>({});
  const [pendingSearchParams, setPendingSearchParams] = useState<UnitSearchParams>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  // Load units on initial mount
  useEffect(() => {
    loadAvailableUnits();
  }, []);

  // Helper function to make public API calls (no authentication)
  const publicFetch = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // DON'T include Authorization header for public endpoints
          ...options?.headers,
        },
      });

      // Handle 401/403 gracefully for public endpoints
      if (response.status === 401 || response.status === 403) {
        console.warn(`Public endpoint ${url} returned auth error, but we'll continue`);
        // Return empty array instead of throwing
        return { data: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (err) {
      console.error('Public fetch error:', err);
      throw err;
    }
  };

  // Fetch available units (initial load or when applying/searching)
  const loadAvailableUnits = async (params?: UnitSearchParams) => {
    try {
      if (params && Object.keys(params).length > 0) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      console.log("🔄 Loading units...", params ? "with filters" : "all units");

      let response;
      
      if (params && Object.keys(params).length > 0) {
        // Remove empty/null parameters
        const cleanParams: UnitSearchParams = {};
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanParams[key as keyof UnitSearchParams] = value;
          }
        });
        
        if (Object.keys(cleanParams).length > 0) {
          console.log("🔍 Searching with params:", cleanParams);
          
          // Build query string for search
          const queryParams = new URLSearchParams();
          Object.entries(cleanParams).forEach(([key, value]) => {
            queryParams.append(key, value.toString());
          });
          
          // Use public fetch for search endpoint
          response = await publicFetch(
            `http://localhost:8080/api/units/search?${queryParams}`
          );
        } else {
          console.log("📋 Loading all available units");
          // Use public fetch for available endpoint
          response = await publicFetch('http://localhost:8080/api/units/available');
        }
      } else {
        console.log("📋 Loading all available units");
        // Use public fetch for available endpoint
        response = await publicFetch('http://localhost:8080/api/units/available');
      }

      console.log("📦 API response:", response);

      let data = response.data;
      
      // Handle pagination if needed
      if (data && Array.isArray(data.content)) {
        data = data.content;
      }

      if (!Array.isArray(data)) {
        console.error("❌ Invalid data format:", data);
        throw new Error("Invalid data format");
      }

      // Transform the data
      const transformedData = data.map((unit: any) => ({
        ...unit,
        utilities: unit.utilities || [],
        imageUrls: unit.imageUrls || []
      }));

      setAvailableUnits(transformedData);
      
      if (params && Object.keys(params).length > 0) {
        setActiveSearchParams(params);
        console.log(`✅ Found ${transformedData.length} units with filters`);
      } else {
        setActiveSearchParams({});
        console.log(`✅ Loaded ${transformedData.length} units`);
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

  // Handle search when user clicks Apply Filters
  const handleApplySearch = async () => {
    console.log("🔍 Apply Filters clicked with params:", pendingSearchParams);
    await loadAvailableUnits(pendingSearchParams);
  };

  // Handle reset search
  const handleResetSearch = () => {
    console.log("🔄 Resetting filters");
    setPendingSearchParams({});
    loadAvailableUnits(); // Load all units without filters
  };

  // Handle pending filter changes (without applying search)
  const handlePendingFilterChange = (params: UnitSearchParams) => {
    console.log("📝 Filter changed (pending):", params);
    setPendingSearchParams(params);
  };

  // View unit details
  const handleUnitDetail = (unit: Unit) => {
    if (!isAuthenticated) {
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
      setPendingAction({ type: 'appointment', unit });
      setIsLoginPromptOpen(true);
      return;
    }
    
    if (onAppointment) {
      onAppointment(unit);
      return;
    }
    
    console.log("📅 Booking appointment for:", unit.unitNumber);
    setSelectedUnit(unit);
    setIsAppointmentOpen(true);
  };

  // Handle login prompt confirm
  const handleLoginConfirm = () => {
    setIsLoginPromptOpen(false);
    
    if (pendingAction) {
      sessionStorage.setItem('pendingAction', JSON.stringify(pendingAction));
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
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

  // Submit appointment to backend (this still requires authentication)
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

  // Count active filters (currently applied)
  const countActiveFilters = () => {
    return Object.values(activeSearchParams).filter(val => 
      val !== undefined && val !== '' && val !== null
    ).length;
  };

  // Count pending filters (not yet applied)
  const countPendingFilters = () => {
    return Object.values(pendingSearchParams).filter(val => 
      val !== undefined && val !== '' && val !== null
    ).length;
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
            onSearch={handlePendingFilterChange} // Just update pending params
            onReset={handleResetSearch}
            onApplySearch={handleApplySearch} // Called when Apply button is clicked
            pendingFilters={pendingSearchParams}
            activeFilters={activeSearchParams}
          />
        </div>

        {/* Loading State */}
        {(loading || searching) && (
          <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-[#0D1B2A]/10">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-[#0D1B2A]">
              {loading && isInitialLoad ? "Loading available spaces..." : 
               searching ? "Searching spaces..." : 
               "Loading..."}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !searching && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-[#B71C1C] mb-2">
              {countActiveFilters() > 0 
                ? "Unable to Search Spaces" 
                : "Unable to Load Spaces"}
            </h3>
            <p className="text-[#D32F2F] mb-4">{error}</p>
            <Button
              onClick={() => loadAvailableUnits(activeSearchParams)}
              variant="secondary"
              className="border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Unit List */}
        {!loading && !searching && !error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[#0D1B2A] opacity-80">
                  {countActiveFilters() > 0 
                    ? `Found ${availableUnits.length} matching spaces` 
                    : `Showing all ${availableUnits.length} available spaces`}
                </p>
                
                {/* Show pending filters indicator */}
                {countPendingFilters() > 0 && countPendingFilters() !== countActiveFilters() && (
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      ⚡ {countPendingFilters()} filter{countPendingFilters() !== 1 ? 's' : ''} pending - Click "Apply Filters" to search
                    </span>
                  </div>
                )}
                
                {/* Show active filters count */}
                {countActiveFilters() > 0 && (
                  <p className="text-sm text-[#0D1B2A] opacity-60 mt-1">
                    {countActiveFilters()} active filter{countActiveFilters() !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {countActiveFilters() > 0 && (
                  <Button
                    onClick={handleResetSearch}
                    variant="secondary"
                    size="sm"
                    className="border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
                  >
                    Clear All Filters
                  </Button>
                )}
                <Button
                  onClick={() => loadAvailableUnits(activeSearchParams)}
                  variant="secondary"
                  size="sm"
                  className="border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
                >
                  Refresh Results
                </Button>
              </div>
            </div>

            {availableUnits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-[#0D1B2A]/10">
                <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">
                  {countActiveFilters() > 0 
                    ? "No spaces match your search criteria" 
                    : "No available spaces found"}
                </h3>
                <p className="text-[#0D1B2A] opacity-80 mb-4">
                  {countActiveFilters() > 0 
                    ? "Try adjusting your filters or clear them to see all available spaces."
                    : "Check back later for new available spaces."}
                </p>
                {countActiveFilters() > 0 && (
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleResetSearch}
                      variant="secondary"
                      className="border-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
                    >
                      Clear All Filters
                    </Button>
                    <Button
                      onClick={() => loadAvailableUnits()}
                      variant="primary"
                      className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                    >
                      Show All Spaces
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableUnits.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onViewDetails={handleUnitDetail}
                    onAppointment={handleAppointment}
                  />
                ))}
              </div>
            )}
            
            {/* Show "Apply Filters" reminder if there are pending filters */}
            {countPendingFilters() > 0 && countPendingFilters() !== countActiveFilters() && (
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-amber-800">
                  ⚡ You have {countPendingFilters()} filter{countPendingFilters() !== 1 ? 's' : ''} set but not applied.
                  Click <strong>"Apply Filters"</strong> in the search section to see results.
                </p>
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