// src/components/tenant/TenantDetail.tsx
import React from 'react';
import type { Tenant } from '../../types/tenant';

interface TenantDetailProps {
  tenant: Tenant;
  onClose: () => void;
  onEdit?: (tenant: Tenant) => void;
}

const TenantDetail: React.FC<TenantDetailProps> = ({ tenant, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Tenant Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Tenant Name</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.tenantName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Contact Person</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.contactPerson}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Category</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.tenantCategoryName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Business Type</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.businessType || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contract Information - Only these three fields as requested */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contract Name/Number */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Contract Number</label>
                  <div className={`p-3 rounded-lg ${
                    tenant.contractNumber 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <p className="text-sm font-medium text-gray-900">
                      {tenant.contractNumber || 'No Contract'}
                    </p>
                  </div>
                </div>

                {/* Contract Status */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Contract Status</label>
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      tenant.contractStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : tenant.contractStatus === 'EXPIRED' 
                        ? 'bg-red-100 text-red-800'
                        : tenant.contractStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.contractStatus || 'No Status'}
                    </span>
                  </div>
                </div>

                {/* Room Number */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Room Number</label>
                  <div className={`p-3 rounded-lg ${
                    tenant.roomName 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <p className="text-sm font-medium text-gray-900">
                      {tenant.roomName || 'No Room'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Username</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.fullName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">NRC Number</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.nrc_no || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  tenant.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {tenant.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{tenant.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Multiple Contracts (if available) */}
          {tenant.contracts && tenant.contracts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Contracts</h3>
              <div className="space-y-3">
                {tenant.contracts.map((contract, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Contract Number</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {contract.contractNumber}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          contract.contractStatus === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : contract.contractStatus === 'EXPIRED' 
                            ? 'bg-red-100 text-red-800'
                            : contract.contractStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.contractStatus}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Room Number</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {contract.roomName || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {(contract.startDate || contract.endDate) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          {contract.startDate && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500">Start Date</label>
                              <p className="mt-1 text-xs text-gray-600">
                                {new Date(contract.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {contract.endDate && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500">End Date</label>
                              <p className="mt-1 text-xs text-gray-600">
                                {new Date(contract.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(tenant)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Tenant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetail;