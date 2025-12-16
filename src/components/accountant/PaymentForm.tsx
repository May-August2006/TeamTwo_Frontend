/** @format */

import React, { useState, useEffect } from "react";
import type { PaymentRequest } from "../../types/payment";
import { paymentApi } from "../../api/paymentApi";
import { invoiceApi } from "../../api/InvoiceAPI";
import { useAuth } from "../../context/AuthContext";
import type { InvoiceDTO } from "../../types";
import {
  X,
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Building,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface PaymentFormProps {
  onPaymentRecorded: () => void;
  onCancel: () => void;
  initialInvoiceId?: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onPaymentRecorded,
  onCancel,
  initialInvoiceId,
}) => {
  const { userId, username, loading: authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<PaymentRequest>({
    invoiceId: initialInvoiceId || 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    amount: 0,
    referenceNumber: "",
    notes: "",
    receivedById: userId || 0,
  });

  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update formData when userId becomes available
  useEffect(() => {
    if (userId) {
      setFormData((prev) => ({
        ...prev,
        receivedById: userId,
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadUnpaidInvoices();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (formData.invoiceId > 0) {
      loadInvoiceDetails();
    }
  }, [formData.invoiceId]);

  const loadUnpaidInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setError("");

      if (!isAuthenticated || !userId) {
        setError("User not authenticated. Please log in again.");
        setLoadingInvoices(false);
        return;
      }

      const response = await invoiceApi.getUnpaidInvoices();
      const unpaidInvoices = response.data;
      setInvoices(unpaidInvoices);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError("Failed to load invoices. Please try again.");
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadInvoiceDetails = async () => {
    try {
      setError("");
      const response = await invoiceApi.getById(formData.invoiceId);
      const invoice = response.data || response;

      if (invoice) {
        setSelectedInvoice(invoice);
        setFormData((prev) => ({
          ...prev,
          amount: invoice.balanceAmount || invoice.totalAmount || 0,
        }));
      }
    } catch (err: any) {
      console.error("Error loading invoice details:", err);
      if (err.response?.status === 401) {
        setError(
          "Unauthorized: You do not have permission to view invoice details"
        );
      } else {
        setError("Failed to load invoice details");
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const validateForm = (): boolean => {
    if (formData.invoiceId === 0) {
      setError("Please select an invoice");
      return false;
    }
    if (formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }
    if (!formData.paymentDate) {
      setError("Payment date is required");
      return false;
    }

    if (
      selectedInvoice &&
      formData.amount >
        (selectedInvoice.balanceAmount || selectedInvoice.totalAmount)
    ) {
      setError("Payment amount cannot exceed the invoice balance");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    if (!isAuthenticated || !userId) {
      setError("User information not available. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const paymentData: PaymentRequest = {
        ...formData,
        receivedById: userId,
      };

      const result = await paymentApi.recordPayment(paymentData);

      setSuccess(
        `Payment recorded successfully! Payment Number: ${result.paymentNumber}`
      );

      // Reset form
      setFormData({
        invoiceId: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
        amount: 0,
        referenceNumber: "",
        notes: "",
        receivedById: userId,
      });
      setSelectedInvoice(null);

      loadUnpaidInvoices();

      setTimeout(() => {
        onPaymentRecorded();
      }, 2000);
    } catch (err: any) {
      console.error("Payment error details:", err);
      let errorMessage = "Failed to record payment";
      if (err.response?.data) {
        errorMessage =
          err.response.data.message || err.response.data || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: "CASH", label: "Cash", icon: <DollarSign className="w-4 h-4" /> },
    { value: "CHECK", label: "Check", icon: <FileText className="w-4 h-4" /> },
    {
      value: "BANK_TRANSFER",
      label: "Bank Transfer",
      icon: <Building className="w-4 h-4" />,
    },
    {
      value: "CREDIT_CARD",
      label: "Credit Card",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      value: "DEBIT_CARD",
      label: "Debit Card",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      value: "MOBILE_PAYMENT",
      label: "Mobile Payment",
      icon: <CreditCard className="w-4 h-4" />,
    },
  ];

  if (authLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
          <span className="ml-3 text-gray-600 text-lg">
            Loading authentication...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 mb-4">
            You need to be logged in to record payments.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition duration-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Record New Payment
              </h2>
              <p className="text-gray-600">Enter payment details below</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Invoice Selection */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Select Invoice *
                </label>
                {loadingInvoices ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-800"></div>
                    <span className="ml-2 text-gray-600">
                      Loading invoices...
                    </span>
                  </div>
                ) : (
                  <>
                    <select
                      name="invoiceId"
                      value={formData.invoiceId}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>Select an invoice</option>
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} - {invoice.tenantName} -{" "}
                          {(
                            invoice.balanceAmount || invoice.totalAmount
                          )?.toLocaleString()}{" "}
                          MMK
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      {invoices.length === 0
                        ? "No unpaid invoices found"
                        : `${invoices.length} unpaid invoices available`}
                    </p>
                  </>
                )}
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">
                  Payment Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleInputChange}
                        required
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.value}
                          className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.paymentMethod === method.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={formData.paymentMethod === method.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="mb-2 p-2 rounded-lg bg-white">
                            {React.cloneElement(method.icon, {
                              className: `w-4 h-4 ${
                                formData.paymentMethod === method.value
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`,
                            })}
                          </div>
                          <span className="text-xs font-medium">
                            {method.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (MMK) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        MMK
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        max={
                          selectedInvoice
                            ? selectedInvoice.balanceAmount ||
                              selectedInvoice.totalAmount
                            : undefined
                        }
                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {selectedInvoice && (
                      <p className="text-sm text-gray-500 mt-2">
                        Maximum:{" "}
                        {(
                          selectedInvoice.balanceAmount ||
                          selectedInvoice.totalAmount
                        )?.toLocaleString()}{" "}
                        MMK
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={handleInputChange}
                      placeholder="Check number, transaction ID, etc."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Invoice Details */}
              {selectedInvoice && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-4">
                    Invoice Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">
                        Invoice Number
                      </span>
                      <div className="font-semibold text-gray-900">
                        {selectedInvoice.invoiceNumber}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Tenant</span>
                      <div className="font-semibold text-gray-900">
                        {selectedInvoice.tenantName}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Room</span>
                      <div className="font-semibold text-gray-900">
                        {selectedInvoice.roomNumber}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Due Date</span>
                      <div className="font-semibold text-gray-900">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        Total Amount
                      </span>
                      <div className="font-semibold text-gray-900">
                        {selectedInvoice.totalAmount?.toLocaleString()} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Balance Due</span>
                      <div className="font-semibold text-red-600">
                        {(
                          selectedInvoice.balanceAmount ||
                          selectedInvoice.totalAmount
                        )?.toLocaleString()}{" "}
                        MMK
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-gray-500">Status</span>
                      <div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            selectedInvoice.invoiceStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : selectedInvoice.invoiceStatus === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedInvoice.invoiceStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {formData.amount > 0 && selectedInvoice && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-green-800 mb-4">
                    Payment Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Balance</span>
                      <span className="font-semibold">
                        {(
                          selectedInvoice.balanceAmount ||
                          selectedInvoice.totalAmount
                        )?.toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Amount</span>
                      <span className="font-bold text-green-600">
                        {formData.amount.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Remaining Balance</span>
                      <span className="font-semibold">
                        {(
                          (selectedInvoice.balanceAmount ||
                            selectedInvoice.totalAmount) - formData.amount
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">New Status</span>
                      <span className="font-semibold">
                        {formData.amount >=
                        (selectedInvoice.balanceAmount ||
                          selectedInvoice.totalAmount)
                          ? "PAID"
                          : "PARTIAL"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Received By */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">
                  Received By
                </h3>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {username || "Current User"}
                    </div>
                    <div className="text-sm text-gray-500">Accountant</div>
                  </div>
                </div>
                <input type="hidden" name="receivedById" value={userId || 0} />
              </div>

              {/* Notes */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Additional payment details, remarks, or comments..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                loadingInvoices ||
                formData.invoiceId === 0 ||
                !isAuthenticated ||
                !userId
              }
              className="flex-1 px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
