/** @format */

import type { AppointmentDTO, AppointmentRequest } from "../types";
import API from "./api";

export const appointmentApi = {
  // Book appointment
  book: (userId: number, data: AppointmentRequest) =>
    API.post<AppointmentDTO>(`/api/appointments/book`, data, {
      params: { userId },
    }),

  // (Optional) Get all appointments of logged-in user
  getByUser: (userId: number) =>
    API.get<AppointmentDTO[]>(`/api/appointments/user/${userId}`),

  getByManager: (managerId: number) =>
    API.get<AppointmentDTO[]>(`/api/appointments/manager/${managerId}`),

  // (Optional) View one appointment
  getById: (id: number) => API.get<AppointmentDTO>(`/api/appointments/${id}`),

  // (Optional) Cancel appointment
  cancel: (id: number) => API.put<void>(`/api/appointments/${id}/cancel`),

  // ✅ Update appointment status (PATCH)
  updateStatus: (
    appointmentId: number,
    status: "SCHEDULED" | "CONFIRMED" | "REJECTED" | "CANCELLED",
    managerId: number
  ) =>
    API.patch<AppointmentDTO>(
      `/api/appointments/${appointmentId}/status`,
      null,
      {
        params: { status, managerId },
      }
    ),
};
