// components/contracts/ContractList.tsx
import React, { useState, useEffect } from "react";
import { contractApi } from "../../api/ContractAPI";
import { buildingApi } from "../../api/BuildingAPI";
import { Button } from "../common/ui/Button";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import type { Contract, ContractStatus } from "../../types/contract";

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
  const [allContracts, setAllContracts] = useState<Contract[]>([]); // All loaded contracts
  const [displayContracts, setDisplayContracts] = useState<Contract[]>([]); // Contracts to display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"startDate" | "endDate" | "contractNumber">("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildingName, setBuildingName] = useState<string>("");

  useEffect(() => {
    loadBuildingAndContracts();
  }, []);

  const loadBuildingAndContracts = async () => {
    try {
      setLoading(true);
      setError(null);

      // If user is manager, get their assigned building
      if (user?.role === "ROLE_MANAGER") {
        try {
          const buildingResponse = await buildingApi.getMyAssignedBuilding();
          if (buildingResponse.data) {
            setBuildingId(buildingResponse.data.id);
            setBuildingName(buildingResponse.data.buildingName);
            
            // Load contracts for this specific building
            const contractsResponse = await buildingApi.getContractsByBuilding(buildingResponse.data.id);
            const contracts = contractsResponse.data || [];
            setAllContracts(contracts);
            setDisplayContracts(contracts); // Initially display all
          } else {
            // Manager doesn't have building assigned yet
            setAllContracts([]);
            setDisplayContracts([]);
            setError("No building assigned to you yet. Please contact administrator.");
          }
        } catch (buildingErr) {
          console.error("Error loading building:", buildingErr);
          setAllContracts([]);
          setDisplayContracts([]);
          setError("Failed to load your assigned building information.");
        }
      } else if (user?.role === "ROLE_ADMIN") {
        // Admin can see all contracts
        const response = await contractApi.getAll();
        const contracts = response.data || [];
        setAllContracts(contracts);
        setDisplayContracts(contracts);
      } else {
        // Other roles (like accountant) - get building if assigned
        try {
          const buildingResponse = await buildingApi.getMyAssignedBuilding();
          if (buildingResponse.data) {
            setBuildingId(buildingResponse.data.id);
            setBuildingName(buildingResponse.data.buildingName);
            const contractsResponse = await buildingApi.getContractsByBuilding(buildingResponse.data.id);
            const contracts = contractsResponse.data || [];
            setAllContracts(contracts);
            setDisplayContracts(contracts);
          } else {
            const response = await contractApi.getAll();
            const contracts = response.data || [];
            setAllContracts(contracts);
            setDisplayContracts(contracts);
          }
        } catch (err) {
          console.error("Error loading building for non-manager:", err);
          const response = await contractApi.getAll();
          const contracts = response.data || [];
          setAllContracts(contracts);
          setDisplayContracts(contracts);
        }
      }
    } catch (err) {
      console.error("Error loading Leases:", err);
      setError("Failed to load Leases");
      setAllContracts([]);
      setDisplayContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply search and filter when search button is clicked
  const handleSearch = () => {
    if (searchTerm.length > 100) return; // Don't search if over limit
    
    let filtered = [...allContracts];
    
    // Convert search term to uppercase for case-insensitive search
    const searchUpper = searchTerm.trim().toUpperCase();
    
    // Apply search filter if search term exists
    if (searchUpper) {
      filtered = filtered.filter((contract) => 
        contract.contractNumber?.toUpperCase().includes(searchUpper) ||
        contract.tenant?.tenantName?.toUpperCase().includes(searchUpper) ||
        contract.tenant?.email?.toUpperCase().includes(searchUpper) ||
        contract.unit?.unitNumber?.toUpperCase().includes(searchUpper) ||
        contract.tenantSearchName?.toUpperCase().includes(searchUpper) ||
        contract.tenantSearchEmail?.toUpperCase().includes(searchUpper) ||
        contract.tenantSearchPhone?.includes(searchTerm) || // Keep original for phone numbers
        contract.unit?.unitType.toUpperCase().includes(searchUpper) ||
        getBusinessType(contract).toUpperCase().includes(searchUpper) ||
        contract.buildingName?.toUpperCase().includes(searchUpper)
      );
    }
    
    // Apply status filter if not "ALL"
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((contract) => 
        contract.contractStatus === statusFilter
      );
    }
    
    setDisplayContracts(filtered);
  };

  // Clear all filters and show all contracts
  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDisplayContracts([...allContracts]); // Reset to show all contracts
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

  // Helper function to get business type
  const getBusinessType = (contract: Contract): string => {
    return (
      contract.tenant?.businessType ||
      contract.tenant?.tenantCategoryName ||
      contract.tenant?.tenantCategory?.categoryName ||
      "-"
    );
  };

  // Sort display contracts
  const sortedContracts = [...displayContracts].sort((a, b) => {
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
    const total = allContracts.length; // Show stats for ALL contracts, not filtered
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
      {/* Header */}
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
          className="whitespace-nowrap"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
          {buildingId && (
            <div className="text-xs text-gray-500 mt-1">In this building</div>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.expiring}
          </div>
          <div className="text-sm text-orange-600">Expiring</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-600">
            {stats.terminated}
          </div>
          <div className="text-sm text-red-600">Terminated</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {stats.expired}
          </div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input with Character Limit and Auto Uppercase */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Leases by number, tenant, unit, building, business type..."
                value={searchTerm}
                onChange={(e) => {
                  // Limit input to 100 characters and convert to uppercase
                  const value = e.target.value.toUpperCase();
                  if (value.length <= 100) {
                    setSearchTerm(value);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(); // Search on Enter key
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {searchTerm.length}/100
              </div>
            </div>
            {searchTerm.length >= 100 && (
              <div className="text-xs text-red-500 mt-1">
                Maximum 100 characters allowed
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ContractStatus | "ALL")
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="TERMINATED">Terminated</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            variant="secondary"
            disabled={searchTerm.length > 100}
          >
            Search
          </Button>

          {/* Clear Button */}
          <Button 
            onClick={handleClear} 
            variant="secondary"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
          >
            Clear
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
              {sortedContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={buildingId ? 8 : 9}
                    className="px-6 py-8 text-center text-gray-500"
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
                sortedContracts.map((contract) => {
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

        {/* Results Count */}
        {sortedContracts.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {sortedContracts.length} of {allContracts.length}{" "}
              Leases
              {buildingId && (
                <span className="text-blue-600 ml-2">
                  • Only from {buildingName} building
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};