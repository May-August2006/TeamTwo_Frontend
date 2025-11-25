/** @format */

import API from "./api";
import type { InvoiceDTO } from "../types";

export const tenantInvoiceApi = {
  getAll: () => API.get<InvoiceDTO[]>(`/api/tenant/invoices`),
  downloadPDF: (invoiceId: number) =>
    API.get(`/api/tenant/invoices/download/${invoiceId}`, {
      responseType: "blob",
    }),
};
