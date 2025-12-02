// components/contracts/ContractList.tsx
import React, { useState, useEffect } from 'react';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { Contract, ContractStatus } from '../../types/contract';

interface ContractListProps {
  onViewContract: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
  onRenewContract: (contract: Contract) => void;
  onTerminateContract: (contract: Contract) => void;
  onCreateContract: () => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  onViewContract,
  onEditContract,
  onRenewContract,
  onTerminateContract,
  onCreateContract,
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'startDate' | 'endDate' | 'contractNumber'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractApi.getAll();
      setContracts(response.data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      EXPIRING: { color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US').format(amount) + ' MMK';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US');
    } catch (error) {
      return '-';
    }
  };

  const getDaysRemaining = (endDate: string): number => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(days, 0);
    } catch (error) {
      return 0;
    }
  };

  // Filter and sort contracts
  const filteredAndSortedContracts = contracts
    .filter(contract => {
      // Status filter
      if (statusFilter !== 'ALL' && contract.contractStatus !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          contract.contractNumber?.toLowerCase().includes(searchLower) ||
          contract.tenant?.tenantName?.toLowerCase().includes(searchLower) ||
          contract.tenant?.email?.toLowerCase().includes(searchLower) ||
          contract.unit?.unitNumber?.toLowerCase().includes(searchLower) ||
          contract.tenantSearchName?.toLowerCase().includes(searchLower) ||
          contract.tenantSearchEmail?.toLowerCase().includes(searchLower) ||
          contract.tenantSearchPhone?.includes(searchTerm)
        );
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case 'contractNumber':
          aValue = a.contractNumber;
          bValue = b.contractNumber;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: 'startDate' | 'endDate' | 'contractNumber') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStats = () => {
    const total = contracts.length;
    const active = contracts.filter(c => c.contractStatus === 'ACTIVE').length;
    const expiring = contracts.filter(c => c.contractStatus === 'EXPIRING').length;
    const terminated = contracts.filter(c => c.contractStatus === 'TERMINATED').length;
    const expired = contracts.filter(c => c.contractStatus === 'EXPIRED').length;

    return { total, active, expiring, terminated, expired };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading contracts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadContracts} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts Management</h1>
          <p className="text-gray-600 mt-1">Manage all rental contracts and lease agreements</p>
        </div>
        <Button onClick={onCreateContract} variant="primary">
          Create New Contract
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
          <div className="text-sm text-orange-600">Expiring</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.terminated}</div>
          <div className="text-sm text-red-600">Terminated</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search contracts by number, tenant, unit, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'ALL')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="TERMINATED">Terminated</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Refresh Button */}
          <Button onClick={loadContracts} variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('contractNumber')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Contract</span>
                    <span className="text-xs">{getSortIcon('contractNumber')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Start Date</span>
                    <span className="text-xs">{getSortIcon('startDate')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('endDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>End Date</span>
                    <span className="text-xs">{getSortIcon('endDate')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {contracts.length === 0 
                        ? "Get started by creating a new contract."
                        : "Try adjusting your search or filter criteria."
                      }
                    </p>
                    {contracts.length === 0 && (
                      <div className="mt-4">
                        <Button onClick={onCreateContract} variant="primary">
                          Create New Contract
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedContracts.map((contract) => {
                  const daysRemaining = getDaysRemaining(contract.endDate);
                  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.contractNumber}
                          </div>
                          {contract.fileUrl && (
                            <div className="text-xs text-blue-600 flex items-center mt-1">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Document
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.tenant?.tenantName || contract.tenantSearchName || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.tenant?.email || contract.tenantSearchEmail || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.unit?.unitNumber || '-'}</div>
                        <div className="text-sm text-gray-500">
                          {contract.unit?.roomType?.typeName || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(contract.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(contract.endDate)}</div>
                        {isExpiringSoon && contract.contractStatus === 'ACTIVE' && (
                          <div className="text-xs text-orange-600">
                            {daysRemaining} days left
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(contract.rentalFee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.contractStatus as ContractStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onViewContract(contract)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View
                          </button>
                          
                          {contract.contractStatus !== 'TERMINATED' && contract.contractStatus !== 'EXPIRED' && (
                            <button
                              onClick={() => onEditContract(contract)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Edit
                            </button>
                          )}
                          
                          {(contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING') && 
                           daysRemaining <= 60 && (
                            <button
                              onClick={() => onRenewContract(contract)}
                              className="text-purple-600 hover:text-purple-900 font-medium"
                            >
                              Renew
                            </button>
                          )}
                          
                          {contract.contractStatus === 'ACTIVE' && (
                            <button
                              onClick={() => onTerminateContract(contract)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Terminate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Results Count */}
        {filteredAndSortedContracts.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedContracts.length} of {contracts.length} contracts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};