/** @format */

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { invoiceApi } from "../../api/InvoiceAPI";
import type { InvoiceDTO } from "../../types";
import { useTranslation } from "react-i18next";

interface LevelOption {
  id: number;
  levelName: string;
}

export const OverdueInvoicesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // invoices per page

  // Fetch manager's building levels
  useEffect(() => {
    if (isAuthenticated) fetchLevels();
  }, [isAuthenticated]);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getLevelsByManager();
      setLevels(response.data ?? []);
      if (response.data?.length) {
        const firstLevelId = response.data[0].id;
        setSelectedLevelId(firstLevelId);
        fetchInvoices(firstLevelId);
      }
    } catch (err) {
      console.error(err);
      setError(t("invoice.fetchLevelsError", "Failed to load levels"));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (levelId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceApi.getOverdueInvoicesByLevel(levelId);
      setInvoices(response.data ?? []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError(
        t("invoice.fetchInvoicesError", "Failed to load invoices for level")
      );
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(invoices.length / pageSize);
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("common.loginRequired", "Login Required")}
          </h2>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {t("common.goToLogin", "Go to Login")}
          </button>
        </div>
      </div>
    );
  }

  if (!loading && levels.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("invoice.noManagedBuilding", "No Managed Building")}
          </h2>
          <p className="text-gray-600">
            {t(
              "invoice.contactAdmin",
              "You are not assigned as a manager. Please contact admin."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("invoice.overdueInvoices", "Overdue Invoices")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("invoice.selectLevelDesc", "Select a level to view invoices")}
            </p>
          </div>
          <div>
            <select
              value={selectedLevelId ?? ""}
              onChange={(e) => {
                const levelId = Number(e.target.value);
                setSelectedLevelId(levelId);
                fetchInvoices(levelId);
              }}
              className="border rounded-lg p-2"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.levelName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : paginatedInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-3xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t(
                "invoice.noOverdueForLevel",
                "No overdue invoices for this level"
              )}
            </h3>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedInvoices.map((invoice) => {
                const lateFees = invoice.lateFees ?? [];
                return (
                  <div
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer"
                  >
                    <div className="p-6 flex justify-between">
                      <div>
                        <h3 className="text-lg font-bold">
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tenant: {invoice.tenantName ?? "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Unit: {invoice.roomNumber ?? "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due Date: {invoice.dueDate}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: {invoice.totalAmount?.toLocaleString() ?? "0"}{" "}
                          MMK
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full font-medium">
                          {invoice.invoiceStatus}
                        </span>
                        {lateFees.length > 0 && (
                          <span className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full font-medium">
                            {t("invoice.lateFeesApplied", "Late Fees Applied")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for selected invoice */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {t("invoice.details", "Invoice Details")}
                </h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("invoice.invoiceNumber", "Invoice Number")}
                  </p>
                  <p className="font-semibold">
                    {selectedInvoice.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("invoice.status", "Status")}
                  </p>
                  <p className="font-semibold">
                    {selectedInvoice.invoiceStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("invoice.tenant", "Tenant")}
                  </p>
                  <p className="font-semibold">
                    {selectedInvoice.tenantName ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("invoice.unit", "Unit")}
                  </p>
                  <p className="font-semibold">
                    {selectedInvoice.roomNumber ?? "-"}
                  </p>
                </div>
              </div>

              {/* Late fees */}
              {selectedInvoice.lateFees &&
              selectedInvoice.lateFees.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {selectedInvoice.lateFees.map((lf) => (
                    <div
                      key={lf.id}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {t("invoice.appliedDate", "Applied Date")}:{" "}
                          {lf.appliedDate}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("invoice.daysLate", "Days Late")}: {lf.lateDays}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {lf.appliedAmount?.toLocaleString()} MMK
                        </p>
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            lf.status === "WAIVED"
                              ? "bg-green-100 text-green-700"
                              : lf.status === "PAID"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {lf.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">
                    {t("invoice.noLateFees", "No late fees applied")}
                  </p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t("common.close", "Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
