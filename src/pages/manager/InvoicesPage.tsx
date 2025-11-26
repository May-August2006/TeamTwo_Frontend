/** @format */
import { useEffect, useState, useRef } from "react";
import { useInvoicesWebSocket } from "../../hooks/useInvoicesWebSocket";
import toast, { Toaster } from "react-hot-toast";
import type { InvoiceDTO } from "../../types";
import { invoiceApi } from "../../api/InvoiceAPI";

export default function InvoicesPage() {
  const jwtToken = localStorage.getItem("accessToken") || "";
  const { invoices, setInvoices, connected } = useInvoicesWebSocket(jwtToken);
  const [loading, setLoading] = useState(true);

  // Track which invoices have already shown a toast
  const seenInvoiceIds = useRef<Set<number>>(new Set());

  /** Fetch all invoices from API */
  const fetchInvoices = async () => {
    try {
      const res = await invoiceApi.getAll();
      setInvoices(res.data);
      // Mark all existing invoices as seen (no toast for old ones)
      res.data.forEach((inv) => seenInvoiceIds.current.add(inv.id));
    } catch (err) {
      console.error("Failed to load invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  /** Show toast only for new invoices arriving via WebSocket */
  useEffect(() => {
    invoices.forEach((inv) => {
      if (!seenInvoiceIds.current.has(inv.id)) {
        toast.success(`New Invoice Generated: ${inv.invoiceNumber}`, {
          duration: 5000,
        });
        seenInvoiceIds.current.add(inv.id);
      }
    });
  }, [invoices]);

  /** View PDF in a new window using API */
  const viewPdf = async (invoice: InvoiceDTO) => {
    if (!invoice.id) return toast.error("PDF not available");

    const apiUrl = `/api/invoices/download/${invoice.id}`;

    try {
      const res = await invoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const newWindow = window.open(url, "_blank");
      if (!newWindow) toast.error("Popup blocked by browser");
      else
        console.log(
          `Successfully opened PDF for invoice ${invoice.invoiceNumber}.  API URL: ${apiUrl}`
        );
    } catch (err) {
      console.error("Failed to view PDF:", err);
      toast.error("PDF not available");
    }
  };

  /** Download PDF using API */
  const downloadPdf = async (invoice: InvoiceDTO) => {
    if (!invoice.id) return toast.error("PDF not available");

    const apiUrl = `/api/invoices/download/${invoice.id}`;

    try {
      const res = await invoiceApi.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      console.log(
        `Successfully downloaded PDF for invoice ${invoice.invoiceNumber}. API URL: ${apiUrl}`
      );
    } catch (err) {
      console.error("Failed to download PDF:", err);
      toast.error("Download failed");
    }
  };

  if (loading) return <p>Loading invoices...</p>;

  return (
    <div className="p-4">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Invoices</h2>
        <p className="text-sm text-gray-500">
          WebSocket: {connected ? "Connected" : "Disconnected"}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg divide-y">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {inv.invoiceNumber}
              </p>
              <p className="text-sm text-gray-500">
                Tenant: {inv.tenantName} — Room: {inv.roomNumber}
              </p>
              <p className="text-sm text-gray-500">
                Issue Date: {inv.issueDate} — Due Date: {inv.dueDate}
              </p>
              <p className="text-sm text-gray-500">
                Amount: {inv.totalAmount} MMK — Status: {inv.invoiceStatus}
              </p>
            </div>

            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button
                onClick={() => viewPdf(inv)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                View
              </button>
              <button
                onClick={() => downloadPdf(inv)}
                className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
              >
                Download
              </button>
            </div>
          </div>
        ))}
        {invoices.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No invoices found</p>
        )}
      </div>
    </div>
  );
}
