/** @format */
import { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useTenantRemindersWebSocket } from "../../hooks/useTenantRemindersWebSocket";
import { tenantReminderApi } from "../../api/tenantReminderApi";

export default function MyReminders() {
  const { t } = useTranslation();
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

  if (loading) return (
    <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
      <div className="text-xl font-medium text-stone-700 animate-pulse">{t('tenant.loading')}</div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{t('tenant.remindersTitle')}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {connected ? `🟢 ${t('tenant.online')}` : `🔴 ${t('tenant.offline')}`}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
        {reminders.length === 0 && (
          <div className="p-8 text-center text-stone-500 bg-stone-50">
            <div className="text-5xl mb-3">📅</div>
            <div className="text-xl font-semibold text-stone-700">{t('tenant.noUpcomingPayments')}</div>
            <p className="text-sm mt-1">{t('tenant.allCaughtUp')}</p>
          </div>
        )}

        {reminders.map((r) => (
          <div
            key={r.id}
            className="flex justify-between px-6 py-4 hover:bg-red-50/50 transition duration-150 border-b border-stone-100 last:border-b-0"
          >
            <div>
              <p className="font-semibold text-stone-900">Invoice: {r.invoiceNumber}</p>
              <p className="text-sm text-stone-500 mt-1">{t('tenant.date')}: {r.dueDate}</p>
              <p className="text-sm font-semibold text-red-600 mt-1">{r.amount} MMK</p>
              <p className="text-sm text-stone-500 mt-1">{r.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}