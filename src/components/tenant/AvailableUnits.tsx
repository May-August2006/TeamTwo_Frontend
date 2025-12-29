/** @format */
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Unit, UnitSearchParams } from "../../types/unit";
import { UnitCard } from "./UnitCard";
import { UnitCardSkeleton } from "../common/skeletons/UnitCardSkeleton";
import { Breadcrumb } from "../common/ui/Breadcrumb";
import { SearchFilters } from "../homepage/SearchFilters";
import { Button } from "../common/ui/Button";
import { AppointmentForm } from "../homepage/AppointmentForm";
import { UnitDetailModal } from "../homepage/UnitDetailModal";
import { LoginPromptModal } from "../common/ui/LoginPromptModal";
import { ToastNotification } from "../common/ui/ToastNotification";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";
import { appointmentApi } from "../../api/appointmentApi";
import { userApi } from "../../api/UserAPI";
import { useAuth } from "../../context/AuthContext";
import { saveSearch, getSavedSearches } from "../../utils/searchStorage";
import { Pagination } from "../Pagination";
import { useTranslation } from "react-i18next";

interface AvailableUnitsProps {
  onUnitDetail?: (unit: any) => void;
}

export const AvailableUnits: React.FC<AvailableUnitsProps> = ({
  onUnitDetail,
}) => {
  const { t } = useTranslation();
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [activeSearchParams, setActiveSearchParams] =
    useState<UnitSearchParams>({});
  const [pendingSearchParams, setPendingSearchParams] =
    useState<UnitSearchParams>({});
  const [savedSearches, setSavedSearches] = useState<UnitSearchParams[]>([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  const { isAuthenticated, userId } = useAuth();

  /* ---------------- Pagination ---------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  const pagedUnits = availableUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Show toast function
  const showToast = (type: 'success'| 'warning' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
  };

  // Close toast function
  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    setSavedSearches(getSavedSearches());
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
        console.warn(`Public endpoint ${url} returned auth error, but we'll continue`);
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
      setError(null);
      params ? setSearching(true) : setLoading(true);

      const baseParams: UnitSearchParams = {
        isAvailable: true,
        ...params
      };

      const cleanParams: UnitSearchParams = {};
      Object.entries(baseParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== 0) {
          cleanParams[key as keyof UnitSearchParams] = value;
        }
      });

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

      if (data && Array.isArray(data.content)) {
        data = data.content;
      } else if (data && Array.isArray(data.data)) {
        data = data.data;
      } else if (!Array.isArray(data)) {
        console.error("❌ Invalid data format:", data);
        throw new Error("Invalid data format");
      }

      const availableUnitsOnly = data.filter((unit: any) => {
        const isAvailable = unit.isAvailable === true || unit.isAvailable === "true";
        return isAvailable;
      });

      const transformedData = availableUnitsOnly.map((unit: any) => ({
        ...unit,
        utilities: unit.utilities || [],
        imageUrls: unit.imageUrls || [],
        isAvailable: true,
      }));
      
      setAvailableUnits(transformedData);

      if (params && Object.keys(params).length > 0) {
        setActiveSearchParams(params);
        saveSearch(params);
        setSavedSearches(getSavedSearches());
      } else {
        setActiveSearchParams({});
      }
    } catch (err: any) {
      console.error("❌ Error loading units:", err);
      setError(err.message || "Failed to load units");
      setAvailableUnits([]);
      showToast('error', t('homepage.units.errorLoading'));
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // NEW: Check user eligibility function (same as homepage)
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

    if (onUnitDetail) {
      onUnitDetail(unit);
    } else {
      setDetailUnit(unit);
      setIsDetailOpen(true);
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
    showToast('info', t('homepage.unitDetail.maybeLater'));
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
      setIsAppointmentOpen(false);
      setSelectedUnit(null);
    } catch (err: any) {
      console.error("❌ Failed to book appointment:", err);
      
      let errorMessage = t('homepage.appointment.failedToBook');
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showToast('error', `${errorMessage}`);
      setIsAppointmentOpen(false);
      setSelectedUnit(null);
    } finally {
      setIsBooking(false);
    }
  };

  const handleApplySearch = async () => {
    await loadAvailableUnits(pendingSearchParams);
  };

  const handleResetSearch = () => {
    setPendingSearchParams({});
    loadAvailableUnits();
    showToast('info', t('homepage.units.clearFilters'));
  };

  const handlePendingFilterChange = (params: UnitSearchParams) => {
    setPendingSearchParams(params);
  };

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast.show && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
          duration={toast.type === 'error' ? 7000 : 5000}
        />
      )}

      <Breadcrumb
        items={[
          { label: "Tenant", path: "/tenant" },
          { label: t('homepage.units.availableSpaces') },
        ]}
      />

      <h1 className="text-2xl font-bold text-stone-900 mb-4">
        {t('homepage.units.availableRetailSpaces')}
      </h1>

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 mb-4 max-w-5xl mx-auto">
        <SearchFilters
          pendingFilters={pendingSearchParams}
          activeFilters={activeSearchParams}
          onSearch={handlePendingFilterChange}
          onApplySearch={handleApplySearch}
          onReset={handleResetSearch}
        />
      </div>

      {/* Recent Searches */}
      {savedSearches.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">
            {t('homepage.units.recentSearches')}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {savedSearches.map((s, i) => (
              <Button
                key={i}
                size="sm"
                variant="secondary"
                onClick={() => loadAvailableUnits(s)}
                className="border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white"
              >
                {t('homepage.units.reapplySearch')} #{i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {(loading || searching) && (
        <div className="py-12 flex flex-col items-center justify-center">
          <LoadingSpinner size="md" className="mb-3" />
          <p className="text-stone-500">
            {loading
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
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            {t('homepage.units.errorLoading')}
          </h3>
          <p className="text-stone-500 mb-4 max-w-md mx-auto">{error}</p>
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
      {!loading && !searching && !error && availableUnits.length === 0 && (
        <div className="py-12 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            {t('homepage.units.noAvailable')}
          </h3>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            {t('homepage.units.checkBack')}
          </p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !searching && !error && availableUnits.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onViewDetails={handleUnitDetail}
                onAppointment={handleAppointment}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalItems={availableUnits.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {selectedUnit && (
        <AppointmentForm
          unit={selectedUnit}
          isOpen={isAppointmentOpen}
          onClose={() => {
            setIsAppointmentOpen(false);
            setSelectedUnit(null);
          }}
          onSubmit={submitAppointment}
          isLoading={isBooking}
          isLoggedIn={isAuthenticated}
        />
      )}

      {detailUnit && (
        <UnitDetailModal
          unit={detailUnit}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setDetailUnit(null);
          }}
          onAppointment={handleAppointment}
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
  );
};