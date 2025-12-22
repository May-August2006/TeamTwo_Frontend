/** @format */

import React from "react";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  User,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const MyContract: React.FC = () => {
  const { t } = useTranslation();
  
  const contractDetails = {
    contractNumber: "CT-2023-0456",
    startDate: "January 1, 2023",
    endDate: "December 31, 2024",
    monthlyRent: "$2,500.00",
    securityDeposit: "$2,500.00",
    space: "Unit A-102, Main Mall",
    size: "1,200 sq ft",
    businessType: "Retail - Fashion",
    contactPerson: "Sarah Manager",
    contactEmail: "sarah.manager@seingayhar.com",
    contactPhone: "+1 (555) 123-4567",
  };

  const contractTerms = [
    { term: t('tenant.leaseDuration'), value: "24 months" },
    { term: t('tenant.rentDueDate'), value: "15th of each month" },
    { term: t('tenant.lateFee'), value: "$50 after 5 days grace period" },
    {
      term: t('tenant.maintenanceResponsibility'),
      value: "Tenant responsible for interior",
    },
    { term: t('tenant.utilities'), value: "Tenant pays electricity, water included" },
    { term: t('tenant.renewalOption'), value: "Automatic with 60 days notice" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{t('tenant.contract')}</h2>
          <p className="text-stone-600 mt-1">
            {t('tenant.contractOverview')}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition duration-150 transform active:scale-95">
            <Download className="w-4 h-4" />
            <span>{t('tenant.download')} PDF</span>
          </button>
        </div>
      </div>

      {/* Contract Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-stone-900 border-b border-stone-200 pb-2 w-full">
            {t('tenant.contractOverview')}
          </h3>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            <FileText className="w-4 h-4" />
            <span>{t('tenant.active')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-stone-600">{t('tenant.contractNumber')}</p>
              <p className="font-semibold text-stone-900">
                {contractDetails.contractNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-600">{t('tenant.leasePeriod')}</p>
              <div className="flex items-center space-x-2 text-stone-900">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span>
                  {contractDetails.startDate} to {contractDetails.endDate}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-stone-600">{t('tenant.space')}</p>
              <div className="flex items-center space-x-2 text-stone-900">
                <Building2 className="w-4 h-4 text-stone-400" />
                <span>{contractDetails.space}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-stone-600">{t('tenant.monthlyRent')}</p>
              <div className="flex items-center space-x-2 text-stone-900">
                <DollarSign className="w-4 h-4 text-stone-400" />
                <span className="font-semibold">
                  {contractDetails.monthlyRent}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-stone-600">{t('tenant.securityDeposit')}</p>
              <div className="flex items-center space-x-2 text-stone-900">
                <DollarSign className="w-4 h-4 text-stone-400" />
                <span>{contractDetails.securityDeposit}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-stone-600">{t('tenant.spaceSize')}</p>
              <p className="font-semibold text-stone-900">
                {contractDetails.size}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-stone-600">{t('tenant.businessType')}</p>
              <p className="font-semibold text-stone-900">
                {contractDetails.businessType}
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-600">{t('tenant.propertyManager')}</p>
              <div className="flex items-center space-x-2 text-stone-900">
                <User className="w-4 h-4 text-stone-400" />
                <span>{contractDetails.contactPerson}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-stone-600">{t('tenant.contact')}</p>
              <p className="text-stone-900">{contractDetails.contactEmail}</p>
              <p className="text-stone-900">{contractDetails.contactPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Terms */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-6 border-b border-stone-200 pb-2">
          {t('tenant.keyContractTerms')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractTerms.map((term, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200 hover:bg-stone-100 transition duration-150"
            >
              <span className="font-medium text-stone-700">{term.term}</span>
              <span className="text-stone-900 font-semibold">{term.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3 border-b border-blue-200 pb-2">
          {t('tenant.importantInformation')}
        </h4>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>
            • Please notify management 60 days before lease expiration if you
            wish to renew or terminate
          </li>
          <li>
            • Rent payments are due on the 15th of each month with a 5-day grace
            period
          </li>
          <li>
            • Maintenance requests should be submitted through the tenant portal
            for tracking
          </li>
          <li>
            • Contact property management for any questions about your lease
            terms
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-150 transform active:scale-95">
          <FileText className="w-5 h-5" />
          <span>{t('tenant.requestLeaseRenewal')}</span>
        </button>
        <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-150 transform active:scale-95">
          <Download className="w-5 h-5" />
          <span>{t('tenant.downloadFullContract')}</span>
        </button>
      </div>
    </div>
  );
};

export default MyContract;