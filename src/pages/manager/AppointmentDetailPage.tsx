/** @format */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { appointmentApi } from "../../api/appointmentApi";
import type { AppointmentDTO } from "../../types";
import { useTranslation } from "react-i18next";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const managerId = Number(localStorage.getItem("userId"));
  const { t } = useTranslation();

  useEffect(() => {
    const loadAppointment = async () => {
      if (!id) return;
      try {
        const res = await appointmentApi.getById(Number(id));
        setAppointment(res.data);
      } catch (err) {
        console.error("Failed to load appointment", err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id]);

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

  const updateStatus = async (status: string) => {
    if (!appointment) return;
    
    try {
      await appointmentApi.updateStatus(appointment.id, status as any, managerId);
      
      // Update UI immediately
      setAppointment(prev => prev ? { ...prev, status } : null);
      
      // Optional: Show success message
      alert(t('appointments.markedAs', "Appointment marked as {status}", { status }));
    } catch (err) {
      console.error("Status update failed:", err);
      alert(t('appointments.updateFailed', "Failed to update status"));
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
        return "bg-stone-100 text-stone-800 border-stone-200";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "✅";
      case "COMPLETED":
        return "🏁";
      case "CANCELLED":
        return "❌";
      default:
        return "📝";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-xl font-medium text-stone-700 animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
          {t('appointments.loadingDetails', "Loading appointment details...")}
        </div>
      </div>
    );
  }
  
  if (!appointment) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold text-stone-700 mb-2">
            {t('appointments.notFound', "Appointment Not Found")}
          </div>
          <p className="text-stone-600 mb-6">
            {t('appointments.notFoundDesc', "The appointment you're looking for doesn't exist.")}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition duration-200 font-medium shadow-sm"
          >
            {t('common.goBack', "Go Back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-5 py-3 bg-white text-stone-700 rounded-xl hover:bg-stone-50 transition duration-200 font-medium shadow-sm border border-stone-200 hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('appointments.backToList', "Back to Appointments")}
          </button>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
              <span>{getStatusIcon(appointment.status)}</span>
              {appointment.status}
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-700 p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{appointment.guestName}</h1>
                <p className="text-stone-200 flex items-center gap-2">
                  <span>📧</span>
                  {appointment.guestEmail}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-stone-100">{appointment.appointmentDate}</div>
                <div className="text-stone-200 flex items-center gap-2 justify-end">
                  <span>🕒</span>
                  {formatTime(appointment.appointmentTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-stone-500">👤</span>
                    {t('appointments.contactInfo', "Contact Information")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📞</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.phoneNumber', "Phone Number")}
                        </p>
                        <p className="font-semibold text-stone-900">
                          {appointment.guestPhone || t('appointments.notProvided', "Not provided")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📧</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.emailAddress', "Email Address")}
                        </p>
                        <p className="font-semibold text-stone-900 break-all">{appointment.guestEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-stone-500">🏢</span>
                    {t('appointments.locationDetails', "Location Details")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">🏛️</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.branch', "Branch")}
                        </p>
                        <p className="font-semibold text-stone-900">
                          {appointment.branchName || t('appointments.notSpecified', "Not specified")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">🏬</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.building', "Building")}
                        </p>
                        <p className="font-semibold text-stone-900">
                          {appointment.buildingName || t('appointments.notSpecified', "Not specified")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📑</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.level', "Level")}
                        </p>
                        <p className="font-semibold text-stone-900">
                          {appointment.levelName || t('appointments.notSpecified', "Not specified")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Appointment Details */}
                <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-stone-500">📅</span>
                    {t('appointments.appointmentDetails', "Appointment Details")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📍</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.unit', "Unit")}
                        </p>
                        <p className="font-semibold text-stone-900">{appointment.unitNumber || t('appointments.notSpecified', "Not specified")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">🎯</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.purpose', "Purpose")}
                        </p>
                        <p className="font-semibold text-stone-900">{appointment.purpose}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📅</div>
                      <div>
                        <p className="text-sm text-stone-600">
                          {t('appointments.dateTime', "Date & Time")}
                        </p>
                        <p className="font-semibold text-stone-900">
                          {appointment.appointmentDate} at {formatTime(appointment.appointmentTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="border border-stone-200 rounded-xl p-5 bg-amber-50 shadow-sm">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-stone-500">📝</span>
                    {t('appointments.additionalNotes', "Additional Notes")}
                  </h3>
                  {appointment.notes ? (
                    <div className="space-y-3">
                      <p className="text-amber-900 leading-relaxed whitespace-pre-wrap bg-amber-100 p-4 rounded-xl border border-amber-200">
                        {appointment.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-3">📄</div>
                      <p className="text-amber-700 font-medium">
                        {t('appointments.noNotes', "No additional notes")}
                      </p>
                      <p className="text-amber-600 text-sm mt-1">
                        {t('appointments.noNotesDesc', "No notes were provided for this appointment")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => updateStatus("CONFIRMED")}
            className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusButtonColor("CONFIRMED")} shadow-sm hover:shadow-md`}
          >
            {t('appointments.markConfirmed', "Mark as CONFIRMED")}
          </button>
          <button
            onClick={() => updateStatus("COMPLETED")}
            className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusButtonColor("COMPLETED")} shadow-sm hover:shadow-md`}
          >
            {t('appointments.markCompleted', "Mark as COMPLETED")}
          </button>
          <button
            onClick={() => updateStatus("CANCELLED")}
            className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusButtonColor("CANCELLED")} shadow-sm hover:shadow-md`}
          >
            {t('appointments.markCancelled', "Mark as CANCELLED")}
          </button>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center">
          <p className="text-sm text-stone-500">
            {t('appointments.lastUpdated', "Last updated: {date} at {time}", {
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString()
            })}
          </p>
        </div>
      </div>
    </div>
  );
}