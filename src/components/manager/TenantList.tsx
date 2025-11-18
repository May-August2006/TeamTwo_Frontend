/** @format */

import React from "react";
import type { Tenant } from "../../types/tenant";

interface TenantListProps {
  tenants: Tenant[];
  loading: boolean;
  onEdit: (tenant: Tenant) => void;
  onView: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

export const TenantList: React.FC<TenantListProps> = ({
  tenants,
  loading,
  onEdit,
  onView,
  onDelete,
}) => {
  if (loading && tenants.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading tenants...
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Tenant Name",
                "Contact Person",
                "Email",
                "Phone",
                "Business Type",
                "Category",
                "Username",
                "Created At",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.tenantName}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.contactPerson}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.email}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.phone}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.businessType || "-"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.tenantCategoryName || "-"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.username}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                  {tenant.createdAt
                    ? new Date(tenant.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    {/* View */}
                    <button
                      onClick={() => onView(tenant)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                      title="View"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEdit(tenant)}
                      className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(tenant)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && tenants.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No tenants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
