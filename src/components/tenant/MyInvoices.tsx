/** @format */
import { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import { useTenantInvoicesWebSocket } from "../../hooks/useTenantInvoicesWebSocket";
import type { InvoiceDTO } from "../../types";
import { tenantInvoiceApi } from "../../api/tenantInvoiceApi";

export default function MyInvoices() {
  const jwtToken = localStorage.getItem("accessToken") || "";

  const { invoices, setInvoices, connected } =
    useTenantInvoicesWebSocket(jwtToken);

  const [loading, setLoading] = useState(true);
  const seenInvoiceIds = useRef<Set<number>>(new Set());

  const fetchInvoices = async () => {
    try {
      const res = await tenantInvoiceApi.getAll();
      setInvoices(res.data);
      res.data.forEach((inv) => seenInvoiceIds.current.add(inv.id));
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    invoices.forEach((inv) => {
      if (!seenInvoiceIds.current.has(inv.id)) {
        toast.success(`New Invoice: ${inv.invoiceNumber}`);
        seenInvoiceIds.current.add(inv.id);
      }
    });
  }, [invoices]);

  const viewPdf = async (invoice: InvoiceDTO) => {
    try {
      const res = await tenantInvoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
    } catch {
      toast.error("PDF not available");
    }
  };

  const downloadPdf = async (invoice: InvoiceDTO) => {
    try {
      const res = await tenantInvoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
    } catch {
      toast.error("Download failed");
    }
  };

  if (loading) return <p>Loading invoices...</p>;

  return (
    <div className="p-4 space-y-4">
      <Toaster position="top-right" />

      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold">My Invoices</h2>
        <span>{connected ? "🟢 Online" : "🔴 Offline"}</span>
      </div>

      <div className="bg-white shadow rounded divide-y">
        {invoices.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No invoices</p>
        )}

        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{inv.invoiceNumber}</p>
              <p className="text-sm text-gray-500">
                Issue: {inv.issueDate} • Due: {inv.dueDate}
              </p>
              <p className="text-sm text-gray-500">{inv.totalAmount} MMK</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => viewPdf(inv)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                View
              </button>

              <button
                onClick={() => downloadPdf(inv)}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
