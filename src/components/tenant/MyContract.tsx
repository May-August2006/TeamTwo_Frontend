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

const MyContract: React.FC = () => {
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
    { term: "Lease Duration", value: "24 months" },
    { term: "Rent Due Date", value: "15th of each month" },
    { term: "Late Fee", value: "$50 after 5 days grace period" },
    {
      term: "Maintenance Responsibility",
      value: "Tenant responsible for interior",
    },
    { term: "Utilities", value: "Tenant pays electricity, water included" },
    { term: "Renewal Option", value: "Automatic with 60 days notice" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Contract</h2>
          <p className="text-gray-600 mt-1">
            View your lease agreement and contract details
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Contract Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Contract Overview
          </h3>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <FileText className="w-4 h-4" />
            <span>Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Contract Number</p>
              <p className="font-semibold text-gray-900">
                {contractDetails.contractNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lease Period</p>
              <div className="flex items-center space-x-2 text-gray-900">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {contractDetails.startDate} to {contractDetails.endDate}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Space</p>
              <div className="flex items-center space-x-2 text-gray-900">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{contractDetails.space}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Monthly Rent</p>
              <div className="flex items-center space-x-2 text-gray-900">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">
                  {contractDetails.monthlyRent}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Security Deposit</p>
              <div className="flex items-center space-x-2 text-gray-900">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>{contractDetails.securityDeposit}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Space Size</p>
              <p className="font-semibold text-gray-900">
                {contractDetails.size}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Business Type</p>
              <p className="font-semibold text-gray-900">
                {contractDetails.businessType}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Property Manager</p>
              <div className="flex items-center space-x-2 text-gray-900">
                <User className="w-4 h-4 text-gray-400" />
                <span>{contractDetails.contactPerson}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact</p>
              <p className="text-gray-900">{contractDetails.contactEmail}</p>
              <p className="text-gray-900">{contractDetails.contactPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Terms */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Key Contract Terms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contractTerms.map((term, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-700">{term.term}</span>
              <span className="text-gray-900">{term.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">
          Important Information
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
        <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
          <FileText className="w-5 h-5" />
          <span>Request Lease Renewal</span>
        </button>
        <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          <span>Download Full Contract</span>
        </button>
      </div>
    </div>
  );
};

export default MyContract;
