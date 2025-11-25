/** @format */
import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useContractAlerts } from "../hooks/useContractAlerts";
import { alertApi } from "../api/alertApi";
import type { ContractAlert } from "../types";
import { getAccessToken } from "../Auth";

export const AlertsDropdown = () => {
  const [alerts, setAlerts] = useState<ContractAlert[]>([]);
  const [open, setOpen] = useState(false);
  const jwtToken = getAccessToken(); // get current JWT
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch saved alerts from backend
  const fetchAlerts = async () => {
    try {
      const res = await alertApi.getAll();
      const filteredAlerts = res.data.filter((alert) => {
        const daysOld =
          (new Date().getTime() - new Date(alert.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysOld <= 30;
      });
      setAlerts(filteredAlerts);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      toast.error("Failed to load alerts");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Handle new alerts from WebSocket
  const handleNewAlert = useCallback((newAlert: ContractAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    toast.success(newAlert.message);
  }, []);

  useContractAlerts(jwtToken || "", handleNewAlert);

  // Mark an alert as read
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

  // Toggle dropdown
  const handleDropdownToggle = () => {
    setOpen(!open);
    if (!open) {
      alerts.forEach((alert) => {
        if (!alert.read) markRead(alert.id);
      });
    }
  };

  // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative ml-auto" ref={dropdownRef}>
      <Toaster position="top-right" />
      <button
        onClick={handleDropdownToggle}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow z-50 relative"
      >
        Alerts ({alerts.filter((a) => !a.read).length})
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded shadow-lg max-h-96 overflow-y-auto z-50">
          {alerts.length === 0 && (
            <div className="p-4 text-gray-500">No alerts</div>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2 border-b cursor-pointer ${
                alert.read ? "bg-gray-100" : "bg-white font-bold"
              }`}
            >
              <div>{alert.message}</div>
              <div className="text-xs text-gray-400">
                {new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
