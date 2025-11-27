/** @format */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentApi } from "../../api/appointmentApi";
import { useAppointmentsWebSocket } from "../../hooks/useAppointmentsWebSocket";
import type { AppointmentDTO } from "../../types";
import { AppointmentNotifications } from "../../components/notifications/AppointmentNotifications";

export default function AppointmentManagementPage() {
  const managerId = Number(localStorage.getItem("userId"));
  const jwtToken = localStorage.getItem("accessToken") || "";
  const navigate = useNavigate();

  const {
    appointments,
    setAppointments,
    sendStatusUpdate,
    connected,
    newAppointment,
  } = useAppointmentsWebSocket(jwtToken, managerId);

  const [loading, setLoading] = useState(true);

  const statusOptions: AppointmentDTO["status"][] = [
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ];

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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Appointments</h2>
        <AppointmentNotifications newAppointment={newAppointment} />
      </div>

      <div className="bg-white shadow rounded-lg divide-y">
        {appointments.map((a) => (
          <div
            key={a.id}
            onClick={() => navigate(`/manager/appointments/${a.id}`)}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {a.guestName}
              </p>
              <p className="text-sm text-gray-500 truncate">{a.guestEmail}</p>
              <p className="text-sm text-gray-500">
                {a.appointmentDate} — {a.appointmentTime}
              </p>
              <p className="text-sm text-gray-500 truncate">{a.purpose}</p>
              <p className="text-sm text-gray-500 truncate">{a.status}</p>
            </div>

            <div className="flex gap-2 ml-4 flex-shrink-0">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(a.id, status);
                  }}
                  className={`px-3 py-1 rounded text-white text-sm font-medium ${
                    status === "CONFIRMED"
                      ? "bg-green-600 hover:bg-green-700"
                      : status === "COMPLETED"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}

        {appointments.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No appointments</p>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        WebSocket: {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>
    </div>
  );
}
