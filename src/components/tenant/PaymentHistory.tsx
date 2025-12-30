/** @format */

import React, { useEffect, useState } from "react";
import { CreditCard, CheckCircle, Calendar, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { paymentApi } from "../../api/paymentApi"; // Import your API
import type { Payment } from "../../types"; // Import your types
import { generatePaymentReceipt } from "../../utils/pdfGenerator"; // Import the PDF generator

const PaymentHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    fetchMyPayments();
  }, []);

  const fetchMyPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getMyPayments(); // Use the new API method
      setPayments(data);

      // Calculate totals
      const total = data.reduce((sum, payment) => {
        return sum + (payment.amount || 0); // Added null check
      }, 0);
      setTotalAmount(total);
      setTotalPayments(data.length);
    } catch (err) {
      setError(t("payment.loadFailed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use Burmese locale for Burmese language, English for others
    const locale = i18n.language === "mm" ? "my-MM" : "en-US";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString(locale, options);
  };

  const formatCurrency = (amount: number) => {
    // Always use MMK for currency display, regardless of language
    const currency = "MMK";
    const locale = i18n.language === "mm" ? "my-MM" : "en-US";
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      currencyDisplay: "code", // This will show "MMK" instead of symbol
    })
    .format(amount)
    .replace("MMK", "MMK "); // Add space after MMK for better readability
  };

  // Fixed: Use the same PDF generator function as PaymentListPage
  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      // Use the same function that works in PaymentListPage
      const receiptBlob = await generatePaymentReceipt(payment);
      const url = window.URL.createObjectURL(receiptBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${payment.paymentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(t("payment.downloadFailed"));
      console.error(err);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return t(`payment.methods.${method}`);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
        <div className="flex justify-center items-center h-64">
          <div className="text-stone-600">{t("payment.loading")}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchMyPayments}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {t("payment.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {t("payment.title")}
          </h2>
          <p className="text-stone-600 mt-1">{t("payment.subtitle")}</p>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t("payment.totalPayments")}</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">
            {totalPayments}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t("payment.totalAmount")}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t("payment.lastPayment")}</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">
            {payments.length > 0
              ? formatDate(payments[0].paymentDate)
              : t("payment.notAvailable")}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t("payment.status")}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {payments.length > 0
              ? t("payment.active")
              : t("payment.noPayments")}
          </p>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <CreditCard className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-900 mb-2">
              {t("payment.noHistory")}
            </h3>
            <p className="text-stone-600 mb-4">
              {t("payment.noHistoryDescription")}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t("payment.table.paymentDetails")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t("payment.table.date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t("payment.table.amount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t("payment.table.method")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t("payment.table.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t("payment.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-red-50/50 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {payment.paymentNumber}
                        </p>
                        <p className="text-sm text-stone-500">
                          {t("payment.forInvoice", {
                            invoiceNumber: payment.invoiceNumber,
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span>{formatDate(payment.paymentDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900">
                      <div className="flex items-center space-x-1">
                        <span>{formatCurrency(payment.amount || 0)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4 text-stone-400" />
                        <span>
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="text-red-600 hover:text-red-800 font-semibold transition duration-150 flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t("payment.receipt")}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;