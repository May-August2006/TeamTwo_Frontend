/** @format */

import React, { useState, useEffect } from 'react';
import type { CreateTenantRequest, Tenant, TenantCategory, TenantSearchParams, UpdateTenantRequest } from '../../types/tenant';
import { tenantApi } from '../../api/TenantAPI';
import TenantList from '../../components/tenant/TenantList';
import TenantForm from '../../components/tenant/TenantForm';
import TenantCategoryList from '../../components/tenant/TenantCategoryList';
import InactiveTenants from '../../components/tenant/InactiveTenants';
import TenantCategoryForm from '../../components/tenant/TenantCategoryForm';
import DeleteConfirmationModal from '../../components/tenant/DeleteConfirmationModal';
import TenantSearch from '../../components/tenant/TenantSearch';
import TenantDetail from '../../components/tenant/TenantDetail';

const TenantManagement: React.FC = () => {
  // Tenant states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [categories, setCategories] = useState<TenantCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>();
  const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Category states
  const [showCategoryForm, setShowCategoryForm] = useState<boolean>(false);
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<TenantCategory | undefined>();
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState<boolean>(false);
  const [categoryFormLoading, setCategoryFormLoading] = useState<boolean>(false);
  const [categoryDeleteLoading, setCategoryDeleteLoading] = useState<boolean>(false);

  // Inactive tenants state
  const [inactiveTenantsCount, setInactiveTenantsCount] = useState<number>(0);

  // Active tenants count state (separate from search results)
  const [activeTenantsCount, setActiveTenantsCount] = useState<number>(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<'tenants' | 'categories' | 'inactive'>('tenants');

  const [searchParams, setSearchParams] = useState<TenantSearchParams>({});

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [displayTenants, setDisplayTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    console.log('Tenants state updated:', tenants.length, 'tenants');
  }, [tenants]);

  useEffect(() => {
    loadTenants();
    loadCategories();
    loadInactiveTenantsCount();
  }, []);

  // Add this function to update displayed tenants based on pagination
  const updateDisplayTenants = (tenants: Tenant[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTenants = tenants.slice(startIndex, endIndex);
    setDisplayTenants(pageTenants);
    setTenants(pageTenants); // Keep this for backward compatibility
  };

  // Add this function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateDisplayTenants(allTenants, page);
  };

  const loadTenants = async (params: TenantSearchParams = {}) => {
    try {
      setLoading(true);
      console.log('Loading tenants with params:', params);
      
      const data = params.name || params.categoryId || params.email || params.phone
        ? await tenantApi.searchForManagerView(params)
        : await tenantApi.getForManagerView();
      
      console.log('Loaded tenants:', data.length);
      setAllTenants(data); // Store all tenants
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      updateDisplayTenants(data, currentPage);
      
      // Only update active count when loading ALL tenants (not filtered)
      if (!params.name && !params.categoryId && !params.email && !params.phone) {
        setActiveTenantsCount(data.length);
      }
      
      setError('');
    } catch (err: any) {
      setError('Failed to load tenants. Please try again.');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await tenantApi.category.getAll();
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadInactiveTenantsCount = async () => {
    try {
      const inactiveTenants = await tenantApi.getInactive();
      setInactiveTenantsCount(inactiveTenants.length);
    } catch (err) {
      console.error('Error loading inactive tenants count:', err);
    }
  };

  // Tenant handlers
  const handleCreateTenant = async (tenantData: CreateTenantRequest) => {
    try {
      setFormLoading(true);
      setError('');
      console.log('Creating tenant with data:', tenantData);
      
      const newTenant = await tenantApi.create(tenantData);
      console.log('Created tenant:', newTenant);
      
      setShowForm(false);
      setSuccess('Tenant created successfully!');
      
      // Reload all tenants and reset to first page
      await loadTenants(searchParams);
      setCurrentPage(1);
      
      // Update active count (increment by 1)
      setActiveTenantsCount(prev => prev + 1);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create tenant');
      console.error('Create tenant error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTenant = async (tenantData: UpdateTenantRequest) => {
    if (!editingTenant?.id) return;

    try {
      setFormLoading(true);
      setError('');
      const updatedTenant = await tenantApi.update(editingTenant.id, tenantData);
      
      setShowForm(false);
      setEditingTenant(undefined);
      setIsEditing(false);
      setSuccess('Tenant updated successfully!');
      
      // Update all tenants list
      const updatedAllTenants = allTenants.map(tenant => 
        tenant.id === editingTenant.id ? { ...tenant, ...updatedTenant } : tenant
      );
      setAllTenants(updatedAllTenants);
      updateDisplayTenants(updatedAllTenants, currentPage);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!deletingTenantId) return;

    try {
      setDeleteLoading(true);
      setError('');
      await tenantApi.delete(deletingTenantId);
      setShowDeleteModal(false);
      
      // Remove from all tenants
      const updatedAllTenants = allTenants.filter(tenant => tenant.id !== deletingTenantId);
      setAllTenants(updatedAllTenants);
      const newTotalPages = Math.ceil(updatedAllTenants.length / itemsPerPage);
      setTotalPages(newTotalPages);
      
      // Adjust current page if needed
      if (currentPage > newTotalPages && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        updateDisplayTenants(updatedAllTenants, newPage);
      } else {
        updateDisplayTenants(updatedAllTenants, currentPage);
      }
      
      // Update both active and inactive counts
      setActiveTenantsCount(prev => prev - 1);
      setInactiveTenantsCount(prev => prev + 1);
      
      setDeletingTenantId(null);
      setSuccess('Tenant deleted successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tenant');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setShowDetail(false);
    setSelectedTenant(undefined);
    
    setEditingTenant(tenant);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDetail(true);
  };

  const handleDeleteTenantClick = (id: number) => {
    setDeletingTenantId(id);
    setShowDeleteModal(true);
  };

  // Category handlers
  const handleCreateCategory = async (categoryData: Omit<TenantCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setCategoryFormLoading(true);
      setError('');
      const newCategory = await tenantApi.category.create(categoryData);
      setShowCategoryForm(false);
      setSuccess('Category created successfully!');
      
      setCategories(prev => [...prev, newCategory]);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryData: Omit<TenantCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCategory?.id) return;

    try {
      setCategoryFormLoading(true);
      setError('');
      const updatedCategory = await tenantApi.category.update(editingCategory.id, categoryData);
      setShowCategoryForm(false);
      setEditingCategory(undefined);
      setIsEditingCategory(false);
      setSuccess('Category updated successfully!');
      
      setCategories(prev => 
        prev.map(category => 
          category.id === editingCategory.id ? { ...category, ...updatedCategory } : category
        )
      );
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;

    try {
      setCategoryDeleteLoading(true);
      setError('');
      await tenantApi.category.delete(deletingCategoryId);
      setShowCategoryDeleteModal(false);
      
      setCategories(prev => prev.filter(category => category.id !== deletingCategoryId));
      
      setDeletingCategoryId(null);
      setSuccess('Category deleted successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setCategoryDeleteLoading(false);
    }
  };

  const handleEditCategory = (category: TenantCategory) => {
    setEditingCategory(category);
    setIsEditingCategory(true);
    setShowCategoryForm(true);
  };

  const handleDeleteCategoryClick = (id: number) => {
    setDeletingCategoryId(id);
    setShowCategoryDeleteModal(true);
  };

  // Common handlers
  const handleSearch = () => {
    setCurrentPage(1);
    loadTenants(searchParams);
  };

  const handleReset = () => {
    setSearchParams({});
    setCurrentPage(1);
    loadTenants({}); // This will update activeTenantsCount
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTenant(undefined);
    setIsEditing(false);
    setFormLoading(false);
  };

  const handleCancelCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(undefined);
    setIsEditingCategory(false);
    setCategoryFormLoading(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingTenantId(null);
  };

  const handleCancelCategoryDelete = () => {
    setShowCategoryDeleteModal(false);
    setDeletingCategoryId(null);
  };

  const handleTenantSubmit = (formData: CreateTenantRequest | UpdateTenantRequest) => {
    if (isEditing) {
      handleUpdateTenant(formData as UpdateTenantRequest);
    } else {
      handleCreateTenant(formData as CreateTenantRequest);
    }
  };

  const handleCategorySubmit = (formData: Omit<TenantCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isEditingCategory) {
      handleUpdateCategory(formData);
    } else {
      handleCreateCategory(formData);
    }
  };

  const getTenantToDeleteName = () => {
    const tenant = tenants.find(t => t.id === deletingTenantId);
    return tenant?.tenantName || 'this tenant';
  };

  const getCategoryToDeleteName = () => {
    const category = categories.find(cat => cat.id === deletingCategoryId);
    return category?.categoryName || 'this category';
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 truncate">Tenant Management</h1>
              <p className="text-stone-600 mt-2">Manage your tenants, categories, and inactive accounts</p>
            </div>
            {activeTab === 'tenants' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#1E40AF] text-white px-4 py-2.5 rounded-lg hover:bg-[#1E3A8A] transition duration-150 font-semibold w-full sm:w-auto whitespace-nowrap shadow-sm"
              >
                Add New Tenant
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-[#1E40AF] text-white px-4 py-2.5 rounded-lg hover:bg-[#1E3A8A] transition duration-150 font-semibold w-full sm:w-auto whitespace-nowrap shadow-sm"
              >
                Add New Category
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#1E40AF] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Active Tenants</p>
                <p className="text-xl sm:text-2xl font-semibold text-stone-900">{activeTenantsCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#1E40AF] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Inactive Tenants</p>
                <p className="text-xl sm:text-2xl font-semibold text-stone-900">{inactiveTenantsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#1E40AF] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Categories</p>
                <p className="text-xl sm:text-2xl font-semibold text-stone-900">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-stone-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tenants'
                    ? 'border-[#1E40AF] text-[#1E40AF]'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                } transition duration-150`}
              >
                Active Tenants ({activeTenantsCount})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-[#1E40AF] text-[#1E40AF]'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                } transition duration-150`}
              >
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inactive'
                    ? 'border-[#1E40AF] text-[#1E40AF]'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                } transition duration-150`}
              >
                Inactive Tenants ({inactiveTenantsCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Tenants Tab Content */}
        {activeTab === 'tenants' && (
          <>
            {/* Search */}
            <TenantSearch
              searchParams={searchParams}
              categories={categories}
              onSearchChange={setSearchParams}
              onSearch={handleSearch}
              onReset={handleReset}
            />

            {/* Tenants List */}
            <TenantList
              tenants={displayTenants}
              onEdit={handleEditTenant}
              onDelete={handleDeleteTenantClick}
              onView={handleViewTenant}
              loading={loading}
              
              // Add pagination props
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={allTenants.length}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {/* Tenant Form Modal */}
            {showForm && (
              <TenantForm
                tenant={editingTenant}
                categories={categories}
                onSubmit={handleTenantSubmit}
                onCancel={handleCancelForm}
                isEditing={isEditing}
                isLoading={formLoading}
              />
            )}

            {/* Tenant Detail Modal */}
            {showDetail && selectedTenant && (
              <TenantDetail
                tenant={selectedTenant}
                onClose={() => {
                  setShowDetail(false);
                  setSelectedTenant(undefined);
                }}
                onEdit={handleEditTenant}
              />
            )}
          </>
        )}

        {/* Categories Tab Content */}
        {activeTab === 'categories' && (
          <TenantCategoryList
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategoryClick}
            loading={categoriesLoading}
          />
        )}

        {/* Inactive Tenants Tab Content */}
        {activeTab === 'inactive' && (
          <InactiveTenants />
        )}

        {/* Delete Confirmation Modals */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteTenant}
          onCancel={handleCancelDelete}
          title="Delete Tenant"
          message={`Are you sure you want to delete "${getTenantToDeleteName()}"? This action cannot be undone.`}
          isLoading={deleteLoading}
        />

        <DeleteConfirmationModal
          isOpen={showCategoryDeleteModal}
          onConfirm={handleDeleteCategory}
          onCancel={handleCancelCategoryDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${getCategoryToDeleteName()}"? This action cannot be undone.`}
          isLoading={categoryDeleteLoading}
        />

        {/* Category Form Modal */}
        {showCategoryForm && (
          <TenantCategoryForm
            category={editingCategory}
            onSubmit={handleCategorySubmit}
            onCancel={handleCancelCategoryForm}
            isEditing={isEditingCategory}
            isLoading={categoryFormLoading}
          />
        )}
      </div>
    </div>
  );
};

export default TenantManagement;