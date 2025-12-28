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
import { ToastNotification } from "../common/ui/ToastNotification";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]); // Store all units for pagination
  const [activeSearchParams, setActiveSearchParams] = useState<UnitSearchParams>({});
  const [pendingSearchParams, setPendingSearchParams] = useState<UnitSearchParams>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "view" | "appointment";
    unit: Unit;
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Show 9 units per page (3x3 grid)
  const [totalPages, setTotalPages] = useState(1);

  const { isAuthenticated, userId } = useAuth();

  // Load units on initial mount
  useEffect(() => {
    loadAvailableUnits();
  }, []);

  // Update displayed units when allUnits or currentPage changes
  useEffect(() => {
    updateDisplayUnits();
  }, [allUnits, currentPage]);

  const updateDisplayUnits = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const pageUnits = allUnits.slice(startIndex, endIndex);
    setAvailableUnits(pageUnits);
    setTotalPages(Math.ceil(allUnits.length / itemsPerPage));
  };

  // Show toast function
  const showToast = (type: 'success'| 'warning' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
  };

  // Close toast function
  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

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
      setCurrentPage(1); // Reset to first page on new search

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
      setAllUnits(transformedData); // Store all units
      // updateDisplayUnits will be called via useEffect

      if (params && Object.keys(params).length > 0) {
        setActiveSearchParams(params);
      } else {
        setActiveSearchParams({});
      }
    } catch (err: any) {
      console.error("❌ Error loading units:", err);
      setError(err.message || "Failed to load units");
      setAllUnits([]);
      setAvailableUnits([]);
      showToast('error', t('homepage.units.errorLoading'));
    } finally {
      setLoading(false);
      setSearching(false);
      setIsInitialLoad(false);
    }
  };

  const handleApplySearch = async () => {
    console.log("🚀 Applying search with params:", pendingSearchParams);
    await loadAvailableUnits(pendingSearchParams);
    setShowFilters(false);
  };

  const handleResetSearch = () => {
    console.log("🔄 Resetting search");
    setPendingSearchParams({});
    setShowFilters(false);
    loadAvailableUnits();
    showToast('info', t('homepage.units.clearFilters'));
  };

  const handlePendingFilterChange = (params: UnitSearchParams) => {
    console.log("📝 Pending filters updated:", params);
    setPendingSearchParams(params);
  };

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to units grid section when changing pages
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
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = 5;
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (startPage > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      
      if (endPage < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // New function to check if user can view details or make appointment
  const checkUserEligibility = async (unitId: number, actionType: 'view' | 'appointment') => {
    if (!userId) return { canProceed: false, message: t('common.toast.loginFirst') };

    try {
      // Get user info to check approval status and role
      const userRes = await userApi.getById(userId);
      const user = userRes.data;
      
      // Check if user is approved or has ROLE_TENANT
      const isApproved = user.approvalStatus === "APPROVED";
      const isTenant = user.roles?.some((role: any) => role.name === "ROLE_TENANT");
      
      // For viewing details: Approved users and tenants can always see
      if (actionType === 'view') {
        if (!isApproved && !isTenant) {
          return { 
            canProceed: false, 
            message: t('common.toast.accountPending')
          };
        }
        return { canProceed: true, message: '' };
      }
      
      // For appointments: Check appointment-specific restrictions
      if (actionType === 'appointment') {
        if (!isApproved && !isTenant) {
          return { 
            canProceed: false, 
            message: t('common.toast.accountPendingAppointment')
          };
        }

        // Get user's existing appointments for this unit
        try {
          const appointmentsRes = await appointmentApi.getByUser(userId);
          const userAppointments = appointmentsRes.data || [];
          
          // Find existing appointment for this unit
          const existingAppointment = userAppointments.find(
            (appt: any) => appt.roomId === unitId
          );
          
          if (existingAppointment) {
            const status = existingAppointment.status;
            
            // Check if appointment is active (SCHEDULED or CONFIRMED)
            if (status === 'SCHEDULED' || status === 'CONFIRMED') {
              return { 
                canProceed: false, 
                message: t('common.toast.existingAppointment', { status: status.toLowerCase() })
              };
            }
            
            // Check if appointment was cancelled recently (within 3 days)
            if (status === 'CANCELLED') {
              const cancelledDate = new Date(existingAppointment.updatedAt || existingAppointment.createdAt);
              const now = new Date();
              const daysDiff = Math.floor((now.getTime() - cancelledDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff < 3) {
                const daysLeft = 3 - daysDiff;
                return { 
                  canProceed: false, 
                  message: t('common.toast.cancelledWait', { days: daysLeft, s: daysLeft !== 1 ? 's' : '' })
                };
              }
            }
          }
          
          return { canProceed: true, message: '' };
        } catch (err) {
          console.error("Error checking appointments:", err);
          // If we can't check appointments, allow proceeding but with a warning
          return { 
            canProceed: true, 
            message: t('common.toast.verifyError')
          };
        }
      }
      
      return { canProceed: false, message: 'Invalid action type' };
    } catch (err) {
      console.error("Error checking user eligibility:", err);
      return { 
        canProceed: false, 
        message: t('common.toast.failedToVerify')
      };
    }
  };

  const handleUnitDetail = async (unit: Unit) => {
    console.log("👁️ Viewing unit details:", unit.unitNumber);
    
    if (!isAuthenticated) {
      console.log("🔒 User not authenticated, showing login prompt");
      setPendingAction({ type: "view", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    // Check user eligibility for VIEWING details only
    const eligibility = await checkUserEligibility(unit.id, 'view');
    if (!eligibility.canProceed) {
      showToast('warning', eligibility.message);
      return;
    }

    // If there was a warning message but we can proceed, show it as info
    if (eligibility.message && eligibility.canProceed) {
      showToast('info', eligibility.message);
    }

    // Proceed with viewing details
    if (onUnitDetail) {
      onUnitDetail(unit);
    } else {
      console.log("ℹ️ No onUnitDetail handler provided");
      showToast('info', `Unit ${unit.unitNumber} details:\nSpace: ${unit.unitSpace} sqm\nType: ${unit.roomType?.typeName || 'N/A'}`);
    }
  };

  const handleAppointment = async (unit: Unit) => {
    console.log("📅 Opening appointment for unit:", unit.unitNumber);
    
    if (!isAuthenticated) {
      console.log("🔒 User not authenticated, showing login prompt");
      setPendingAction({ type: "appointment", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    // Check user eligibility for APPOINTMENT
    const eligibility = await checkUserEligibility(unit.id, 'appointment');
    if (!eligibility.canProceed) {
      showToast('warning', eligibility.message);
      return;
    }

    // If there was a warning message but we can proceed, show it as info
    if (eligibility.message && eligibility.canProceed) {
      showToast('info', eligibility.message);
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
      showToast('info', t('common.toast.redirecting'));
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
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
      showToast('warning', t('homepage.appointment.loginRequired'));
      return;
    }

    try {
      setIsBooking(true);
      console.log("📤 Submitting appointment:", data);
      
      // Double-check eligibility before submitting
      const eligibility = await checkUserEligibility(data.roomId, 'appointment');
      if (!eligibility.canProceed) {
        showToast('warning', eligibility.message);
        setIsBooking(false);
        return;
      }
      
      const response = await appointmentApi.book(userId, data);
      console.log("✅ Appointment booked:", response);
      
      showToast('success', t('homepage.appointment.appointmentBooked'));
      closeAppointmentModal();
    } catch (err: any) {
      console.error("❌ Failed to book appointment:", err);
      
      // Get error message from backend
      let errorMessage = t('homepage.appointment.failedToBook');
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show backend validation message
      showToast('error', `${errorMessage}`);
      
      // Close modal immediately on error
      closeAppointmentModal();
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
        {/* Toast Notification */}
        {toast.show && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={closeToast}
            duration={toast.type === 'error' ? 7000 : 5000}
          />
        )}

        {/* Compact Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
            {t('homepage.units.availableRetailSpaces')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('homepage.units.browseDescription')}
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
              <span className="font-medium text-[#0F172A]">
                {t('homepage.searchFilters.searchFilter')}
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#1E40AF] text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount} {t('homepage.units.active')}
                </span>
              )}
            </div>
            <span className="text-gray-500 text-sm">
              {showFilters ? t('homepage.units.hideFilters') : t('homepage.units.showFilters')}
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

        {/* Units Grid Section */}
        <div id="units-grid-section" className="bg-white rounded-lg border border-[#E2E8F0]">
          {/* Results Header */}
          <div className="border-b border-[#E2E8F0] p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  {t('homepage.units.availableSpaces')}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1E40AF]/10 text-[#1E40AF] text-sm">
                    {t('homepage.units.availableSpacesCount', { count: allUnits.length })}
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#D97706] text-sm">
                      {t('homepage.units.filtersApplied', { count: activeFiltersCount, s: activeFiltersCount !== 1 ? 's' : '' })}
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
                    {t('homepage.units.clearFilters')}
                  </Button>
                )}
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="secondary"
                  size="sm"
                  className="border-gray-400 text-gray-600 hover:bg-gray-600 hover:text-white"
                  >
                  {showFilters ? t('homepage.units.hideFilters') : t('homepage.units.showFilters')}
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
                      {t('homepage.units.pendingFiltersAlert', { count: pendingFiltersCount, s: pendingFiltersCount !== 1 ? 's' : '' })}
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
                  ? t('homepage.units.loadingSpaces')
                  : searching
                  ? t('homepage.units.searchingSpaces')
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
                  ? t('homepage.units.errorSearching')
                  : t('homepage.units.errorLoading')}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">{error}</p>
              <Button
                onClick={() => loadAvailableUnits(activeSearchParams)}
                variant="secondary"
                size="sm"
                className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
              >
                {t('homepage.units.tryAgain')}
              </Button>
            </div>
          )}

          {/* No Results State */}
          {!loading && !searching && !error && allUnits.length === 0 && (
            <div className="py-12 px-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                {activeFiltersCount > 0
                  ? t('homepage.units.noResults')
                  : t('homepage.units.noAvailable')}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {activeFiltersCount > 0
                  ? t('homepage.units.adjustFilters')
                  : t('homepage.units.checkBack')}
              </p>
              {activeFiltersCount > 0 && (
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleResetSearch}
                    variant="secondary"
                    size="sm"
                    className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
                  >
                    {t('homepage.units.clearFilters')}
                  </Button>
                  <Button
                    onClick={() => loadAvailableUnits()}
                    variant="primary"
                    size="sm"
                    className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white"
                  >
                    {t('homepage.units.showAll')}
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

              {/* Pagination Controls - Only show if we have more than one page */}
              {allUnits.length > itemsPerPage && (
                <div className="mt-8 px-4 py-4 bg-white border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Results summary */}
                    <div className="text-sm text-gray-600">
                      {t('homepage.units.showing')}{" "}
                      <span className="font-medium text-gray-900">
                        {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allUnits.length)}
                      </span>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Previous button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">{t('homepage.units.previous')}</span>
                        <span className="sm:hidden">{t('homepage.units.previous')}</span>
                      </button>

                      {/* Page numbers - Hidden on mobile */}
                      <div className="hidden sm:flex items-center space-x-1">
                        {getPageNumbers().map((page, index) => (
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-500">•••</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page as number)}
                              className={`w-8 h-8 text-sm rounded ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        ))}
                      </div>

                      {/* Mobile page indicator */}
                      <div className="sm:hidden text-sm font-medium text-gray-700">
                        {currentPage}/{totalPages}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="hidden sm:inline">{t('homepage.units.next')}</span>
                        <span className="sm:hidden">{t('homepage.units.next')}</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                ? t('homepage.unitDetail.viewDetails')
                : t('homepage.unitDetail.bookAppointment')
            }
            message={
              pendingAction.type === "view"
                ? t('homepage.unitDetail.loginRequired')
                : t('homepage.unitDetail.appointmentRequired')
            }
            confirmText={t('homepage.unitDetail.loginNow')}
            cancelText={t('homepage.unitDetail.maybeLater')}
          />
        )}
      </div>
    </section>
  );
};