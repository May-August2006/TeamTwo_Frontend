/** @format */

import API from "./api";
import type { ReminderDTO } from "../types";

export const tenantReminderApi = {
  /** Get all reminders for logged-in tenant */
  getAll: () => API.get<ReminderDTO[]>(`/api/tenant/reminders`),

  markAsRead: (id: number) => API.put(`/api/tenant/reminders/${id}/read`),
};
