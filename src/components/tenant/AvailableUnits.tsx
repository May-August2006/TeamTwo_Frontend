/** @format */

import React, { useEffect, useState } from "react";
import type { Unit, UnitSearchParams } from "../../types/unit";
import { UnitCard } from "./UnitCard";
import { UnitCardSkeleton } from "../common/skeletons/UnitCardSkeleton";
import { Breadcrumb } from "../common/ui/Breadcrumb";
import { SearchFilters } from "../homepage/SearchFilters";
import { Button } from "../common/ui/Button";

import { AppointmentForm } from "../homepage/AppointmentForm";
import { UnitDetailModal } from "../homepage/UnitDetailModal";
import { LoginPromptModal } from "../common/ui/LoginPromptModal";

import { appointmentApi } from "../../api/appointmentApi";
import { userApi } from "../../api/UserAPI";
import { useAuth } from "../../context/AuthContext";
import { saveSearch, getSavedSearches } from "../../utils/searchStorage";

interface AvailableUnitsSectionProps {
  onUnitDetail?: (unit: Unit) => void;
  onAppointment?: (unit: Unit) => void;
}

export const AvailableUnits: React.FC<AvailableUnitsSectionProps> = ({
  onUnitDetail,
  onAppointment,
}) => {
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

  const { isAuthenticated, userId } = useAuth();

  /* -------------------------------- Effects -------------------------------- */
  useEffect(() => {
    setSavedSearches(getSavedSearches());
    loadAvailableUnits();
  }, []);

  /* ----------------------------- Public Fetch ------------------------------- */
  const publicFetch = async (url: string) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { data: [] };
    return { data: await res.json() };
  };

  /* ----------------------------- Load Units --------------------------------- */
  const loadAvailableUnits = async (params?: UnitSearchParams) => {
    try {
      setError(null);
      params ? setSearching(true) : setLoading(true);

      let response;
      if (params && Object.keys(params).length) {
        const qs = new URLSearchParams(params as any).toString();
        response = await publicFetch(
          `http://localhost:8080/api/units/search?${qs}`
        );
        setActiveSearchParams(params);
        saveSearch(params);
        setSavedSearches(getSavedSearches());
      } else {
        response = await publicFetch(
          "http://localhost:8080/api/units/available"
        );
        setActiveSearchParams({});
      }

      const data = Array.isArray(response.data?.content)
        ? response.data.content
        : response.data;

      setAvailableUnits(data || []);
    } catch (err: any) {
      setError("Failed to load available units");
      setAvailableUnits([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  /* ---------------------------- Event Handlers ------------------------------- */
  const handleUnitDetail = async (unit: Unit) => {
    if (!isAuthenticated) {
      setPendingAction({ type: "view", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    const res = await userApi.getById(userId!);
    if (res.data.approvalStatus !== "APPROVED") {
      alert("Your account is pending approval.");
      return;
    }

    setDetailUnit(unit);
    setIsDetailOpen(true);
    onUnitDetail?.(unit);
  };

  const handleAppointment = (unit: Unit) => {
    if (!isAuthenticated) {
      setPendingAction({ type: "appointment", unit });
      setIsLoginPromptOpen(true);
      return;
    }

    onAppointment?.(unit);
    setSelectedUnit(unit);
    setIsAppointmentOpen(true);
  };

  const submitAppointment = async (data: any) => {
    if (!userId) return;
    setIsBooking(true);
    await appointmentApi.book(userId, data);
    setIsBooking(false);
    setIsAppointmentOpen(false);
  };

  /* --------------------------------- UI ------------------------------------ */
  return (
    <div className="p-6">
      <Breadcrumb
        items={[
          { label: "Tenant", path: "/tenant" },
          { label: "Available Units" },
        ]}
      />

      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Available Units
      </h1>

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 mb-6">
        <SearchFilters
          pendingFilters={pendingSearchParams}
          activeFilters={activeSearchParams}
          onSearch={setPendingSearchParams}
          onApplySearch={() => loadAvailableUnits(pendingSearchParams)}
          onReset={() => loadAvailableUnits()}
        />
      </div>

      {/* Recent Searches */}
      {savedSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">
            Recent Searches
          </h3>
          <div className="flex gap-2 flex-wrap">
            {savedSearches.map((s, i) => (
              <Button
                key={i}
                size="sm"
                variant="secondary"
                onClick={() => loadAvailableUnits(s)}
              >
                Reapply Search #{i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading || searching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <UnitCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : (
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
      )}

      {/* Modals */}
      {selectedUnit && (
        <AppointmentForm
          unit={selectedUnit}
          isOpen={isAppointmentOpen}
          onClose={() => setIsAppointmentOpen(false)}
          onSubmit={submitAppointment}
          isLoading={isBooking}
          isLoggedIn={isAuthenticated}
        />
      )}

      {detailUnit && (
        <UnitDetailModal
          unit={detailUnit}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onAppointment={handleAppointment}
        />
      )}

      {pendingAction && (
        <LoginPromptModal
          isOpen={isLoginPromptOpen}
          onClose={() => setIsLoginPromptOpen(false)}
          onConfirm={() => (window.location.href = "/login")}
          title="Login Required"
          message="Please login to continue."
        />
      )}
    </div>
  );
};
