/** @format */

import type {
  LateFeePolicyDTO,
  LateFeePolicyRequest,
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

  // Get all late fees for a specific invoice by invoiceId
  getByInvoiceId: (invoiceId: number) =>
    API.get<LateFeeResponseDTO[]>(`/api/late-fees/invoice/${invoiceId}`),

  // Fetch the single policy (returns null if not created yet)
  getPolicy: async (): Promise<LateFeePolicyDTO | null> => {
    try {
      const response = await API.get<LateFeePolicyDTO>("/api/late-fee-policy");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No policy exists yet
      }
      throw error; // rethrow other errors
    }
  },

  // Create or replace the policy
  createPolicy: (data: LateFeePolicyRequest) =>
    API.post<LateFeePolicyDTO>("/api/late-fee-policy", data),

  // Update the existing policy
  updatePolicy: (data: LateFeePolicyRequest) =>
    API.put<LateFeePolicyDTO>("/api/late-fee-policy", data),

  // Get late fees for the logged-in tenant
  getTenantLateFees: () =>
    API.get<LateFeeResponseDTO[]>("/api/late-fees/tenant"),
};
