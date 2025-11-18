/** @format */

import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import {
  createTenant,
  getAllCategories,
  getAllTenants,
  searchTenants,
  updateTenant,
  deleteTenant as deleteTenantApi,
} from "../../api/TenantAPI";
import {
  TenantForm,
  TenantList,
  TenantSearch
} from "../../components/manager";
import { ConfirmDialog } from '../../components/manager/ConfirmDialog';
import type {
  CreateTenantRequest,
  Tenant,
  TenantCategory,
} from "../../types/tenant";
import axios from "axios";

export const TenantManagementPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [categories, setCategories] = useState<TenantCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { callApi } = useApi();

  /** ========== FETCHING DATA ========== **/
  const fetchTenants = async () => {
    setLoading(true);
    try {
      const data = await callApi(() => getAllTenants());
      setTenants(data);
    } catch (error) {
      handleAxiosError(error, "Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await callApi(() => getAllCategories());
      setCategories(data);
    } catch (error) {
      handleAxiosError(error, "Failed to fetch categories");
    }
  };

  /** ========== CRUD OPERATIONS ========== **/
  const handleSearch = async () => {
    if (!searchTerm && !selectedCategory) return fetchTenants();

    setLoading(true);
    try {
      const data = await callApi(() =>
        searchTenants(searchTerm || undefined, selectedCategory || undefined)
      );
      setTenants(data);
    } catch (error) {
      handleAxiosError(error, "Failed to search tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTenant = async (tenantData: CreateTenantRequest | Tenant) => {
    setSaving(true);
    try {
      if (editTenant?.id) {
        const {
          tenantCategoryName,
          businessType,
          createdAt,
          updatedAt,
          ...updateData
        } = tenantData as Tenant;

        await callApi(() => updateTenant(editTenant.id, updateData));
        showSnackbar("Tenant updated successfully", "success");
      } else {
        await callApi(() => createTenant(tenantData as CreateTenantRequest));
        showSnackbar("Tenant created successfully", "success");
      }

      fetchTenants();
      setModalOpen(false);
      setEditTenant(null);
    } catch (error) {
      handleAxiosError(error, "Failed to save tenant");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;
    setLoading(true);
    try {
      await callApi(() => deleteTenantApi(tenantToDelete.id));
      showSnackbar("Tenant deleted successfully", "success");
      fetchTenants();
    } catch (error) {
      handleAxiosError(error, "Failed to delete tenant");
    } finally {
      setLoading(false);
      setTenantToDelete(null);
    }
  };

  /** ========== UTILS ========== **/
  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAxiosError = (error: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(error)) {
      console.error(error);
      showSnackbar(error.response?.data?.message || defaultMessage, "error");
    } else {
      console.error("Unexpected error:", error);
      showSnackbar("An unexpected error occurred", "error");
    }
  };

  /** ========== LIFECYCLE ========== **/
  useEffect(() => {
    fetchTenants();
    fetchCategories();
  }, []);

  // Reset to full list when clearing filters
  useEffect(() => {
    if (!searchTerm && !selectedCategory) fetchTenants();
  }, [searchTerm, selectedCategory]);

  // Auto-hide snackbar
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  /** ========== RENDER ========== **/
  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">
            Tenant Management
          </h1>

          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <button
              onClick={() => setModalOpen(true)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Tenant
            </button>

            <button
              onClick={fetchTenants}
              disabled={loading}
              title="Refresh"
              className="flex items-center p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* SEARCH SECTION */}
        <TenantSearch
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          loading={loading}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onSearch={handleSearch}
          onClear={() => {
            setSearchTerm("");
            setSelectedCategory("");
            fetchTenants();
          }}
        />

        {/* TENANT LIST */}
        <div className="mt-6 bg-white shadow-sm rounded-lg overflow-x-auto">
          <div className="p-4 sm:p-6 min-w-[600px] sm:min-w-0">
            <TenantList
              tenants={tenants}
              loading={loading}
              onEdit={setEditTenant}
              onView={(tenant) =>
                alert(`Tenant Details:\n${JSON.stringify(tenant, null, 2)}`)
              }
              onDelete={setTenantToDelete}
            />
          </div>
        </div>

        {/* MODAL FORM */}
        <TenantForm
          open={modalOpen || !!editTenant}
          tenant={editTenant}
          categories={categories}
          onClose={() => {
            setModalOpen(false);
            setEditTenant(null);
          }}
          onSave={handleSaveTenant}
          isEdit={!!editTenant}
          loading={saving}
        />

        {/* DELETE CONFIRMATION */}
        <ConfirmDialog
          open={!!tenantToDelete}
          title="Delete Tenant"
          message={`Are you sure you want to delete tenant "${tenantToDelete?.tenantName}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTenantToDelete(null)}
          confirmText="Delete"
          cancelText="Cancel"
          severity="error"
        />

        {/* SNACKBAR */}
        {snackbar.open && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right duration-300">
            <div
              className={`rounded-lg p-4 shadow-lg border ${
                snackbar.severity === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {snackbar.severity === "success" ? (
                    <svg
                      className="h-5 w-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p
                  className={`ml-3 text-sm font-medium ${
                    snackbar.severity === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {snackbar.message}
                </p>
                <button
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className="ml-auto p-1 rounded-md hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantManagementPage;
