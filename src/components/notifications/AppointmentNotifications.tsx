/** @format */
import { Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { AppointmentDTO } from "../../types";

interface Props {
  newAppointment: AppointmentDTO | null;
}

export function AppointmentNotifications({ newAppointment }: Props) {
  const [notifications, setNotifications] = useState<AppointmentDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  // Track shown IDs
  const seenIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!newAppointment) return;

    // Avoid duplicates
    if (!seenIds.current.has(newAppointment.id)) {
      seenIds.current.add(newAppointment.id);

      setNotifications((prev) => [newAppointment, ...prev]);
      setUnread((prev) => prev + 1);
    }
  }, [newAppointment]);

  const markAsRead = () => {
    setUnread(0);
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button onClick={markAsRead} className="relative p-2">
        <Bell size={24} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {unread}
          </span>
        )}
      </button>

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
