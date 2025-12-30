/** @format */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentApi } from "../../api/appointmentApi";
import { useAppointmentsWebSocket } from "../../hooks/useAppointmentsWebSocket";
import type { AppointmentDTO } from "../../types";
import { AppointmentNotifications } from "../../components/notifications/AppointmentNotifications";
import { useTranslation } from "react-i18next";

export default function AppointmentManagementPage() {
  const managerId = Number(localStorage.getItem("userId"));
  const jwtToken = localStorage.getItem("accessToken") || "";
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    appointments,
    setAppointments,
    sendStatusUpdate,
    connected,
    newAppointment,
  } = useAppointmentsWebSocket(jwtToken, managerId);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: number;
    status: string;
    guestName: string;
  } | null>(null);

  // Filter states - SIMPLIFIED: Just date picker
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions: AppointmentDTO["status"][] = [
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ];

  const formatTime = (timeString: string) => {
  if (!timeString) return t('appointments.notSpecified', "Not specified");
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Group times into ranges
    if (hours >= 9 && hours < 11) {
      return "9 AM - 10:59 AM";
    } else if (hours >= 11 && hours < 13) {
      return "11 AM - 12:59 PM";
    } else if (hours >= 13 && hours < 15) {
      return "1 PM - 2:59 PM";
    } else if (hours >= 15 && hours < 17) {
      return "3 PM - 4:59 PM";
    } else {
      // For times outside these ranges, show actual time
      const isPM = hours >= 12;
      const twelveHour = hours % 12 || 12;
      const period = isPM ? 'PM' : 'AM';
      return `${twelveHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  } catch (e) {
    return timeString;
  }
};

  const loadAppointments = async () => {
    try {
      const res = await appointmentApi.getByManager(managerId);
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Filter appointments - SIMPLIFIED: Just exact date match
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Date filter - exact match
      if (selectedDate && appointment.appointmentDate !== selectedDate) {
        return false;
      }
      
      // Time filter - check which range the appointment falls into
    if (timeFilter) {
      const [hours] = appointment.appointmentTime?.split(':').map(Number) || [0];
      
      // Map timeFilter to hour ranges
      if (timeFilter === "9-10" && (hours < 9 || hours >= 11)) {
        return false;
      } else if (timeFilter === "11-12" && (hours < 11 || hours >= 13)) {
        return false;
      } else if (timeFilter === "1-2" && (hours < 13 || hours >= 15)) {
        return false;
      } else if (timeFilter === "3-4" && (hours < 15 || hours >= 17)) {
        return false;
      }
    }
      
      // Status filter
      if (statusFilter !== "ALL" && appointment.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [appointments, selectedDate, timeFilter, statusFilter]);

  // Update the uniqueTimeSlots to show the ranges
const timeRangeOptions = useMemo(() => {
  return [
    { value: "9-10", label: "9 AM - 10:59 AM" },
    { value: "11-12", label: "11 AM - 12:59 PM" },
    { value: "1-2", label: "1 PM - 2:59 PM" },
    { value: "3-4", label: "3 PM - 4:59 PM" },
  ];
}, []);

  // Calculate pagination with filtered appointments
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Get exactly 10 appointments for current page
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, timeFilter, statusFilter]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await appointmentApi.updateStatus(id, status as any, managerId);

      // Update UI immediately
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );

      // Notify WebSocket listeners
      sendStatusUpdate(id, status);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleStatusButtonClick = (id: number, status: string, guestName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingUpdate({ id, status, guestName });
    setShowConfirmModal(true);
  };

  const confirmStatusUpdate = () => {
    if (pendingUpdate) {
      updateStatus(pendingUpdate.id, pendingUpdate.status);
      setShowConfirmModal(false);
      setPendingUpdate(null);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDate("");
    setTimeFilter("");
    setStatusFilter("ALL");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusButtonColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500 hover:bg-green-600 focus:ring-green-300";
      case "COMPLETED":
        return "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300";
      case "CANCELLED":
        return "bg-red-500 hover:bg-red-600 focus:ring-red-300";
      default:
        return "bg-gray-500 hover:bg-gray-600 focus:ring-gray-300";
    }
  };

  // Get unique time slots for time filter (just hours)
  const uniqueTimeSlots = useMemo(() => {
    const times = appointments
      .map(a => a.appointmentTime?.split(':')[0]) // Get just the hour part
      .filter(Boolean);
    return [...new Set(times)].sort();
  }, [appointments]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-xl font-medium text-stone-700 animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
          {t('appointments.loading', "Loading appointments...")}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && pendingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-200 scale-100 opacity-100">
            <div className="flex justify-between items-center p-6 border-b border-stone-200">
              <h3 className="text-xl font-bold text-stone-900">
                {t('appointments.statusUpdate', "Status Update")}
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-stone-700 mb-4">
                  {t('appointments.statusUpdateConfirm', { 
                    status: pendingUpdate.status 
                  })}
                </p>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="font-medium text-stone-900">
                    {pendingUpdate.guestName}
                  </p>
                  <p className="text-sm text-stone-600 mt-1">
                    New Status:{" "}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pendingUpdate.status)}`}>
                      {pendingUpdate.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors duration-200 focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
                >
                  {t('appointments.cancel', "Cancel")}
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusButtonColor(pendingUpdate.status)}`}
                >
                  {t('appointments.confirm', "Confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                {t('appointments.title', "Appointment Management")}
              </h2>
              <p className="text-stone-600">
                {t('appointments.subtitle', "Manage and track all your appointments")}
              </p>
            </div>
            <AppointmentNotifications newAppointment={newAppointment} />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
              <div className="text-2xl font-bold text-stone-900">{filteredAppointments.length}</div>
              <div className="text-sm text-stone-600">
                {t('appointments.totalAppointments', "Total Appointments")}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
              <div className="text-2xl font-bold text-green-600">
                {filteredAppointments.filter(a => a.status === "CONFIRMED").length}
              </div>
              <div className="text-sm text-stone-600">
                {t('appointments.confirmed', "Confirmed")}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAppointments.filter(a => a.status === "COMPLETED").length}
              </div>
              <div className="text-sm text-stone-600">
                {t('appointments.completed', "Completed")}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
              <div className="text-2xl font-bold text-orange-600">
                {filteredAppointments.filter(a => a.status === "CANCELLED").length}
              </div>
              <div className="text-sm text-stone-600">
                Cancelled
              </div>
            </div>
          </div>

          {/* Filter Section - SIMPLIFIED: Just date input, time dropdown, status dropdown */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-stone-900">
                  Filters
                </h3>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors duration-200"
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {(selectedDate || timeFilter || statusFilter !== "ALL") && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors duration-200"
                  >
                    Clear Filters
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-stone-50 rounded-lg">
                {/* Date Filter - SIMPLIFIED: Single date input */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors duration-200"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate("")}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Clear date
                    </button>
                  )}
                </div>

                {/* Time Filter */}
<div>
  <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
    Filter by Time Slot
  </label>
  <select
    value={timeFilter}
    onChange={(e) => setTimeFilter(e.target.value)}
    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors duration-200"
  >
    <option value="">All Time Slots</option>
    {timeRangeOptions.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
</div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors duration-200"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(selectedDate || timeFilter || statusFilter !== "ALL") && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                  
                  {selectedDate && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Date: {selectedDate}
                      <button
                        onClick={() => setSelectedDate("")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                  
                  {timeFilter && (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
    Time: {timeRangeOptions.find(opt => opt.value === timeFilter)?.label || timeFilter}
    <button
      onClick={() => setTimeFilter("")}
      className="text-blue-600 hover:text-blue-800"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </span>
)}
                  
                  {statusFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter("ALL")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Page Info */}
          {filteredAppointments.length > 0 && (
            <div className="mb-4 text-sm text-stone-600 flex justify-between items-center">
              <div>
                {t('appointments.showing', "Showing")} <span className="font-semibold">{startIndex + 1}</span> {t('appointments.to', "to")}{" "}
                <span className="font-semibold">{Math.min(endIndex, filteredAppointments.length)}</span> {t('appointments.of', "of")}{" "}
                <span className="font-semibold">{filteredAppointments.length}</span> {t('appointments.appointments', "appointments")}
                {(selectedDate || timeFilter || statusFilter !== "ALL") && (
                  <span className="text-orange-600 ml-2">
                    (filtered from {appointments.length} total)
                  </span>
                )}
              </div>
              <div className="text-sm text-stone-600">
                {t('appointments.page', "Page")} <span className="font-semibold">{currentPage}</span> {t('appointments.of', "of")}{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
            </div>
          )}

          {/* Appointments List */}
          <div className="bg-white shadow-lg rounded-2xl border border-stone-200 overflow-hidden mb-6">
            {currentAppointments.map((a, index) => (
              <div
                key={a.id}
                onClick={() => navigate(`/manager/appointments/${a.id}`)}
                className={`flex flex-col lg:flex-row lg:items-center justify-between p-6 transition-all duration-200 hover:bg-stone-50 cursor-pointer ${
                  index !== currentAppointments.length - 1 ? "border-b border-stone-100" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <h3 className="font-semibold text-stone-900 text-lg truncate">
                      {a.guestName}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-stone-600">
                      <span className="text-stone-400">📧</span>
                      <span className="truncate">{a.guestEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      <span className="text-stone-400">📍</span>
                      <span>{a.unitNumber}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-stone-600">
                      <span className="text-stone-400">📅</span>
                      <span>{a.appointmentDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      <span className="text-stone-400">⏰</span>
                      <span>{formatTime(a.appointmentTime)}</span>
                    </div>
                  </div>
                  
                  {a.purpose && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-stone-600">
                      <span className="text-stone-400 mt-0.5">🎯</span>
                      <span className="line-clamp-2">{a.purpose}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={(e) => handleStatusButtonClick(a.id, status, a.guestName, e)}
                      className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusButtonColor(status)} shadow-sm hover:shadow-md`}
                    >
                      {t('appointments.markAs', { status })}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredAppointments.length === 0 && (
              <div className="p-12 text-center text-stone-500 bg-stone-50">
                <div className="text-6xl mb-4">🔍</div>
                <div className="text-xl font-semibold text-stone-700 mb-2">
                  No Matching Appointments
                </div>
                <p className="text-stone-600 max-w-md mx-auto mb-6">
                  {appointments.length === 0 
                    ? t('appointments.noAppointmentsDesc', "When new appointments are scheduled, they will appear here automatically.")
                    : "No appointments match your current filters. Try adjusting your filter criteria."}
                </p>
                {(selectedDate || timeFilter || statusFilter !== "ALL") && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors duration-200 mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredAppointments.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white rounded-xl p-4 shadow-sm border border-stone-200">
              <div className="text-sm text-stone-600">
                {t('appointments.showingPerPage', {
                  count: currentAppointments.length
                })}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentPage === 1
                      ? "text-stone-400 cursor-not-allowed"
                      : "text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {t('appointments.first', "First")}
                </button>

                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentPage === 1
                      ? "text-stone-400 cursor-not-allowed"
                      : "text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {t('appointments.previous', "Previous")}
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                          currentPage === pageNum
                            ? "bg-stone-800 text-white"
                            : "text-stone-700 hover:bg-stone-100 border border-stone-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages
                      ? "text-stone-400 cursor-not-allowed"
                      : "text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {t('appointments.next', "Next")}
                </button>

                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages
                      ? "text-stone-400 cursor-not-allowed"
                      : "text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {t('appointments.last', "Last")}
                </button>
              </div>
              
              <div className="text-sm text-stone-600">
                {t('appointments.page', "Page")} <span className="font-semibold">{currentPage}</span> {t('appointments.of', "of")}{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
            <span className="text-stone-500">
              {connected ? t('appointments.connected', "Live updates connected") : t('appointments.disconnected', "Connection offline")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}