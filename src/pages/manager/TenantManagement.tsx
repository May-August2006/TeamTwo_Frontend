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

  // Tab state
  const [activeTab, setActiveTab] = useState<'tenants' | 'categories' | 'inactive'>('tenants');

  const [searchParams, setSearchParams] = useState<TenantSearchParams>({});

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();

  // Debug effect
  useEffect(() => {
    console.log('Tenants state updated:', tenants.length, 'tenants');
  }, [tenants]);

  useEffect(() => {
    loadTenants();
    loadCategories();
    loadInactiveTenantsCount();
  }, []);

  const loadTenants = async (params: TenantSearchParams = {}) => {
    try {
      setLoading(true);
      console.log('Loading tenants with params:', params);
      
      const data = params.name || params.categoryId || params.email || params.phone
        ? await tenantApi.search(params)
        : await tenantApi.getAll();
      
      console.log('Loaded tenants:', data.length);
      setTenants(data);
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

  // Tenant handlers - FIXED VERSIONS
  const handleCreateTenant = async (tenantData: CreateTenantRequest) => {
    try {
      setFormLoading(true);
      setError('');
      console.log('Creating tenant with data:', tenantData);
      
      const newTenant = await tenantApi.create(tenantData);
      console.log('Created tenant:', newTenant);
      
      setShowForm(false);
      setSuccess('Tenant created successfully!');
      
      // Update state immediately
      if (newTenant && newTenant.id) {
        setTenants(prev => [...prev, newTenant]);
      } else {
        // Fallback: reload from server if API response is incomplete
        await loadTenants(searchParams);
      }
      
      loadInactiveTenantsCount();
      
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
      
      // Update state immediately
      setTenants(prev => 
        prev.map(tenant => 
          tenant.id === editingTenant.id ? { ...tenant, ...updatedTenant } : tenant
        )
      );
      
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
      
      // Update state immediately
      setTenants(prev => prev.filter(tenant => tenant.id !== deletingTenantId));
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
    // Close detail view first
    setShowDetail(false);
    setSelectedTenant(undefined);
    
    // Then open edit form
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
      
      // Update state immediately
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
      
      // Update state immediately
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
      
      // Update state immediately
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
    loadTenants(searchParams);
  };

  const handleReset = () => {
    setSearchParams({});
    loadTenants({});
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
              <p className="text-gray-600 mt-2">Manage your tenants, categories, and inactive accounts</p>
            </div>
            {activeTab === 'tenants' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add New Tenant
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Add New Category
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tenants'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Tenants ({tenants.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inactive'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Inactive Tenants ({inactiveTenantsCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-semibold text-gray-900">{tenants.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Tenants</p>
                <p className="text-2xl font-semibold text-gray-900">{inactiveTenantsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

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
              tenants={tenants}
              onEdit={handleEditTenant}
              onDelete={handleDeleteTenantClick}
              onView={handleViewTenant}
              loading={loading}
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