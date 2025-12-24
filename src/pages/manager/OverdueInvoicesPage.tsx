/** @format */

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { invoiceApi } from "../../api/InvoiceAPI";
import type { InvoiceDTO } from "../../types";
import { useTranslation } from "react-i18next";

export const OverdueInvoicesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await invoiceApi.getInvoicesWithWaivedLateFees();
      setInvoices(response.data ?? []);
    } catch (err) {
      console.error("Failed to load overdue invoices:", err);
      setError(t("invoice.fetchError", "Failed to load overdue invoices"));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ STATES ------------------ */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
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
      </div>
    );
  }

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

  /* ------------------ PAGE ------------------ */

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("invoice.waivedLateFees", "Overdue Invoices")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("invoice.waivedDesc", "Overdue invoices")}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {invoices.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-3xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("invoice.noWaived", "No waived late fee invoices")}
            </h3>
          </div>
        )}

        {/* Invoice Cards */}
        <div className="space-y-6">
          {invoices.map((invoice) => {
            const lateFees = invoice.lateFees ?? [];

            return (
              <div
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between">
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
                    </div>

                    <span className="px-3 py-1 text-sm text-red-700">
                      {invoice.invoiceStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------ MODAL ------------------ */}
      {selectedInvoice &&
        (() => {
          const selectedLateFees = selectedInvoice.lateFees ?? [];

          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="absolute top-4 right-4"
                >
                  ✕
                </button>

                <h2 className="text-xl font-bold mb-4">Invoice Details</h2>

                {selectedLateFees.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Late Fees</h4>
                    {selectedLateFees.map((lf) => (
                      <div
                        key={lf.id}
                        className="flex justify-between bg-gray-50 p-3 rounded mb-2"
                      >
                        <div>
                          <p className="text-sm">Applied: {lf.appliedDate}</p>
                          <p className="text-sm">Days Late: {lf.lateDays}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {lf.appliedAmount?.toLocaleString()} MMK
                          </p>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {lf.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
};
