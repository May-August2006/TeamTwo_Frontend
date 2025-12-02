/** @format */

import React, { useState, useEffect } from "react";
import { maintenanceApi } from "../../api/maintenanceApi";
import { useAuth } from "../../context/AuthContext";
import type { MaintenanceRequest, CreateMaintenanceRequest } from "../../types/maintenance";

const TenantMaintenancePage: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRequest, setNewRequest] = useState<CreateMaintenanceRequest>({
    requestTitle: "",
    requestDescription: "",
    priority: "MEDIUM",
    tenantId: 0,
    roomId: 0,
  });

  const { username, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const mockTenantId = 1;
      const mockRoomId = 2;
      
      setNewRequest(prev => ({
        ...prev,
        tenantId: mockTenantId,
        roomId: mockRoomId
      }));
      fetchRequests(mockTenantId);
    }
  }, [isAuthenticated]);

  const fetchRequests = async (tenantId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await maintenanceApi.getRequestsByTenant(tenantId);
      setRequests(response.data);
    } catch (err: any) {
      console.error("Error fetching maintenance requests:", err);
      setError(err.response?.data?.message || "Failed to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("You must be logged in to submit a request");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await maintenanceApi.createRequest(newRequest);
      setIsModalOpen(false);
      setNewRequest({
        requestTitle: "",
        requestDescription: "",
        priority: "MEDIUM",
        tenantId: newRequest.tenantId,
        roomId: newRequest.roomId,
      });
      fetchRequests(newRequest.tenantId);
    } catch (err: any) {
      console.error("Error submitting maintenance request:", err);
      setError(err.response?.data?.message || "Failed to submit maintenance request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeedback = async (requestId: number, feedback: string) => {
    try {
      setError(null);
      await maintenanceApi.updateRequestStatus(requestId, {
        status: "COMPLETED",
        feedback: feedback,
      });
      fetchRequests(newRequest.tenantId);
    } catch (err: any) {
      console.error("Error adding feedback:", err);
      setError(err.response?.data?.message || "Failed to add feedback");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
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
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-lg text-red-600 bg-white p-6 rounded-xl shadow-lg border border-stone-200">Please log in to access maintenance requests</div>
      </div>
    );
  }

  if (isLoading && requests.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading maintenance requests...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Maintenance Requests</h1>
          <p className="text-stone-600 mt-1">Submit and track your maintenance requests</p>
          <p className="text-sm text-stone-500 mt-2">Welcome, {username}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading}
          className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 mt-4 sm:mt-0 font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Submitting..." : "New Request"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-stone-500 bg-stone-50">
            <div className="text-5xl mb-3">🔧</div>
            <div className="text-xl font-semibold text-stone-700">No Maintenance Requests Found</div>
            <p className="text-sm mt-1">Create your first maintenance request to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-red-50/50 transition duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">
                          {request.requestTitle}
                        </div>
                        <div className="text-sm text-stone-500">
                          {request.requestDescription}
                        </div>
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
                      {request.assignedToName || "Not assigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === "COMPLETED" && !request.tenantFeedback && (
                        <button
                          onClick={() => {
                            const feedback = prompt("Please provide your feedback:");
                            if (feedback) {
                              handleAddFeedback(request.id, feedback);
                            }
                          }}
                          className="text-green-600 hover:text-green-800 font-semibold transition duration-150"
                        >
                          Add Feedback
                        </button>
                      )}
                      {request.tenantFeedback && (
                        <span className="text-stone-500">Feedback provided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-stone-900 border-b border-stone-200 pb-2">New Maintenance Request</h3>
              <form onSubmit={handleSubmitRequest}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newRequest.requestTitle}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, requestTitle: e.target.value })
                    }
                    className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm"
                    placeholder="Brief description of the issue"
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={newRequest.requestDescription}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, requestDescription: e.target.value })
                    }
                    rows={4}
                    className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm"
                    placeholder="Detailed description of the maintenance issue..."
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                      })
                    }
                    className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 shadow-sm"
                    disabled={isLoading}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition duration-150 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150 disabled:opacity-50 transform active:scale-95"
                  >
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantMaintenancePage;