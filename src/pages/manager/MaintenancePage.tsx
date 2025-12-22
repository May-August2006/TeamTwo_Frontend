/** @format */

import React, { useState, useEffect } from "react";
import { maintenanceApi } from "../../api/maintenanceApi";
import { buildingApi } from "../../api/BuildingAPI";
import type { MaintenanceRequest, MaintenanceStats } from "../../types/maintenance";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  fullName: string;
  email: string;
}

interface Building {
  id: number;
  buildingName: string;
  buildingCode?: string;
}

const ManagerMaintenancePage: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [users, setUsers] = useState<User[]>([]);
  const [assignedBuilding, setAssignedBuilding] = useState<Building | null>(null);
  const [stats, setStats] = useState<MaintenanceStats>({
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    // Fetch assigned building first, then fetch requests
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Get the manager's assigned building
        const buildingResponse = await buildingApi.getMyAssignedBuilding();
        if (buildingResponse.data) {
          setAssignedBuilding(buildingResponse.data);
          
          // 2. If manager has a building, fetch stats for that building
          await fetchStatsForBuilding(buildingResponse.data.id);
        } else {
          // 3. If no building assigned, show empty state
          setRequests([]);
          setFilteredRequests([]);
        }
        
        // 4. Fetch users for assignment dropdown
        await fetchUsers();
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || t('maintenance.loadFailed', "Failed to load data"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, priorityFilter]);

  const fetchStatsForBuilding = async (buildingId: number) => {
    try {
      // First fetch all requests for the building
      const response = await maintenanceApi.getRequestsByBuilding(buildingId);
      setRequests(response.data);
      
      // Calculate stats locally
      const pending = response.data.filter(req => req.status === "PENDING").length;
      const inProgress = response.data.filter(req => req.status === "IN_PROGRESS").length;
      const completed = response.data.filter(req => req.status === "COMPLETED").length;
      const cancelled = response.data.filter(req => req.status === "CANCELLED").length;
      
      setStats({
        pending,
        inProgress,
        completed,
        cancelled
      });
    } catch (err: any) {
      console.error("Error fetching requests for building:", err);
      throw err;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/users/staff");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (priorityFilter !== "ALL") {
      filtered = filtered.filter((req) => req.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      setError(null);
      await maintenanceApi.updateRequestStatus(requestId, {
        status: newStatus as any,
      });
      
      // Refresh the data
      if (assignedBuilding) {
        await fetchStatsForBuilding(assignedBuilding.id);
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.message || t('maintenance.updateFailed', "Failed to update request status"));
    }
  };

  const handleAssign = async (requestId: number, userId: number) => {
    try {
      setError(null);
      await maintenanceApi.assignRequest(requestId, { assignedTo: userId });
      
      // Refresh the data
      if (assignedBuilding) {
        await fetchStatsForBuilding(assignedBuilding.id);
      }
    } catch (err: any) {
      console.error("Error assigning request:", err);
      setError(err.response?.data?.message || t('maintenance.assignFailed', "Failed to assign request"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-stone-100 text-stone-800";
      case "MEDIUM":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">
          {t('maintenance.loading', "Loading maintenance requests...")}
        </div>
      </div>
    );
  }

  // If manager has no building assigned
  if (!assignedBuilding) {
    return (
      <div className="p-6 min-h-screen bg-stone-50">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            {t('maintenance.noBuilding', "No Building Assigned")}
          </h2>
          <p className="text-stone-600 mb-6">
            {t('maintenance.noBuildingDesc', "You haven't been assigned to any building yet. Please contact your administrator.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      {/* Header with Building Info */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {t('maintenance.title', "Maintenance Requests")}
            </h1>
            <p className="text-stone-600 mt-1 text-sm sm:text-base">
              {t('maintenance.subtitle', "Manage maintenance requests for")} <span className="font-semibold text-red-600">{assignedBuilding.buildingName}</span>
            </p>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="text-sm font-medium text-stone-700">
              {t('maintenance.assignedBuilding', "Assigned Building")}
            </div>
            <div className="text-lg font-bold text-red-600">{assignedBuilding.buildingName}</div>
            {assignedBuilding.buildingCode && (
              <div className="text-sm text-stone-500">
                {t('maintenance.code', "Code")}: {assignedBuilding.buildingCode}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
          <svg className="w-5 h-5 mr-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="text-sm font-medium text-stone-600">
            {t('maintenance.pending', "Pending")}
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="text-sm font-medium text-stone-600">
            {t('maintenance.inProgress', "In Progress")}
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.inProgress}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="text-sm font-medium text-stone-600">
            {t('maintenance.completed', "Completed")}
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="text-sm font-medium text-stone-600">
            {t('maintenance.cancelled', "Cancelled")}
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t('maintenance.status', "Status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 bg-white"
            >
              <option value="ALL">{t('maintenance.allStatus', "All Status")}</option>
              <option value="PENDING">{t('maintenance.pending', "Pending")}</option>
              <option value="IN_PROGRESS">{t('maintenance.inProgress', "In Progress")}</option>
              <option value="COMPLETED">{t('maintenance.completed', "Completed")}</option>
              <option value="CANCELLED">{t('maintenance.cancelled', "Cancelled")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t('maintenance.priority', "Priority")}
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 bg-white"
            >
              <option value="ALL">{t('maintenance.allPriority', "All Priority")}</option>
              <option value="LOW">{t('maintenance.low', "Low")}</option>
              <option value="MEDIUM">{t('maintenance.medium', "Medium")}</option>
              <option value="HIGH">{t('maintenance.high', "High")}</option>
              <option value="URGENT">{t('maintenance.urgent', "Urgent")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-stone-500 bg-stone-50">
            <div className="text-5xl mb-3">🔧</div>
            <div className="text-xl font-semibold text-stone-700">
              {t('maintenance.noRequests', "No Maintenance Requests")}
            </div>
            <p className="text-sm mt-1">
              {requests.length === 0 
                ? t('maintenance.noRequestsForBuilding', "No maintenance requests found for your building")
                : t('maintenance.noMatchingRequests', "No requests match your current filters")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.request', "Request")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.tenantRoom', "Tenant & Room")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.priority', "Priority")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.status', "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.assignedTo', "Assigned To")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.created', "Created")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {t('maintenance.actions', "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-red-50/50 transition duration-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-stone-900">
                          {request.requestTitle}
                        </div>
                        <div className="text-sm text-stone-500 truncate max-w-xs">
                          {request.requestDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-900">{request.tenantName}</div>
                      <div className="text-sm text-stone-500">
                        {t('maintenance.room', "Room")} {request.roomNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {request.assignedToName || (
                        <select
                          onChange={(e) => handleAssign(request.id, parseInt(e.target.value))}
                          className="border border-stone-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 transition duration-150"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            {t('maintenance.assignTo', "Assign to...")}
                          </option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 transition duration-150 px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          {t('maintenance.view', "View")}
                        </button>
                       
                        {request.status !== "COMPLETED" && request.status !== "CANCELLED" && (
                          <select
                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                            value={request.status}
                            className="border border-stone-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 transition duration-150"
                          >
                            <option value="PENDING">{t('maintenance.pending', "Pending")}</option>
                            <option value="IN_PROGRESS">{t('maintenance.inProgress', "In Progress")}</option>
                            <option value="COMPLETED">{t('maintenance.complete', "Complete")}</option>
                            <option value="CANCELLED">{t('maintenance.cancel', "Cancel")}</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-stone-900">{selectedRequest.requestTitle}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 transition duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    {t('maintenance.tenant', "Tenant")}
                  </label>
                  <p className="mt-1 text-sm text-stone-900">{selectedRequest.tenantName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    {t('maintenance.room', "Room")}
                  </label>
                  <p className="mt-1 text-sm text-stone-900">{selectedRequest.roomNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    {t('maintenance.priority', "Priority")}
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                      selectedRequest.priority
                    )}`}
                  >
                    {selectedRequest.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    {t('maintenance.status', "Status")}
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700">
                  {t('maintenance.description', "Description")}
                </label>
                <p className="mt-1 text-sm text-stone-900 bg-stone-50 p-3 rounded-lg">
                  {selectedRequest.requestDescription}
                </p>
              </div>

              {selectedRequest.tenantFeedback && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700">
                    {t('maintenance.tenantFeedback', "Tenant Feedback")}
                  </label>
                  <p className="mt-1 text-sm text-stone-900 bg-stone-50 p-3 rounded-lg">
                    {selectedRequest.tenantFeedback}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition duration-150"
                >
                  {t('common.close', "Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMaintenancePage;