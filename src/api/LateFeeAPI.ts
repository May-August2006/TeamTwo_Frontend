/** @format */

import type {
  LateFeePolicy,
  LateFeeRequest,
  LateFeeResponseDTO,
} from "../types";
import API from "./api";

export const lateFeeApi = {
  // Create a manual late fee
  addManualLateFee: (data: LateFeeRequest) =>
    API.post<LateFeeResponseDTO>("/api/late-fees/add", data),

  // Download generated PDF (returns blob)
  downloadLateFeePdf: (lateFeeId: number) =>
    API.get<Blob>(`/api/late-fees/download/${lateFeeId}`, {
      responseType: "blob",
    }),

  // Fetch policy (if you have this endpoint)
  getPolicy: () => API.get<LateFeePolicy>("/api/late-fee-policy/current"),

  // Update policy
  updatePolicy: (id: number, data: LateFeePolicy) =>
    API.put(`/api/late-fee-policy/update/${id}`, data),

  getByInvoiceId: (invoiceId: number) =>
    API.get<LateFeeResponseDTO[]>(`/api/late-fees/invoice/${invoiceId}`),

  // Get late fees for the logged-in tenant
  getTenantLateFees: () =>
    API.get<LateFeeResponseDTO[]>("/api/late-fees/tenant"),
};
