/** @format */

import React, { useState, useEffect } from "react";
import type { PaymentAuditLog } from "../../types";
import { paymentApi } from "../../api/paymentApi";
import axios from "axios";

const PaymentAuditLogComponent: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLog[]>([]);

  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const logs = await paymentApi.getAllAuditLogs();

      let filteredLogs = logs;

      if (filterAction) {
        filteredLogs = filteredLogs.filter(
          (log) => log.actionType === filterAction
        );
      }

      if (filterDate) {
        filteredLogs = filteredLogs.filter(
          (log) =>
            new Date(log.createdAt).toISOString().split("T")[0] === filterDate
        );
      }

      setAuditLogs(filteredLogs);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to load audit logs");
      } else {
        setError("Failed to load audit logs");
      }
    } finally {
    }
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case "CREATED":
        return "Payment Recorded";
      case "EDITED":
        return "Payment Edited";
      case "VOIDED":
        return "Payment Voided";
      default:
        return actionType;
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "CREATED":
        return "bg-green-100 text-green-800 border-green-200";
      case "EDITED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VOIDED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "CREATED":
        return <span className="w-4 h-4">➕</span>;
      case "EDITED":
        return <span className="w-4 h-4">✏️</span>;
      case "VOIDED":
        return <span className="w-4 h-4">❌</span>;
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setFilterAction("");
    setFilterDate("");
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="animate-spin text-blue-600 text-xl">⏳ Loading...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Payment Audit Log
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Track all payment-related activities and changes
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Action Type
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              <option value="">All Actions</option>
              <option value="CREATED">Payment Recorded</option>
              <option value="EDITED">Payment Edited</option>
              <option value="VOIDED">Payment Voided</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
            />
          </div>

          {(filterAction || filterDate) && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 w-full text-sm border rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table Wrapper - responsive */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Timestamp",
                  "Action",
                  "Payment Details",
                  "Changed By",
                  "Reason",
                ].map((t) => (
                  <th
                    key={t}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{formatDateTime(log.createdAt)}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionTypeColor(
                        log.actionType
                      )}`}
                    >
                      {getActionIcon(log.actionType)}
                      <span className="ml-1.5">
                        {getActionTypeLabel(log.actionType)}
                      </span>
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div>{log.paymentNumber}</div>
                    {log.amount && (
                      <div className="text-gray-500">
                        {log.amount.toLocaleString()} MMK
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div>User #{log.changedById}</div>
                    <div className="text-gray-500">{log.changedById}</div>
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {log.changeReason || "No reason provided"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-4 p-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg p-4 shadow-sm bg-gray-50"
            >
              <div className="text-sm text-gray-500">
                {formatDateTime(log.createdAt)}
              </div>

              <div
                className={`inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionTypeColor(
                  log.actionType
                )}`}
              >
                {getActionIcon(log.actionType)}
                <span className="ml-1.5">
                  {getActionTypeLabel(log.actionType)}
                </span>
              </div>

              <div className="mt-3 text-sm">
                <strong>Payment:</strong> {log.paymentNumber}
                {log.amount && (
                  <div className="text-gray-600">
                    {log.amount.toLocaleString()} MMK
                  </div>
                )}
              </div>

              <div className="mt-3 text-sm">
                <strong>Changed By:</strong> User #{log.changedById} (
                {log.changedById})
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <strong>Reason:</strong>{" "}
                {log.changeReason || "No reason provided"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {auditLogs.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold">{auditLogs.length}</div>
              <div className="text-gray-600 text-sm">Total</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {auditLogs.filter((l) => l.actionType === "CREATED").length}
              </div>
              <div className="text-gray-600 text-sm">Created</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {auditLogs.filter((l) => l.actionType === "EDITED").length}
              </div>
              <div className="text-gray-600 text-sm">Edited</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {auditLogs.filter((l) => l.actionType === "VOIDED").length}
              </div>
              <div className="text-gray-600 text-sm">Voided</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAuditLogComponent;
