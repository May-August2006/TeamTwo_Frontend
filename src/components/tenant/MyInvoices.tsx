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
      console.log("ivnoices for tenant: " + res.data);
      res.data.forEach((inv) => seenInvoiceIds.current.add(inv.id));
    } catch {
      toast.error("Failed to load invoices");
      setInvoices([]);
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

  if (loading)
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">
          Loading Invoices...
        </div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          My Invoices
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            connected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connected ? "🟢 Online" : "🔴 Offline"}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
        {invoices.length === 0 && (
          <div className="p-8 text-center text-stone-500 bg-stone-50">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-xl font-semibold text-stone-700">
              No Invoices
            </div>
            <p className="text-sm mt-1">No invoices available at this time</p>
          </div>
        )}

        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex justify-between items-center px-6 py-4 hover:bg-red-50/50 transition duration-150 border-b border-stone-100 last:border-b-0"
          >
            <div>
              <p className="font-semibold text-stone-900">
                {inv.invoiceNumber}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                Issue: {inv.issueDate} • Due: {inv.dueDate}
              </p>
              <p className="text-sm font-semibold text-red-600 mt-1">
                {inv.totalAmount} MMK
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => viewPdf(inv)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-150 font-semibold transform active:scale-95"
              >
                View
              </button>

              <button
                onClick={() => downloadPdf(inv)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-150 font-semibold transform active:scale-95"
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
