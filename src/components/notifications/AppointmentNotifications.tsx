/** @format */
import { Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { AppointmentDTO } from "../../types";

interface Props {
  socketAppointments: AppointmentDTO[];
}

export function AppointmentNotifications({ socketAppointments }: Props) {
  const [notifications, setNotifications] = useState<AppointmentDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  // Track IDs we've already shown in notifications
  const seenIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (socketAppointments.length === 0) return;

    const latest = socketAppointments[socketAppointments.length - 1];

    // Only add if it's truly new
    if (!seenIds.current.has(latest.id)) {
      seenIds.current.add(latest.id);

      setNotifications((prev) => [latest, ...prev]); // prepend to show newest on top
      setUnread((prev) => prev + 1);
    }
  }, [socketAppointments]);

  const markAsRead = () => {
    setUnread(0);
    setOpen(!open);
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button onClick={markAsRead} className="relative p-2">
        <Bell size={24} />

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border p-3 z-50">
          <h3 className="font-semibold mb-2">Recent Appointments</h3>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="border-b py-2 last:border-none">
                <p className="font-medium">{n.guestName}</p>
                <p className="text-xs text-gray-500">
                  {n.appointmentDate} at {n.appointmentTime}
                </p>
                <p className="text-sm">Purpose: {n.purpose}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
