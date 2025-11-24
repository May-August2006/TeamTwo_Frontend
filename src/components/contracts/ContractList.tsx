// components/contracts/ContractList.tsx
import React, { useState, useEffect } from 'react';
import { contractApi } from '../../api/ContractAPI';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import type { Contract, ContractStatus } from '../../types/contract';

interface ContractListProps {
  onViewContract?: (contract: Contract) => void;
  onEditContract?: (contract: Contract) => void;
  onRenewContract?: (contract: Contract) => void;
  onTerminateContract?: (contract: Contract) => void;
  onCreateContract?: () => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  onViewContract,
  onEditContract,
  onRenewContract,
  onTerminateContract,
  onCreateContract
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'startDate' | 'endDate' | 'contractNumber'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load contracts on component mount
  useEffect(() => {
    loadContracts();
  }, []);

  // Filter and sort contracts when filters change
  useEffect(() => {
    filterAndSortContracts();
  }, [contracts, statusFilter, searchTerm, sortBy, sortOrder]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractApi.getAll();
      
      let contractsData: Contract[] = [];
      
      if (Array.isArray(response)) {
        contractsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        contractsData = response.data;
      } else {
        console.warn('Unexpected API response structure:', response);
        contractsData = [];
      }
      
      console.log('Loaded contracts:', contractsData);
      setContracts(contractsData);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortContracts = () => {
    let filtered = [...contracts];

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(contract => contract.contractStatus === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.contractNumber?.toLowerCase().includes(term) ||
        contract.tenant?.tenantName?.toLowerCase().includes(term) ||
        contract.room?.roomNumber?.toLowerCase().includes(term) ||
        contract.tenant?.email?.toLowerCase().includes(term) ||
        contract.tenant?.phone?.includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
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
          aValue = a.contractNumber || '';
          bValue = b.contractNumber || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredContracts(filtered);
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      EXPIRING: { color: 'bg-orange-100 text-orange-800', label: 'Expiring' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDaysRemaining = (endDate: string): number => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' MMK';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  // Check if value exists
  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  };

  // Check if contract can be renewed
  // const canRenewContract = (contract: Contract): boolean => {
  //   if (contract.contractStatus !== 'ACTIVE' && contract.contractStatus !== 'EXPIRING') {
  //     return false;
  //   }
    
  //   const daysRemaining = getDaysRemaining(contract.endDate);
  //   return daysRemaining <= 90; // Allow renewal within 90 days of expiry
  // };
  
   // Check if contract can be renewed - SIMPLIFIED VERSION
  const canRenewContract = (contract: Contract): boolean => {
    // Allow renewal for ACTIVE and EXPIRING contracts regardless of days remaining
    return contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING';
  };

  // Check if contract can be terminated
  const canTerminateContract = (contract: Contract): boolean => {
    return contract.contractStatus === 'ACTIVE';
  };

  // Check if contract can be edited
  const canEditContract = (contract: Contract): boolean => {
    return contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING';
  };

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

      {/* Stats Summary */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{contracts.length}</div>
            <div className="text-sm text-gray-600">Total Contracts</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {contracts.filter(c => c.contractStatus === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {contracts.filter(c => c.contractStatus === 'EXPIRING').length}
            </div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">
              {contracts.filter(c => 
                c.contractStatus === 'EXPIRED' || 
                c.contractStatus === 'TERMINATED'
              ).length}
            </div>
            <div className="text-sm text-gray-600">Ended</div>
          </div>
        </div>
      )}
      {/* Header and Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contracts Management</h1>
            <p className="text-gray-600 mt-1">
              {filteredContracts.length} of {contracts.length} contracts
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Create Contract Button */}
            {onCreateContract && (
              <Button
                onClick={onCreateContract}
                variant="primary"
                className="whitespace-nowrap"
              >
                Create New Contract
              </Button>
            )}

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'ALL')}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING">Expiring</option>
              <option value="EXPIRED">Expired</option>
              <option value="TERMINATED">Terminated</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'startDate' | 'endDate' | 'contractNumber')}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="startDate">Sort by Start Date</option>
              <option value="endDate">Sort by End Date</option>
              <option value="contractNumber">Sort by Contract No.</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {contracts.length === 0 ? 'Get started by creating a new contract.' : 'Try changing your filters.'}
            </p>
            {onCreateContract && contracts.length === 0 && (
              <Button onClick={onCreateContract} variant="primary" className="mt-4">
                Create Your First Contract
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => {
                  const daysRemaining = getDaysRemaining(contract.endDate);
                  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
                  const isOverdue = daysRemaining < 0;

                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      {/* Contract Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {hasValue(contract.contractNumber) ? contract.contractNumber : '-'}
                          </div>
                          {hasValue(contract.contractDurationType) && (
                            <div className="text-sm text-gray-500">
                              {contract.contractDurationType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tenant Info */}
                      <td className="px-6 py-4">
                        <div>
                          {hasValue(contract.tenant?.tenantName) && (
                            <div className="text-sm font-medium text-gray-900">
                              {contract.tenant.tenantName}
                            </div>
                          )}
                          {(hasValue(contract.tenant?.phone) || hasValue(contract.tenant?.email)) && (
                            <div className="text-xs text-gray-500">
                              {hasValue(contract.tenant?.phone) && contract.tenant.phone}
                              {hasValue(contract.tenant?.phone) && hasValue(contract.tenant?.email) && ' • '}
                              {hasValue(contract.tenant?.email) && contract.tenant.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Room Info */}
                      <td className="px-6 py-4">
                        <div>
                          {hasValue(contract.room?.roomNumber) && (
                            <div className="text-sm font-medium text-gray-900">
                              {contract.room.roomNumber}
                            </div>
                          )}
                          {hasValue(contract.room?.level?.levelName) && (
                            <div className="text-sm text-gray-500">
                              {contract.room.level.levelName}
                            </div>
                          )}
                          {hasValue(contract.room?.level?.building?.buildingName) && (
                            <div className="text-xs text-gray-400">
                              {contract.room.level.building.buildingName}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Period */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(contract.startDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {formatDate(contract.endDate)}
                        </div>
                        {isExpiringSoon && contract.contractStatus === 'ACTIVE' && (
                          <div className="text-xs text-orange-600 font-medium">
                            {daysRemaining} days left
                          </div>
                        )}
                        {isOverdue && contract.contractStatus === 'ACTIVE' && (
                          <div className="text-xs text-red-600 font-medium">
                            Expired {Math.abs(daysRemaining)} days ago
                          </div>
                        )}
                      </td>

                      {/* Financial */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(contract.rentalFee)}
                        </div>
                        {hasValue(contract.securityDeposit) && contract.securityDeposit > 0 && (
                          <div className="text-xs text-gray-400">
                            Deposit: {formatCurrency(contract.securityDeposit)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.contractStatus)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {onViewContract && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onViewContract(contract)}
                            >
                              View
                            </Button>
                          )}
                          
                          {onEditContract && canEditContract(contract) && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onEditContract(contract)}
                            >
                              Edit
                            </Button>
                          )}
                          
                          {onRenewContract && canRenewContract(contract) && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onRenewContract(contract)}
                            >
                              Renew
                            </Button>
                          )}
                          
                          {onTerminateContract && canTerminateContract(contract) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onTerminateContract(contract)}
                            >
                              Terminate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
    </div>
  );
};