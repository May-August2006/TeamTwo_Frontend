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

  useEffect(() => {
    loadInactiveTenants();
  }, []);

  const loadInactiveTenants = async (name?: string) => {
    try {
      setLoading(true);
      setError('');
      const data = name 
        ? await tenantApi.searchInactive(name)
        : await tenantApi.getInactive();
      setInactiveTenants(data);
    } catch (err: any) {
      setError('Failed to load inactive tenants. Please try again.');
      console.error('Error loading inactive tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadInactiveTenants(searchName);
  };

  const handleReset = () => {
    setSearchName('');
    loadInactiveTenants();
  };

  const handleReactivate = async (id: number) => {
    try {
      setReactivatingId(id);
      setError('');
      await tenantApi.reactivate(id);
      
      // Remove from list after reactivation
      setInactiveTenants(prev => prev.filter(tenant => tenant.id !== id));
      
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
            <div className="text-3xl font-bold text-gray-900">{inactiveTenants.length}</div>
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

      {/* Inactive Tenants List */}
      <InactiveTenantList
        tenants={inactiveTenants}
        onReactivate={handleReactivate}
        loading={loading}
        reactivatingId={reactivatingId}
      />

      {/* Info Card */}
      {inactiveTenants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Inactive Tenants</h3>
              <div className="mt-2 text-sm text-blue-700">
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