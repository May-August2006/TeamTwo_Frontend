/** @format */
import React, { useState, useEffect } from "react";
import { maintenanceApi } from "../../api/maintenanceApi";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import type {
  MaintenanceRequest,
  CreateMaintenanceRequest,
} from "../../types/maintenance";
import type { Unit } from "../../types/unit";

// Utility to decode JWT
const decodeJWT = (token: string): any => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

const TenantMaintenancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [newRequest, setNewRequest] = useState<CreateMaintenanceRequest>({
    requestTitle: "",
    requestDescription: "",
    priority: "MEDIUM",
    tenantId: 0,
    roomId: 0,
  });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const { accessToken, username, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initializePage();
    }
  }, [isAuthenticated, accessToken]);

  const initializePage = () => {
    try {
      const decoded = decodeJWT(accessToken!);
      const foundTenantId = decoded?.tenantId;

      if (foundTenantId) {
        setTenantId(foundTenantId);
        setNewRequest((prev) => ({ ...prev, tenantId: foundTenantId }));
        loadData(foundTenantId);
      } else {
        setError(t("maintenance.messages.error.noTenantId"));
      }
    } catch (err) {
      setError(t("maintenance.messages.error.general"));
    }
  };

  const loadData = async (tenantId: number) => {
    try {
      await Promise.all([loadUnits(tenantId), loadRequests(tenantId)]);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const loadUnits = async (tenantId: number) => {
    try {
      setLoadingUnits(true);
      const response = await maintenanceApi.getAvailableUnits();

      if (response.data && Array.isArray(response.data)) {
        setAvailableUnits(response.data);
      }
    } catch (err: any) {
      console.error("Error loading units:", err);
      setError(t("maintenance.messages.error.loadUnits"));
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadRequests = async (tenantId: number) => {
    try {
      setLoadingRequests(true);
      const response = await maintenanceApi.getRequestsByTenant(tenantId);
      setRequests(response.data);
    } catch (err: any) {
      console.error("Error loading requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setNewRequest((prev) => ({
      ...prev,
      roomId: unit.id,
    }));
    setIsModalOpen(true);
  };

  const handleSubmitConfirmation = () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!tenantId) {
      setError(t("maintenance.messages.error.noTenantId"));
      setIsSubmitModalOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await maintenanceApi.createRequest({
        ...newRequest,
        tenantId: tenantId,
      });

      // Success
      setIsModalOpen(false);
      setIsSubmitModalOpen(false);

      // Show success message
      setSuccessMessage(t("maintenanceT.messages.success.requestSubmitted"));

      // Reset form
      setNewRequest({
        requestTitle: "",
        requestDescription: "",
        priority: "MEDIUM",
        tenantId: tenantId,
        roomId: selectedUnit?.id || 0,
      });
      setSelectedUnit(null);

      // Refresh requests
      await loadRequests(tenantId);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(
        err.response?.data?.message ||
          t("maintenance.messages.error.submitRequest")
      );
      setIsSubmitModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeedback = async (requestId: number) => {
    setError(null);

    // Show custom feedback modal
    const feedbackInput = document.getElementById(
      "feedback-input"
    ) as HTMLTextAreaElement;
    const feedbackModal = document.getElementById("feedback-modal");

    if (feedbackModal) {
      feedbackModal.classList.remove("hidden");
      feedbackModal.classList.add("flex");

      // Set up submit handler
      const submitFeedback = async () => {
        const feedback = feedbackInput.value.trim();
        if (!feedback) {
          setError(t("maintenance.messages.error.validation.feedback"));
          return;
        }

        try {
          await maintenanceApi.updateRequestStatus(requestId, {
            status: "COMPLETED",
            feedback: feedback,
          });

          if (tenantId) {
            await loadRequests(tenantId);
          }

          setSuccessMessage(
            t("maintenanceT.messages.success.feedbackSubmitted")
          );
          setTimeout(() => setSuccessMessage(null), 3000);

          // Close modal
          feedbackModal.classList.add("hidden");
          feedbackModal.classList.remove("flex");
          feedbackInput.value = "";
        } catch (err: any) {
          setError(
            err.response?.data?.message ||
              t("maintenanceT.messages.error.submitFeedback")
          );
        }
      };

      // Add event listener to submit button
      const submitBtn = document.getElementById("submit-feedback-btn");
      if (submitBtn) {
        const handler = () => submitFeedback();
        submitBtn.onclick = handler;
      }
    }
  };

  const validateForm = () => {
    if (!newRequest.requestTitle.trim()) {
      setError(t("maintenanceT.messages.error.validation.title"));
      return false;
    }
    if (!newRequest.requestDescription.trim()) {
      setError(t("maintenanceT.messages.error.validation.description"));
      return false;
    }
    if (!newRequest.roomId) {
      setError(t("maintenanceT.messages.error.validation.unit"));
      return false;
    }
    setError(null);
    return true;
  };

  const getStatusBadgeColor = (status: string) => {
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
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-gray-100 text-gray-800";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    // Use Burmese locale for Burmese language, English for others
    const locale = i18n.language === "mm" ? "my-MM" : "en-US";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(locale, options);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">
            {t("maintenanceT.accessDenied.title")}
          </h1>
          <p className="text-gray-600">
            {t("maintenanceT.accessDenied.message")}
          </p>
        </div>
      </div>
    );
  }

  if (loadingUnits && availableUnits.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {t("maintenanceT.messages.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("maintenanceT.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t("maintenanceT.welcome", { username, tenantId })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {selectedUnit && (
                <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {t("maintenanceT.modal.newRequest.selectedUnit", {
                    unitNumber: selectedUnit.unitNumber,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-800 hover:text-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-800 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenanceT.stats.availableUnits")}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {availableUnits.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenanceT.stats.totalRequests")}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenanceT.stats.completed")}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter((r) => r.status === "COMPLETED").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Units Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("maintenanceT.units.title")}
            </h2>
            <span className="text-sm text-gray-500">
              {t("maintenanceT.units.subtitle")}
            </span>
          </div>

          {availableUnits.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("maintenanceT.units.noUnits.title")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("maintenanceT.units.noUnits.description")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableUnits.map((unit) => (
                <div
                  key={unit.id}
                  className={`bg-white rounded-lg shadow border p-4 transition-all cursor-pointer transform hover:-translate-y-1 ${
                    selectedUnit?.id === unit.id
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                  onClick={() => handleUnitSelect(unit)}
                >
                  <div className="flex items-center mb-3">
                    <div
                      className={`flex-shrink-0 w-3 h-3 rounded-full mr-2 ${
                        selectedUnit?.id === unit.id
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <h3 className="font-semibold text-gray-900">
                      {unit.unitNumber}
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t("maintenanceT.units.unitCard.type")}
                      </span>
                      <span className="font-medium">{unit.unitType}</span>
                    </div>
                    {unit.buildingName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          {t("maintenanceT.units.unitCard.building")}
                        </span>
                        <span>{unit.buildingName}</span>
                      </div>
                    )}
                    {unit.rentalFee && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          {t("maintenanceT.units.unitCard.rent")}
                        </span>
                        <span>
                          {unit.rentalFee}{" "}
                          {i18n.language === "mm" ? "ကျပ်/လ" : "MMK/month"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button className="w-full text-red-600 hover:text-red-800 text-sm font-medium text-center">
                      {selectedUnit?.id === unit.id
                        ? t("maintenanceT.units.unitCard.selected")
                        : t("maintenanceT.units.unitCard.requestMaintenance")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("maintenanceT.requests.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {loadingRequests
                ? t("maintenanceT.requests.loading")
                : `${requests.length} ${
                    requests.length !== 1
                      ? t("maintenanceT.requests.title")
                      : t("maintenanceT.requests.title").slice(0, -1)
                  }`}
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("maintenanceT.requests.noRequests.title")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("maintenanceT.requests.noRequests.description")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-3 h-3 rounded-full mt-1 ${
                              request.status === "COMPLETED"
                                ? "bg-green-500"
                                : request.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : request.status === "CANCELLED"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                          ></div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">
                            {request.requestTitle}
                          </h4>
                          <p className="mt-1 text-gray-600">
                            {request.requestDescription}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeColor(
                                request.priority
                              )}`}
                            >
                              {t(`maintenanceT.priority.${request.priority}`)}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                request.status
                              )}`}
                            >
                              {t(`maintenanceT.status.${request.status}`)}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 font-medium rounded-full">
                              {t("maintenanceT.requests.unit")}{" "}
                              {request.roomNumber}
                            </span>
                          </div>

                          <div className="mt-3 text-sm text-gray-500">
                            <span>
                              {t("maintenanceT.requests.submitted")}{" "}
                              {formatDate(request.createdAt)}
                            </span>
                            {request.assignedToName && (
                              <span className="ml-4">
                                {t("maintenanceT.requests.assignedTo")}{" "}
                                {request.assignedToName}
                              </span>
                            )}
                          </div>

                          {request.tenantFeedback && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                              <p className="text-sm text-green-800">
                                <span className="font-medium">
                                  {t("maintenanceT.requests.yourFeedback")}
                                </span>{" "}
                                {request.tenantFeedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-4 flex flex-col space-y-2">
                      {request.status === "COMPLETED" &&
                        !request.tenantFeedback && (
                          <button
                            onClick={() => handleAddFeedback(request.id)}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-800 hover:bg-green-200 rounded-lg font-medium transition"
                          >
                            {t("maintenanceT.buttons.addFeedback")}
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {isModalOpen && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t("maintenanceT.modal.newRequest.title")}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("maintenanceT.modal.newRequest.selectedUnit", {
                      unitNumber: selectedUnit.unitNumber,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUnit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Selected Unit Info (Fixed, cannot change) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="font-medium text-blue-700">
                      {t("maintenanceT.modal.newRequest.selectedUnit", {
                        unitNumber: selectedUnit.unitNumber,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1 ml-7">
                    {t("maintenanceT.modal.newRequest.unitLocked")}
                  </p>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("maintenanceT.modal.newRequest.form.requestTitle")}
                    </label>
                    <input
                      type="text"
                      value={newRequest.requestTitle}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          requestTitle: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder={t(
                        "maintenanceT.modal.newRequest.form.titlePlaceholder"
                      )}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("maintenanceT.modal.newRequest.form.priority")}
                    </label>
                    <select
                      value={newRequest.priority}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="LOW">
                        {t("maintenanceT.priority.LOW")}
                      </option>
                      <option value="MEDIUM">
                        {t("maintenanceT.priority.MEDIUM")}
                      </option>
                      <option value="HIGH">
                        {t("maintenanceT.priority.HIGH")}
                      </option>
                      <option value="URGENT">
                        {t("maintenanceT.priority.URGENT")}
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("maintenanceT.modal.newRequest.form.description")}
                  </label>
                  <textarea
                    value={newRequest.requestDescription}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        requestDescription: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    placeholder={t(
                      "maintenanceT.modal.newRequest.form.descriptionPlaceholder"
                    )}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUnit(null);
                    setNewRequest({
                      requestTitle: "",
                      requestDescription: "",
                      priority: "MEDIUM",
                      tenantId: tenantId || 0,
                      roomId: 0,
                    });
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                >
                  {t("maintenanceT.modal.newRequest.cancel")}
                </button>
                <button
                  onClick={handleSubmitConfirmation}
                  disabled={
                    isLoading ||
                    !newRequest.requestTitle.trim() ||
                    !newRequest.requestDescription.trim()
                  }
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("maintenanceT.modal.newRequest.validating")}
                    </span>
                  ) : (
                    t("maintenanceT.modal.newRequest.submit")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.73 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("maintenanceT.modal.confirmation.title")}
                </h3>
                <div className="mt-2 px-4 py-3 bg-yellow-50 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    {t("maintenanceT.modal.confirmation.message", {
                      unitNumber: selectedUnit?.unitNumber,
                    })}
                  </p>
                </div>
                <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm font-medium text-gray-700">
                    {t("maintenanceT.modal.confirmation.details")}
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>
                      • {t("maintenanceT.modal.newRequest.form.requestTitle")}:{" "}
                      {newRequest.requestTitle}
                    </li>
                    <li>
                      • {t("maintenanceT.modal.newRequest.form.priority")}:{" "}
                      {t(`maintenance.priority.${newRequest.priority}`)}
                    </li>
                    <li>
                      • {t("maintenanceT.units.unitCard.type")}:{" "}
                      {selectedUnit?.unitNumber}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                >
                  {t("maintenanceT.modal.confirmation.cancel")}
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition"
                >
                  {isLoading
                    ? t("maintenanceT.modal.confirmation.submitting")
                    : t("maintenanceT.modal.confirmation.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal (hidden by default) */}
      <div
        id="feedback-modal"
        className="fixed inset-0 bg-black bg-opacity-50 items-center justify-center p-4 z-[70] hidden"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("maintenanceT.modal.feedback.title")}
              </h3>
              <button
                onClick={() => {
                  const modal = document.getElementById("feedback-modal");
                  if (modal) {
                    modal.classList.add("hidden");
                    modal.classList.remove("flex");
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("maintenance.modal.feedback.label")}
              </label>
              <textarea
                id="feedback-input"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={4}
                placeholder={t("maintenanceT.modal.feedback.placeholder")}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const modal = document.getElementById("feedback-modal");
                  if (modal) {
                    modal.classList.add("hidden");
                    modal.classList.remove("flex");
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t("maintenanceT.modal.feedback.cancel")}
              </button>
              <button
                id="submit-feedback-btn"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {t("maintenanceT.modal.feedback.submit")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TenantMaintenancePage;
