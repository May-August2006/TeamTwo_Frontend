/** @format */
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { LateFeeResponseDTO } from "../../types";
import { tenantLateFeeApi } from "../../api/tenantLateFeeApi";
import { useTenantLateFeesWebSocket } from "../../hooks/useTenantLateFeesWebSocket";
import { Pagination } from "../../components/Pagination";

export default function MyLateFees() {
  const { t } = useTranslation();
  const jwtToken = localStorage.getItem("accessToken") || "";

  const { lateFees, setLateFees, connected } =
    useTenantLateFeesWebSocket(jwtToken);

  const [loading, setLoading] = useState(true);
  const seenLateFeeIds = useRef<Set<number>>(new Set());

  // 🔹 pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  /** --- Fetch all late fees on mount --- */
  const fetchLateFees = async () => {
    try {
      const res = await tenantLateFeeApi.getAll();
      setLateFees(res.data);

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

  /** --- WS: toast only for new IDs --- */
  useEffect(() => {
    lateFees.forEach((lf) => {
      if (!seenLateFeeIds.current.has(lf.id)) {
        toast.success(`New Late Fee Added for ${lf.invoiceId}`);
        seenLateFeeIds.current.add(lf.id);
      }
    });
  }, [lateFees]);

  /** ---------------- VIEW PDF ---------------- */
  const viewPdf = async (lf: LateFeeResponseDTO) => {
    try {
      const res = await tenantLateFeeApi.downloadPDF(lf.id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
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

  if (loading)
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">
          {t("tenant.loading")}
        </div>
      </div>
    );

  // 🔹 pagination slice
  const totalItems = lateFees.length;
  const start = (currentPage - 1) * pageSize;
  const pagedLateFees = lateFees.slice(start, start + pageSize);

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t("tenant.lateFeesTitle")}</h2>
        <span>
          {connected ? `🟢 ${t("tenant.online")}` : `🔴 ${t("tenant.offline")}`}
        </span>
      </div>

      <div className="bg-white shadow rounded divide-y">
        {totalItems === 0 && (
          <p className="p-4 text-gray-500 text-center">{t("tenant.noData")}</p>
        )}

        {pagedLateFees.map((lf) => (
          <div
            key={lf.id}
            className="flex justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">Invoice ID: {lf.invoiceId}</p>

              <p className="text-sm text-gray-500">
                {t("tenant.applied")}: {lf.appliedDate} • {t("tenant.daysLate")}
                : {lf.lateDays}
              </p>

              <p className="text-sm text-gray-600">
                {t("tenant.amount")}: {lf.appliedAmount} MMK
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => viewPdf(lf)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                {t("tenant.view")}
              </button>

              <button
                onClick={() => downloadPdf(lf)}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                {t("tenant.download")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 Pagination — always visible */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
