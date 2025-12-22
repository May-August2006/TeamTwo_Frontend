/** @format */

import React from "react";
import {
  CreditCard,
  CheckCircle,
  Calendar,
  DollarSign,
  Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const PaymentHistory: React.FC = () => {
  const { t } = useTranslation();
  
  const payments = [
    {
      id: "PMT-001",
      invoiceId: "INV-2023-012",
      date: "Dec 14, 2023",
      amount: "$2,500.00",
      method: t('tenant.bankTransfer'),
      status: "completed",
      reference: "TRX-789012",
    },
    {
      id: "PMT-002",
      invoiceId: "INV-2023-011",
      date: "Nov 12, 2023",
      amount: "$2,450.00",
      method: t('tenant.creditDebitCard'),
      status: "completed",
      reference: "TRX-789011",
    },
    {
      id: "PMT-003",
      invoiceId: "INV-2023-010",
      date: "Oct 15, 2023",
      amount: "$2,450.00",
      method: t('tenant.bankTransfer'),
      status: "completed",
      reference: "TRX-789010",
    },
    {
      id: "PMT-004",
      invoiceId: "INV-2023-009",
      date: "Sep 13, 2023",
      amount: "$2,450.00",
      method: t('tenant.creditDebitCard'),
      status: "completed",
      reference: "TRX-789009",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{t('tenant.paymentHistory')}</h2>
          <p className="text-stone-600 mt-1">
            {t('tenant.paymentDetails')}
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-150 mt-4 sm:mt-0 shadow-lg hover:shadow-xl transform active:scale-95">
          <Download className="w-4 h-4" />
          <span>{t('tenant.exportHistory')}</span>
        </button>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t('tenant.totalPayments')}</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">4</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t('tenant.totalAmount')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">$9,850.00</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t('tenant.onTimePayments')}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">100%</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 text-center hover:shadow-xl transition duration-150">
          <p className="text-sm text-stone-600">{t('tenant.preferredMethod')}</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {t('tenant.bankTransfer')}
          </p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tenant.paymentDetails')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tenant.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tenant.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tenant.method')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tenant.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  {t('tenant.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-red-50/50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        {payment.id}
                      </p>
                      <p className="text-sm text-stone-500">
                        {t('tenant.for')} {payment.invoiceId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span>{payment.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-stone-400" />
                      <span>{payment.amount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-4 h-4 text-stone-400" />
                      <span>{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t('tenant.completed')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-red-600 hover:text-red-800 font-semibold transition duration-150">
                      {t('tenant.viewReceipt')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2">
          {t('tenant.paymentMethods')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-2">{t('tenant.bankTransfer')}</h4>
            <p className="text-sm text-stone-600 mb-2">
              Sein Gay Har Management
            </p>
            <p className="text-sm font-mono text-stone-900">
              Account: 1234 5678 9012 3456
            </p>
            <p className="text-sm font-mono text-stone-900">
              Routing: 021000021
            </p>
          </div>
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
            <h4 className="font-semibold text-stone-900 mb-2">
              {t('tenant.creditDebitCard')}
            </h4>
            <p className="text-sm text-stone-600 mb-2">
              Visa, MasterCard, American Express
            </p>
            <p className="text-sm text-stone-900">
              Processed securely through our payment gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;