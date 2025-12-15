/** @format */

import React, { useState, useEffect } from "react";
import type { PaymentRequest } from "../../types/payment";
import { paymentApi } from "../../api/paymentApi";
import { invoiceApi } from "../../api/InvoiceAPI";
import { useAuth } from "../../context/AuthContext";
import type { InvoiceDTO, LateFeeResponseDTO } from "../../types";

interface LateFeePaymentFormProps {
  onPaymentRecorded: () => void;
  onCancel: () => void;
  initialInvoiceId?: number;
}

const LateFeePaymentForm: React.FC<LateFeePaymentFormProps> = ({
  onPaymentRecorded,
  onCancel,
  initialInvoiceId,
}) => {
  const { userId, loading: authLoading, isAuthenticated } = useAuth();

  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );
  const [selectedLateFee, setSelectedLateFee] =
    useState<LateFeeResponseDTO | null>(null);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<PaymentRequest>({
    invoiceId: initialInvoiceId || 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    amount: 0,
    referenceNumber: "",
    notes: "",
    receivedById: userId || 0,
    isLateFeePayment: true,
    lateFeeId: undefined,
  });

  /** Update receivedBy when user is authenticated */
  useEffect(() => {
    if (userId) {
      setFormData((prev) => ({ ...prev, receivedById: userId }));
    }
  }, [userId]);

  /** Load invoices that have late fees */
  useEffect(() => {
    if (!authLoading && isAuthenticated) loadInvoicesWithLateFees();
  }, [authLoading, isAuthenticated]);

  /** When invoice changes or invoices list updates, set selectedInvoice */
  useEffect(() => {
    if (formData.invoiceId > 0 && invoices.length > 0) {
      const inv = invoices.find((i) => i.id === formData.invoiceId) || null;
      setSelectedInvoice(inv);

      // Reset selection
      setSelectedLateFee(null);
      setFormData((prev) => ({
        ...prev,
        amount: 0,
        lateFeeId: undefined,
      }));

      // Auto-select first late fee if available
      if (inv?.lateFees?.length) {
        const firstFee = inv.lateFees[0];
        setSelectedLateFee(firstFee);
        setFormData((prev) => ({
          ...prev,
          lateFeeId: firstFee.id,
          amount: firstFee.appliedAmount,
        }));
      }
    } else {
      setSelectedInvoice(null);
      setSelectedLateFee(null);
    }
  }, [formData.invoiceId, invoices]);

  /** Load invoices that have any late fee */
  const loadInvoicesWithLateFees = async () => {
    try {
      setLoadingInvoices(true);
      const res = await invoiceApi.getInvoicesWithLateFees();
      setInvoices(res.data || []);
    } catch (e) {
      setError("Failed to load invoices with late fees.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  /** On input change - safely handle numbers and strings */
  const handleInput = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "amount"
          ? parseFloat(value) || 0
          : name === "invoiceId" || name === "lateFeeId"
          ? Number(value)
          : value,
    }));
  };

  /** When user selects a late fee line */
  const handleLateFeeSelect = (feeId: number) => {
    const fee =
      selectedInvoice?.lateFees?.find((lf) => lf.id === feeId) || null;
    setSelectedLateFee(fee);

    setFormData((prev) => ({
      ...prev,
      lateFeeId: fee?.id,
      amount: fee?.appliedAmount || 0,
    }));
  };

  /** Form validation */
  const validate = () => {
    if (!formData.invoiceId) {
      setError("Please select an invoice.");
      return false;
    }
    if (!formData.lateFeeId) {
      setError("Please select a late fee to pay.");
      return false;
    }
    if (formData.amount <= 0) {
      setError("Amount must be greater than 0.");
      return false;
    }
    return true;
  };

  /** Submit late fee payment */
  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      const payload: PaymentRequest = {
        ...formData,
        receivedById: userId!,
        isLateFeePayment: true,
      };

      const result = await paymentApi.recordLateFeesPayment(payload);

      setSuccess(
        `Late fee payment recorded! Payment Number: ${result.paymentNumber}`
      );

      setTimeout(() => {
        onPaymentRecorded();
      }, 1500);
    } catch (err: any) {
      setError("Failed to record late fee payment.");
    } finally {
      setLoading(false);
    }
  };

  /** Render */
  if (authLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Record Late Fee Payment
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={submitPayment} className="space-y-6">
        {/* Select Invoice */}
        <div>
          <label className="block font-medium mb-2">Select Invoice *</label>
          {loadingInvoices ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-6 w-6 border-b-2 border-red-600"></div>
              <span>Loading invoices...</span>
            </div>
          ) : (
            <select
              name="invoiceId"
              value={formData.invoiceId}
              onChange={handleInput}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value={0}>Select invoice with late fees</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.tenantName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Select Late Fee */}
        {selectedInvoice && (
          <div>
            <label className="block font-medium mb-2">Select Late Fee *</label>
            {selectedInvoice.lateFees?.length ? (
              <select
                value={selectedLateFee?.id || ""}
                onChange={(e) => handleLateFeeSelect(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a late fee line</option>
                {selectedInvoice.lateFees.map((lf) => (
                  <option key={lf.id} value={lf.id}>
                    {lf.lateDays} days - {lf.appliedAmount.toLocaleString()} MMK
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-500">This invoice has no late fees.</p>
            )}
          </div>
        )}

        {/* Payment Amount */}
        {selectedLateFee && (
          <div>
            <label className="block font-medium mb-2">
              Amount (Auto-filled)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInput}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
        )}

        {/* Payment Date */}
        <div>
          <label className="block mb-2 font-medium">Payment Date *</label>
          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleInput}
            max={new Date().toISOString().split("T")[0]}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block font-medium mb-2">Payment Method *</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInput}
            className="w-full border rounded px-3 py-2"
          >
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-2 font-medium">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInput}
            rows={3}
            className="w-full border rounded px-3 py-2"
            placeholder="Optional remarks..."
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 border-t pt-4">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.lateFeeId}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Record Late Fee Payment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LateFeePaymentForm;
