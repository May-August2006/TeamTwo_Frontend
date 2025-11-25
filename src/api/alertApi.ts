/** @format */

import type { ContractAlert } from "../types";
import API from "./api";

export const alertApi = {
  // Fetch all alerts (global, not per manager)
  getAll: () => API.get<ContractAlert[]>("/api/alerts"),

  // Save new alert (usually from WebSocket)
  create: (message: string) =>
    API.post<ContractAlert>("/api/alerts", { message }),

  // Mark an alert as read
  markRead: (alertId: number) =>
    API.post<void>(`/api/alerts/mark-read/${alertId}`),

  // (Optional) Fetch recent alerts, e.g., last 30 days
  getRecent: async () => {
    const res = await API.get<ContractAlert[]>("/api/alerts");
    return res.data.filter((alert) => {
      const daysOld =
        (new Date().getTime() - new Date(alert.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysOld <= 30;
    });
  },
};
