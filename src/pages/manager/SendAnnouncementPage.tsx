/** @format */

import { useState, useEffect, useMemo } from "react";
import { announcementApi } from "../../api/announcementApi";
import { buildingApi } from "../../api/BuildingAPI";
import type { Announcement, Building, AnnouncementRequest } from "../../types";

// Toast component
const Toast = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-[9999]">
      {message}
    </div>
  );
};

export default function SendAnnouncementPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [assignedBuilding, setAssignedBuilding] = useState<Building | null>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const { paginatedAnnouncements, totalPages } = useMemo(() => {
    const total = allAnnouncements.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAnnouncements = allAnnouncements.slice(startIndex, endIndex);
    
    return { paginatedAnnouncements, totalPages };
  }, [allAnnouncements, currentPage, itemsPerPage]);

  // Load manager's assigned building and announcements
  const loadData = async () => {
    try {
      setLoadingBuilding(true);
      
      // 1. Get manager's assigned building
      const buildingRes = await buildingApi.getMyAssignedBuilding();
      
      if (buildingRes.data && (buildingRes.data as any).success) {
        const apiResponse = buildingRes.data as any;
        if (apiResponse.success && apiResponse.data) {
          setAssignedBuilding(apiResponse.data);
        } else {
          setToast(apiResponse.message || "No building assigned to you. Please contact administrator.");
          setAssignedBuilding(null);
        }
      } else if (buildingRes.data) {
        const buildingData = buildingRes.data as Building;
        if (buildingData && buildingData.id) {
          setAssignedBuilding(buildingData);
        } else {
          setToast("No building assigned to you. Please contact administrator.");
          setAssignedBuilding(null);
        }
      }
      
      // 2. Load announcements for this building
      if (assignedBuilding) {
        const announcementsRes = await announcementApi.getMyBuildingAnnouncements();
        
        if (announcementsRes.data.success) {
          setAllAnnouncements(announcementsRes.data.data || []);
          setCurrentPage(1);
        }
      }
    } catch (err: any) {
      console.error("Failed to load data", err);
      setToast(err.response?.data?.message || "Failed to load building information");
      setAssignedBuilding(null);
    } finally {
      setLoadingBuilding(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Send announcement to manager's assigned building
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setToast("Please provide title and message");
      return;
    }

    if (!assignedBuilding) {
      setToast("No building assigned to send announcements");
      return;
    }

    try {
      setLoading(true);
      
      const response = await announcementApi.sendToMyBuilding({
        title: title.trim(),
        message: message.trim(),
        buildingId: assignedBuilding.id
      });
      
      if (response.data.success) {
        setTitle("");
        setMessage("");
        setPreviewOpen(false);
        setToast(response.data.message || `Announcement sent to ${assignedBuilding.buildingName}!`);
        loadData();
      } else {
        setToast(response.data.message || "Failed to send announcement");
      }
    } catch (err: any) {
      console.error(err);
      setToast(err.response?.data?.message || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (assignedBuilding) {
        try {
          const announcementsRes = await announcementApi.getMyBuildingAnnouncements();
          if (announcementsRes.data.success) {
            setAllAnnouncements(announcementsRes.data.data || []);
            setCurrentPage(1);
          }
        } catch (err) {
          console.error("Failed to load announcements", err);
        }
      }
    };

    loadAnnouncements();
  }, [assignedBuilding]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loadingBuilding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Loading your building information...</p>
        </div>
      </div>
    );
  }

  if (!assignedBuilding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">No Building Assigned</h2>
          <p className="text-stone-600 mb-6">
            You need to be assigned to a building before you can send announcements.
            Please contact the administrator.
          </p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-150 font-semibold"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-white rounded-xl border border-stone-200 shadow-sm space-y-8 min-h-screen bg-stone-50">
      {/* ==================== Header with Building Info ==================== */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Send Announcement</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-stone-600">
              You are sending announcements to your assigned building:
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-3 py-1 bg-red-600 text-white text-sm rounded-full font-medium">
                Building Manager
              </div>
              <span className="text-stone-600">•</span>
              <span className="font-semibold text-red-700">{assignedBuilding.buildingName}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm min-w-[200px]">
            <div className="text-sm text-stone-600">Your Building</div>
            <div className="font-bold text-lg text-stone-900 truncate">{assignedBuilding.buildingName}</div>
            <div className="text-sm text-stone-500 truncate">{assignedBuilding.branchName || "Main Branch"}</div>
          </div>
        </div>
      </div>

      {/* ==================== Composer ==================== */}
      <div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-stone-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
            disabled={loading}
          />

          <textarea
            rows={6}
            placeholder="Announcement message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-stone-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
            disabled={loading}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              disabled={loading || !title.trim() || !message.trim()}
              className="px-4 py-2 bg-stone-500 hover:bg-stone-600 text-white rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview
            </button>

            <button
              onClick={handleSend}
              disabled={loading || !title.trim() || !message.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Sending..." : `Send to ${assignedBuilding.buildingName}`}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== Preview Modal ==================== */}
      {previewOpen && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Preview Announcement</h2>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">
                <strong>Target Building:</strong> {assignedBuilding.buildingName}
              </p>
              <p className="text-xs text-red-600 mt-1">
                This announcement will be sent only to tenants in your assigned building
              </p>
            </div>
            
            <div>
              <p className="text-sm text-stone-600">Title</p>
              <p className="font-medium text-stone-900">{title}</p>
            </div>
            
            <div>
              <p className="text-sm text-stone-600">Message</p>
              <div className="mt-1 p-3 bg-stone-50 rounded border border-stone-200 whitespace-pre-wrap">
                {message}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-stone-500 hover:bg-stone-600 text-white rounded-lg transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-150 font-semibold"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Announcement List ==================== */}
      <div>
        {/* Header with Pagination in Top Right Corner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-stone-900">
            Announcements for {assignedBuilding.buildingName}
          </h2>
          
          {/* Pagination Controls - Moved to Top Right Corner */}
          {allAnnouncements.length > 0 && (
            <div className="flex items-center justify-end gap-2">
              {/* Show X of Y items */}
              <span className="text-sm text-stone-600 hidden sm:block">
                {Math.min((currentPage - 1) * itemsPerPage + 1, allAnnouncements.length)}-
                {Math.min(currentPage * itemsPerPage, allAnnouncements.length)} of {allAnnouncements.length}
              </span>
              
              {/* Items per page selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-stone-300 rounded-lg px-2 py-1 text-sm bg-white"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              {/* Page navigation buttons */}
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-stone-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50"
                title="Previous page"
              >
                &lt;
              </button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageClick(Number(page))}
                      className={`px-3 py-1 rounded-lg min-w-[2rem] text-center ${
                        currentPage === page
                          ? 'bg-red-600 text-white'
                          : 'border border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-stone-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50"
                title="Next page"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* Announcements List */}
        <div className="divide-y border border-stone-200 rounded-lg bg-white">
          {paginatedAnnouncements.length === 0 ? (
            <div className="p-8 text-stone-500 text-center bg-stone-50 rounded-lg">
              <p>No announcements sent yet.</p>
              <p className="text-sm text-stone-400 mt-1">Create your first announcement for this building</p>
            </div>
          ) : (
            <>
              {paginatedAnnouncements.map((a) => (
                <div key={a.id} className="p-6 hover:bg-stone-50 transition duration-150">
                  <h3 className="font-medium text-stone-900">{a.title}</h3>
                  <p className="text-stone-700 mt-2 whitespace-pre-wrap">{a.message}</p>
                  <div className="flex justify-between text-sm text-stone-500 mt-3">
                    <span>Posted: {new Date(a.createdAt).toLocaleString()}</span>
                    <span className="text-red-600 font-medium">✓ Sent to building tenants</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Mobile responsive: Show items count at bottom on small screens */}
        {allAnnouncements.length > 0 && (
          <div className="sm:hidden text-center mt-4 text-sm text-stone-600">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, allAnnouncements.length)}-
            {Math.min(currentPage * itemsPerPage, allAnnouncements.length)} of {allAnnouncements.length} announcements
          </div>
        )}
      </div>

      {/* ==================== Info Box ==================== */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">ℹ️</div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">About Building Announcements</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Announcements are sent via email to all tenants with active contracts</li>
              <li>• Tenants will also see announcements in their portal</li>
              <li>• You can only send announcements to your assigned building</li>
              <li>• Announcements are archived and visible in this list</li>
              <li>• For urgent matters, consider contacting tenants directly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ==================== Toast ==================== */}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}