/** @format */

import type { LateFeeResponseDTO } from "../types";
import API from "./api";

export const tenantLateFeeApi = {
  getAll: () => API.get<LateFeeResponseDTO[]>("/api/late-fees/tenant"),
  downloadPDF: (lateFeeId: number) =>
    API.get<Blob>(`/api/late-fees/download/${lateFeeId}`, {
      responseType: "blob",
    }),
};
