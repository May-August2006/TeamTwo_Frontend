/** @format */
import { useEffect, useState, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useContractAlerts } from "../hooks/useContractAlerts";
import { alertApi } from "../api/alertApi";
import type { ContractAlert } from "../types";
import { getAccessToken } from "../Auth";
import { Bell } from "lucide-react";

export const AlertsDropdown = () => {
  const jwtToken = getAccessToken();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<ContractAlert[]>([]);

  // ----------------------------
  // Fetch alerts from database on mount
  // ----------------------------
  const fetchAlerts = async () => {
    try {
      const res = await alertApi.getAll();
      // Filter alerts to last 30 days (optional)
      const filtered = res.data.filter((a: ContractAlert) => {
        const daysOld =
          (new Date().getTime() - new Date(a.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysOld <= 30;
      });
      setAlerts(filtered);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      toast.error("Failed to load alerts");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // ----------------------------
  // WebSocket hook for new alerts
  // ----------------------------
  const { alerts: wsAlerts, connected } = useContractAlerts(jwtToken || "");

  useEffect(() => {
    // Only add new alerts that are not in the current list
    wsAlerts.forEach((alert) => {
      if (!alerts.find((a) => a.id === alert.id)) {
        setAlerts((prev) => [alert, ...prev]);
        if (!alert.read) toast.success(alert.message, { duration: 7000 });
      }
    });
  }, [wsAlerts]);

  // ----------------------------
  // Mark alert as read
  // ----------------------------
  const markRead = async (alertId: number) => {
    try {
      await alertApi.markRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
      toast.error("Failed to mark alert as read");
    }
  };

  // ----------------------------
  // Dropdown toggle
  // ----------------------------
  const handleDropdownToggle = () => {
    setOpen((prev) => {
      const newOpen = !prev;
      if (newOpen) {
        alerts.forEach((alert) => {
          if (!alert.read) markRead(alert.id);
        });
      }
      return newOpen;
    });
  };

  // ----------------------------
  // Close dropdown when clicking outside
  // ----------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="relative ml-auto" ref={dropdownRef}>
      <Toaster position="top-right" />

      {/* 🔔 Bell Icon Button */}
      <button
        onClick={handleDropdownToggle}
        className="relative p-2 rounded-lg hover:bg-[#EBDCCB] transition"
      >
        <Bell className="w-6 h-6 text-[#C8102E]" />

        {/* 🔴 Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#C8102E] text-white text-xs px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}

        {/* 🟢 Connection indicator */}
        <span
          className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
            connected ? "bg-green-500" : "bg-gray-400"
          }`}
        ></span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-[#C8102E] rounded shadow-lg max-h-96 overflow-y-auto z-50">
          {alerts.length === 0 && (
            <div className="p-4 text-gray-500">No alerts</div>
          )}

          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-b ${
                alert.read
                  ? "bg-gray-100"
                  : "bg-[#FFF1F1] font-semibold border-l-4 border-[#C8102E]"
              }`}
            >
              <div className="text-[#C8102E]">{alert.message}</div>
              <div className="text-xs text-gray-500">
                {new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
