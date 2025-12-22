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

  const statusOptions: AppointmentDTO["status"][] = [
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ];

  const formatTime = (timeString: string) => {
    if (!timeString) return t('appointments.notSpecified', "Not specified");
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
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

  // Calculate pagination
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Get exactly 10 appointments for current page
  const currentAppointments = appointments.slice(startIndex, endIndex);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
            <div className="text-2xl font-bold text-stone-900">{appointments.length}</div>
            <div className="text-sm text-stone-600">
              {t('appointments.totalAppointments', "Total Appointments")}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === "CONFIRMED").length}
            </div>
            <div className="text-sm text-stone-600">
              {t('appointments.confirmed', "Confirmed")}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === "COMPLETED").length}
            </div>
            <div className="text-sm text-stone-600">
              {t('appointments.completed', "Completed")}
            </div>
          </div>
        </div>

        {/* Page Info */}
        {appointments.length > 0 && (
          <div className="mb-4 text-sm text-stone-600 flex justify-between items-center">
            <div>
              {t('appointments.showing', "Showing")} <span className="font-semibold">{startIndex + 1}</span> {t('appointments.to', "to")}{" "}
              <span className="font-semibold">{Math.min(endIndex, appointments.length)}</span> {t('appointments.of', "of")}{" "}
              <span className="font-semibold">{appointments.length}</span> {t('appointments.appointments', "appointments")}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(a.id, status);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusButtonColor(status)} shadow-sm hover:shadow-md`}
                  >
                    {t('appointments.markAs', "Mark as {status}", { status })}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {appointments.length === 0 && (
            <div className="p-12 text-center text-stone-500 bg-stone-50">
              <div className="text-6xl mb-4">📅</div>
              <div className="text-xl font-semibold text-stone-700 mb-2">
                {t('appointments.noAppointments', "No Appointments Yet")}
              </div>
              <p className="text-stone-600 max-w-md mx-auto">
                {t('appointments.noAppointmentsDesc', "When new appointments are scheduled, they will appear here automatically.")}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {appointments.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white rounded-xl p-4 shadow-sm border border-stone-200">
            <div className="text-sm text-stone-600">
              {t('appointments.showingPerPage', "Showing {count} appointments per page", {
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
  );
}