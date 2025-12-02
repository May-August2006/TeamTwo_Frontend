/** @format */
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import type { LateFeeResponseDTO } from "../../types";
import { tenantLateFeeApi } from "../../api/tenantLateFeeApi";
import { useTenantLateFeesWebSocket } from "../../hooks/useTenantLateFeesWebSocket";

export default function MyLateFees() {
  const jwtToken = localStorage.getItem("accessToken") || "";

  const { lateFees, setLateFees, connected } =
    useTenantLateFeesWebSocket(jwtToken);

  const [loading, setLoading] = useState(true);
  const seenLateFeeIds = useRef<Set<number>>(new Set());

  /** --- Fetch all late fees on mount --- */
  const fetchLateFees = async () => {
    try {
      const res = await tenantLateFeeApi.getAll();
      setLateFees(res.data);

      // mark all existing invoices as seen
      res.data.forEach((lf) => seenLateFeeIds.current.add(lf.id));
    } catch {
      toast.error("Failed to load late fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLateFees();
  }, []);

  /** --- When websocket pushes new late fee, show toast only for new IDs --- */
  useEffect(() => {
    lateFees.forEach((lf) => {
      if (!seenLateFeeIds.current.has(lf.id)) {
        toast.success(`New Late Fee Added for ${lf.invoiceId}`);
        seenLateFeeIds.current.add(lf.id);
      }
    });
  }, [lateFees]);

  /** ----------------- VIEW PDF ----------------- */
  const viewPdf = async (lf: LateFeeResponseDTO) => {
    try {
      const res = await tenantLateFeeApi.downloadPDF(lf.id);

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      window.open(url, "_blank"); // ✅ open in new tab
    } catch {
      toast.error("PDF not available");
    }
  };

  /** ---------------- DOWNLOAD PDF ---------------- */
  const downloadPdf = async (lf: LateFeeResponseDTO) => {
    try {
      const res = await tenantLateFeeApi.downloadPDF(lf.id);

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = `latefee_${lf.invoiceId}.pdf`;
      a.click();
    } catch {
      toast.error("Download failed");
    }
  };

  if (loading) return <p>Loading late fees...</p>;

  return (
    <div className="p-4 space-y-4">
      <Toaster position="top-right" />

      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold">My Late Fees</h2>
        <span>{connected ? "🟢 Online" : "🔴 Offline"}</span>
      </div>

      <div className="bg-white shadow rounded divide-y">
        {lateFees.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No late fees</p>
        )}

        {lateFees.map((lf) => (
          <div
            key={lf.id}
            className="flex justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">Invoice ID: {lf.invoiceId}</p>
              <p className="text-sm text-gray-500">
                Applied: {lf.appliedDate} • Days Late: {lf.lateDays}
              </p>
              <p className="text-sm text-gray-600">
                Amount: {lf.appliedAmount} MMK
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => viewPdf(lf)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                View
              </button>

              <button
                onClick={() => downloadPdf(lf)}
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
