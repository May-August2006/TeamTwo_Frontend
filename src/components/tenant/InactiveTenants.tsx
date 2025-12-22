import React, { useState, useEffect } from 'react';
import type { Tenant } from '../../types/tenant';
import { tenantApi } from '../../api/TenantAPI';
import InactiveTenantList from './InactiveTenantList';
import InactiveTenantSearch from './InactiveTenantSearch';

const InactiveTenants: React.FC = () => {
  const [inactiveTenants, setInactiveTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchName, setSearchName] = useState<string>('');
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [allInactiveTenants, setAllInactiveTenants] = useState<Tenant[]>([]);
  const [displayInactiveTenants, setDisplayInactiveTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadInactiveTenants();
  }, []);

  // Update display tenants based on pagination
  const updateDisplayTenants = (tenants: Tenant[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTenants = tenants.slice(startIndex, endIndex);
    setDisplayInactiveTenants(pageTenants);
    setInactiveTenants(pageTenants);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateDisplayTenants(allInactiveTenants, page);
  };

  const loadInactiveTenants = async (name?: string) => {
    try {
      setLoading(true);
      setError('');
      const data = name 
        ? await tenantApi.searchInactive(name)
        : await tenantApi.getInactive();
      
      setAllInactiveTenants(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      updateDisplayTenants(data, currentPage);
    } catch (err: any) {
      setError('Failed to load inactive tenants. Please try again.');
      console.error('Error loading inactive tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadInactiveTenants(searchName);
  };

  const handleReset = () => {
    setSearchName('');
    setCurrentPage(1);
    loadInactiveTenants();
  };

  const handleReactivate = async (id: number) => {
    try {
      setReactivatingId(id);
      setError('');
      await tenantApi.reactivate(id);
      
      // Remove from all inactive tenants
      const updatedInactiveTenants = allInactiveTenants.filter(tenant => tenant.id !== id);
      setAllInactiveTenants(updatedInactiveTenants);
      const newTotalPages = Math.ceil(updatedInactiveTenants.length / itemsPerPage);
      setTotalPages(newTotalPages);
      
      // Adjust current page if needed
      if (currentPage > newTotalPages && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        updateDisplayTenants(updatedInactiveTenants, newPage);
      } else {
        updateDisplayTenants(updatedInactiveTenants, currentPage);
      }
      
      setSuccess('Tenant reactivated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate tenant');
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inactive Tenants</h2>
            <p className="text-gray-600 mt-2">
              Manage and reactivate deactivated tenant accounts
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{allInactiveTenants.length}</div>
            <div className="text-sm text-gray-500">Inactive Tenants</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
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

      {/* Search */}
      <InactiveTenantSearch
        searchName={searchName}
        onSearchNameChange={setSearchName}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      {/* Inactive Tenants List with Pagination */}
      <InactiveTenantList
        tenants={displayInactiveTenants}
        onReactivate={handleReactivate}
        loading={loading}
        reactivatingId={reactivatingId}
        
        // Pagination props
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={allInactiveTenants.length}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Info Card */}
      {allInactiveTenants.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">About Inactive Tenants</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Inactive tenants are accounts that have been deactivated. You can reactivate them 
                  to restore their access and associated contracts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InactiveTenants;