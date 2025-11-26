/** @format */
import { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import { useTenantRemindersWebSocket } from "../../hooks/useTenantRemindersWebSocket";

import { tenantReminderApi } from "../../api/tenantReminderApi";

export default function MyReminders() {
  const jwtToken = localStorage.getItem("accessToken") || "";

  const { reminders, setReminders, connected } =
    useTenantRemindersWebSocket(jwtToken);

  const [loading, setLoading] = useState(true);
  const seenReminderIds = useRef<Set<number>>(new Set());

  /** Fetch all reminders from API */
  const fetchReminders = async () => {
    try {
      const res = await tenantReminderApi.getAll();
      setReminders(res.data);
      console.log("reminders " + res.data);
      res.data.forEach((r) => seenReminderIds.current.add(r.id));
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  /** Show toast only for new reminders from WebSocket */
  useEffect(() => {
    reminders.forEach((r) => {
      if (!seenReminderIds.current.has(r.id)) {
        toast.success(`Rental Reminder: ${r.amount} MMK due on ${r.dueDate}`, {
          duration: 7000,
        });
        seenReminderIds.current.add(r.id);
      }
    });
  }, [reminders]);

  if (loading) return <p>Loading reminders...</p>;

  return (
    <div className="p-4 space-y-4">
      <Toaster position="top-right" />

      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold">My Reminders</h2>
        <span>{connected ? "🟢 Online" : "🔴 Offline"}</span>
      </div>

      <div className="bg-white shadow rounded divide-y">
        {reminders.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No upcoming payments</p>
        )}

        {reminders.map((r) => (
          <div
            key={r.id}
            className="flex justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">Invoice: {r.invoiceNumber}</p>
              <p className="text-sm text-gray-500">Due Date: {r.dueDate}</p>
              <p className="text-sm text-gray-500">{r.amount} MMK</p>
              <p className="text-sm text-gray-500">{r.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
