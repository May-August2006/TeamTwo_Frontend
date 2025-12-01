/** @format */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { appointmentApi } from "../../api/appointmentApi";
import type { AppointmentDTO } from "../../types";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);

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
          Loading appointment details...
        </div>
      </div>
    );
  }
  
  if (!appointment) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold text-stone-700 mb-2">Appointment Not Found</div>
          <p className="text-stone-600 mb-6">The appointment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition duration-200 font-medium shadow-sm"
          >
            Go Back
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
            Back to Appointments
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
                  {appointment.appointmentTime}
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
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📞</div>
                      <div>
                        <p className="text-sm text-stone-600">Phone Number</p>
                        <p className="font-semibold text-stone-900">
                          {appointment.guestPhone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📧</div>
                      <div>
                        <p className="text-sm text-stone-600">Email Address</p>
                        <p className="font-semibold text-stone-900 break-all">{appointment.guestEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-stone-500">🏢</span>
                    Location Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">🏛️</div>
                      <div>
                        <p className="text-sm text-stone-600">Branch</p>
                        <p className="font-semibold text-stone-900">
                          {appointment.branchName || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">🏬</div>
                      <div>
                        <p className="text-sm text-stone-600">Building</p>
                        <p className="font-semibold text-stone-900">
                          {appointment.buildingName || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📑</div>
                      <div>
                        <p className="text-sm text-stone-600">Level</p>
                        <p className="font-semibold text-stone-900">
                          {appointment.levelName || "Not specified"}
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
                    Appointment Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📍</div>
                      <div>
                        <p className="text-sm text-stone-600">Room</p>
                        <p className="font-semibold text-stone-900">Room #{appointment.roomId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">🎯</div>
                      <div>
                        <p className="text-sm text-stone-600">Purpose</p>
                        <p className="font-semibold text-stone-900">{appointment.purpose}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="text-2xl text-stone-400">📅</div>
                      <div>
                        <p className="text-sm text-stone-600">Date & Time</p>
                        <p className="font-semibold text-stone-900">
                          {appointment.appointmentDate} at {appointment.appointmentTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="border border-stone-200 rounded-xl p-5 bg-amber-50 shadow-sm">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-stone-500">📝</span>
                    Additional Notes
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
                      <p className="text-amber-700 font-medium">No additional notes</p>
                      <p className="text-amber-600 text-sm mt-1">No notes were provided for this appointment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center">
          <p className="text-sm text-stone-500">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}