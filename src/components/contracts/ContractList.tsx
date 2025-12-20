// components/contracts/ContractList.tsx
import React, { useState, useEffect } from "react";
import { contractApi } from "../../api/ContractAPI";
import { buildingApi } from "../../api/BuildingAPI";
import { Button } from "../common/ui/Button";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import type { Contract, ContractStatus } from "../../types/contract";
import type { Level } from "../../types";

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
  const { user } = useAuth();
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [displayContracts, setDisplayContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");
  const [levelFilter, setLevelFilter] = useState<number | "ALL">("ALL");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"startDate" | "endDate" | "contractNumber">("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildingName, setBuildingName] = useState<string>("");
  const [levels, setLevels] = useState<Level[]>([]);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBuildingAndContracts();
  }, []);

  useEffect(() => {
    updateDisplayContracts();
  }, [filteredContracts, currentPage, sortBy, sortOrder]);

  const updateDisplayContracts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const sorted = [...filteredContracts].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "startDate":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case "endDate":
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case "contractNumber":
          aValue = a.contractNumber;
          bValue = b.contractNumber;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    const pageContracts = sorted.slice(startIndex, endIndex);
    setDisplayContracts(pageContracts);
    setTotalPages(Math.ceil(filteredContracts.length / itemsPerPage));
  };

  const loadBuildingAndContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      // Load building for manager
      if (user?.role === "ROLE_MANAGER") {
        try {
          const buildingResponse = await buildingApi.getMyAssignedBuilding();
          if (buildingResponse.data) {
            setBuildingId(buildingResponse.data.id);
            setBuildingName(buildingResponse.data.buildingName);
            
            // Load levels for this building
            const levelsResponse = await buildingApi.getLevelsByBuilding(buildingResponse.data.id);
            setLevels(levelsResponse.data || []);
            
            // Load contracts for this building
            const contractsResponse = await buildingApi.getContractsByBuilding(buildingResponse.data.id);
            const contracts = contractsResponse.data || [];
            setAllContracts(contracts);
            setFilteredContracts(contracts);
            extractBusinessTypes(contracts);
          } else {
            setAllContracts([]);
            setFilteredContracts([]);
            setDisplayContracts([]);
            setError("No building assigned to you yet. Please contact administrator.");
          }
        } catch (buildingErr) {
          console.error("Error loading building:", buildingErr);
          setAllContracts([]);
          setFilteredContracts([]);
          setDisplayContracts([]);
          setError("Failed to load your assigned building information.");
        }
      } else if (user?.role === "ROLE_ADMIN") {
        // Admin can see all contracts
        const response = await contractApi.getAll();
        const contracts = response.data || [];
        setAllContracts(contracts);
        setFilteredContracts(contracts);
        extractBusinessTypes(contracts);
        
        // Admin can see all levels from all buildings
        try {
          const buildingsResponse = await buildingApi.getAll();
          const allLevels: Level[] = [];
          buildingsResponse.data?.forEach((building: any) => {
            if (building.levels) {
              allLevels.push(...building.levels);
            }
          });
          setLevels(allLevels);
        } catch (err) {
          console.error("Error loading levels for admin:", err);
        }
      } else {
        // Other roles - get building if assigned
        try {
          const buildingResponse = await buildingApi.getMyAssignedBuilding();
          if (buildingResponse.data) {
            setBuildingId(buildingResponse.data.id);
            setBuildingName(buildingResponse.data.buildingName);
            
            // Load levels for this building
            const levelsResponse = await buildingApi.getLevelsByBuilding(buildingResponse.data.id);
            setLevels(levelsResponse.data || []);
            
            const contractsResponse = await buildingApi.getContractsByBuilding(buildingResponse.data.id);
            const contracts = contractsResponse.data || [];
            setAllContracts(contracts);
            setFilteredContracts(contracts);
            extractBusinessTypes(contracts);
          } else {
            const response = await contractApi.getAll();
            const contracts = response.data || [];
            setAllContracts(contracts);
            setFilteredContracts(contracts);
            extractBusinessTypes(contracts);
          }
        } catch (err) {
          console.error("Error loading building for non-manager:", err);
          const response = await contractApi.getAll();
          const contracts = response.data || [];
          setAllContracts(contracts);
          setFilteredContracts(contracts);
          extractBusinessTypes(contracts);
        }
      }
    } catch (err) {
      console.error("Error loading Leases:", err);
      setError("Failed to load Leases");
      setAllContracts([]);
      setFilteredContracts([]);
      setDisplayContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const extractBusinessTypes = (contracts: Contract[]) => {
    const types = new Set<string>();
    contracts.forEach(contract => {
      const businessType = getBusinessType(contract);
      if (businessType && businessType !== "-") {
        types.add(businessType);
      }
    });
    setBusinessTypes(Array.from(types).sort());
  };

  // Apply search and filter
  const handleSearch = () => {
    if (searchTerm.length > 13) return;
    setCurrentPage(1);
    
    let filtered = [...allContracts];
    
    const searchUpper = searchTerm.trim().toUpperCase();
    
    // Apply search filter - ONLY by contract number
    if (searchUpper) {
      filtered = filtered.filter((contract) => 
        contract.contractNumber?.toUpperCase().includes(searchUpper)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((contract) => 
        contract.contractStatus === statusFilter
      );
    }
    
    // Apply level filter
    if (levelFilter !== "ALL") {
      filtered = filtered.filter((contract) => 
        contract.unit?.level?.id === levelFilter
      );
    }
    
    // Apply business type filter
    if (businessTypeFilter !== "ALL") {
      filtered = filtered.filter((contract) => 
        getBusinessType(contract) === businessTypeFilter
      );
    }
    
    setFilteredContracts(filtered);
  };

  // Clear all filters
  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setLevelFilter("ALL");
    setBusinessTypeFilter("ALL");
    setCurrentPage(1);
    setFilteredContracts([...allContracts]);
  };

  const reloadContracts = () => {
    loadBuildingAndContracts();
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
      EXPIRING: {
        color: "bg-orange-100 text-orange-800",
        label: "Expiring Soon",
      },
      TERMINATED: { color: "bg-red-100 text-red-800", label: "Terminated" },
      EXPIRED: { color: "bg-gray-100 text-gray-800", label: "Expired" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat("en-US").format(amount) + " MMK";
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US");
    } catch (error) {
      return "-";
    }
  };

  const getDaysRemaining = (endDate: string): number => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(days, 0);
    } catch (error) {
      return 0;
    }
  };

  const getBusinessType = (contract: Contract): string => {
    return (
      contract.tenant?.businessType ||
      contract.tenant?.tenantCategoryName ||
      contract.tenant?.tenantCategory?.categoryName ||
      "-"
    );
  };

  const handleSort = (field: "startDate" | "endDate" | "contractNumber") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getStats = () => {
    const total = allContracts.length;
    const active = allContracts.filter(
      (c) => c.contractStatus === "ACTIVE"
    ).length;
    const expiring = allContracts.filter(
      (c) => c.contractStatus === "EXPIRING"
    ).length;
    const terminated = allContracts.filter(
      (c) => c.contractStatus === "TERMINATED"
    ).length;
    const expired = allContracts.filter(
      (c) => c.contractStatus === "EXPIRED"
    ).length;

    return { total, active, expiring, terminated, expired };
  };

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = 5;
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (startPage > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      
      if (endPage < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading Leases...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={reloadContracts} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Leases Management
            {buildingId && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({buildingName})
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {buildingId 
              ? `Managing leases for ${buildingName} building only`
              : "Manage all rental lease agreements"}
            {user?.role === "ROLE_MANAGER" && buildingId && (
              <span className="block text-sm text-blue-600 mt-1">
                🔒 You can only view and manage leases in your assigned building
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={onCreateContract} 
          variant="primary-blue"
          className="whitespace-nowrap w-full lg:w-auto"
        >
          Create New Lease
        </Button>
      </div>

      {/* Building Info Banner for Manager */}
      {user?.role === "ROLE_MANAGER" && buildingId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-blue-800 font-medium">
                You are managing leases for: <strong>{buildingName}</strong>
              </span>
              <p className="text-sm text-blue-600 mt-1">
                Only leases from your assigned building are visible. You cannot access leases from other buildings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total</div>
          {buildingId && (
            <div className="text-xs text-gray-500 mt-1 hidden sm:block">In this building</div>
          )}
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <div className="text-xs sm:text-sm text-green-600">Active</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-orange-600">
            {stats.expiring}
          </div>
          <div className="text-xs sm:text-sm text-orange-600">Expiring</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-red-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {stats.terminated}
          </div>
          <div className="text-xs sm:text-sm text-red-600">Terminated</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-gray-600">
            {stats.expired}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Expired</div>
        </div>
      </div>

      {/* Filters and Search - Compact */}
<div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
  <div className="space-y-4">
    {/* Search Row */}
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      {/* Search Input - Narrow */}
      <div className="w-full sm:w-64">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Lease Number Search
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="SGH-YYYY-NNNN"
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (value.length <= 13) setSearchTerm(value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case text-sm font-mono"
            maxLength={13}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            {searchTerm.length}/13
          </div>
        </div>
      </div>
      
      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContractStatus | "ALL")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Expiring Soon</option>
            <option value="TERMINATED">Terminated</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Level
          </label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="ALL">All Levels</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.levelName}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Business Type
          </label>
          <select
            value={businessTypeFilter}
            onChange={(e) => setBusinessTypeFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="ALL">All Business Types</option>
            {businessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="flex gap-2">
      <Button 
        onClick={handleSearch} 
        variant="secondary"
        disabled={searchTerm.length > 13}
        size="sm"
        className="whitespace-nowrap"
      >
        Search
      </Button>
      <Button 
        onClick={handleClear} 
        variant="secondary"
        size="sm"
        className="whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
      >
        Clear All Filters
      </Button>
      {/* <Button 
        onClick={reloadContracts} 
        variant="secondary"
        size="sm"
        className="whitespace-nowrap"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </Button> */}
    </div>
  </div>
</div>

      {/* Contracts Table - Responsive */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("contractNumber")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Lease</span>
                    <span className="text-xs">
                      {getSortIcon("contractNumber")}
                    </span>
                  </div>
                </th>
                {!buildingId && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("startDate")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Start</span>
                    <span className="text-xs">{getSortIcon("startDate")}</span>
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("endDate")}
                >
                  <div className="flex items-center space-x-1">
                    <span>End</span>
                    <span className="text-xs">{getSortIcon("endDate")}</span>
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rent
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={buildingId ? 8 : 9}
                    className="px-4 sm:px-6 py-8 text-center text-gray-500"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No Leases found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {allContracts.length === 0
                        ? buildingId
                          ? `No leases in ${buildingName} building yet. Create your first lease.`
                          : "Get started by creating a new Lease."
                        : "Try adjusting your search or filter criteria."}
                    </p>
                    {allContracts.length === 0 && (
                      <div className="mt-4">
                        <Button 
                          onClick={onCreateContract} 
                          variant="primary-blue"
                          className="whitespace-nowrap"
                        >
                          Create New Lease
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                displayContracts.map((contract) => {
                  const daysRemaining = getDaysRemaining(contract.endDate);
                  const isExpiringSoon =
                    daysRemaining <= 30 && daysRemaining > 0;

                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.contractNumber}
                        </div>
                      </td>
                      {!buildingId && (
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contract.buildingName || "-"}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.tenant?.tenantName ||
                              contract.tenantSearchName ||
                              "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contract.tenant?.email ||
                              contract.tenantSearchEmail ||
                              "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.unit?.unitNumber || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contract.unit?.unitType || "-"}
                        </div>
                        {contract.unit?.level && (
                          <div className="text-xs text-gray-400">
                            {contract.unit.level.levelName}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(contract.startDate)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(contract.endDate)}
                        </div>
                        {isExpiringSoon &&
                          contract.contractStatus === "ACTIVE" && (
                            <div className="text-xs text-orange-600">
                              {daysRemaining}d
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(contract.rentalFee)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {getStatusBadge(
                          contract.contractStatus as ContractStatus
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => onViewContract(contract)}
                            className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1"
                          >
                            View
                          </button>

                          {contract.contractStatus !== "TERMINATED" &&
                            contract.contractStatus !== "EXPIRED" && (
                              <button
                                onClick={() => onEditContract(contract)}
                                className="text-green-600 hover:text-green-900 text-xs px-2 py-1"
                              >
                                Edit
                              </button>
                            )}

                          {(contract.contractStatus === "ACTIVE" ||
                            contract.contractStatus === "EXPIRING") &&
                            daysRemaining <= 60 && (
                              <button
                                onClick={() => onRenewContract(contract)}
                                className="text-purple-600 hover:text-purple-900 text-xs px-2 py-1"
                              >
                                Renew
                              </button>
                            )}

                          {contract.contractStatus === "ACTIVE" && (
                            <button
                              onClick={() => onTerminateContract(contract)}
                              className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
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

        {/* Pagination Controls - Responsive */}
        {filteredContracts.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results summary */}
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredContracts.length)}
                </span>
                {/* {" "}
                of{" "}
                <span className="font-medium text-gray-900">{filteredContracts.length}</span>{" "}
                leases
                {buildingId && (
                  <span className="hidden sm:inline text-blue-600 ml-2">• Only from {buildingName} building</span>
                )} */}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                {/* Page numbers - Hidden on mobile */}
                <div className="hidden sm:flex items-center space-x-1">
                  {getPageNumbers().map((page, index) => (
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-500">•••</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`w-8 h-8 text-sm rounded ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Mobile page indicator */}
                <div className="sm:hidden text-sm font-medium text-gray-700">
                  {currentPage}/{totalPages}
                </div>

                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};