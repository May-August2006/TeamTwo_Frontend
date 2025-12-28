import React, { useState, useEffect } from "react";
import { Building2, Calendar, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Branch } from "../types";
import { branchApi } from "../api/BranchAPI.tsx";
import BranchForm from "../components/BranchForm";
import { useNotification } from "../context/NotificationContext";
import { useTranslation } from "react-i18next";

const BranchManagement: React.FC = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useNotification();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadBranches();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchApi.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error("Error loading branches:", error);
      showError(t('branchManagement.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBranch(null);
    setShowForm(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowForm(true);
  };

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;

    try {
      setDeleting(true);
      const response = await branchApi.delete(branchToDelete.id);
      if (response.data.success) {
        showSuccess(t('branchManagement.success.deleted'));
        loadBranches();
      } else {
        showError(response.data.message || t('branchManagement.errors.deleteFailed'));
      }
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError(t('branchManagement.errors.deleteFailed'));
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setBranchToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setBranchToDelete(null);
  };

  const handleFormSubmit = (successMessage: string) => {
    showSuccess(successMessage);
    loadBranches();
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBranches.slice(indexOfFirstItem, indexOfLastItem);

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

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

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">{t('branchManagement.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-stone-50">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900">{t('branchManagement.title')}</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">{t('branchManagement.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#1E40AF] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg hover:bg-[#1E3A8A] transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#1E40AF]/30 transform active:scale-95 text-sm sm:text-base"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          {t('branchManagement.addNewBranch')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('branchManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={100}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-stone-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] bg-white shadow-sm text-sm sm:text-base"
          />
          {searchTerm.length > 0 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-stone-400">
              {searchTerm.length}/100
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="p-4 sm:p-6">
          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-stone-600">
              {t('common.showingXofY', 'Showing {{count}} of {{total}} branches', { 
                count: Math.min(currentItems.length, itemsPerPage), 
                total: filteredBranches.length 
              })}
              {filteredBranches.length > itemsPerPage && (
                <span className="ml-2">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-blue-800 hover:text-blue-900 font-medium"
              >
                {t('common.clearSearch', 'Clear search')}
              </button>
            )}
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {currentItems.map((branch) => (
              <div
                key={branch.id}
                className="bg-stone-50 rounded-lg sm:rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
    <div className="flex-shrink-0 p-2 bg-[#1E40AF]/10 rounded-lg">
      <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#1E40AF]" />
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="font-bold text-stone-900 text-base sm:text-lg truncate">
        {branch.branchName}
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 truncate">{branch.contactEmail}</p>
    </div>
  </div>
  <div className="flex-shrink-0 flex space-x-1 ml-2">
    <button
      onClick={() => handleEdit(branch)}
      className="p-1.5 sm:p-2 text-stone-400 hover:text-[#1E40AF] hover:bg-[#1E40AF]/10 rounded-lg transition-colors duration-150"
      title={t('branchManagement.editBranch')}
    >
      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
    <button
      onClick={() => handleDeleteClick(branch)}
      className="p-1.5 sm:p-2 text-stone-400 hover:text-[#1E40AF] hover:bg-[#1E40AF]/10 rounded-lg transition-colors duration-150"
      title={t('branchManagement.deleteBranch')}
    >
      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      {t('branchManagement.address')}:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900 text-right max-w-[60%] truncate">
                      {branch.address || t('branchManagement.notSpecified')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      {t('branchManagement.phone')}:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900 truncate">
                      {branch.contactPhone || t('branchManagement.notSpecified')}
                    </span>
                  </div>
                  {branch.accountantName && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        {t('branchManagement.accountant')}:
                      </span>
                      <span className="text-xs sm:text-sm text-stone-900 truncate">
                        {branch.accountantName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-xs text-stone-500 pt-2 sm:pt-3 border-t border-stone-200">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {t('branchManagement.created')}: {new Date(branch.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-stone-600">
                {t('common.pageInfo', 'Page {{current}} of {{total}}', {
                  current: currentPage,
                  total: totalPages
                })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('common.firstPage', 'First page')}
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('common.previousPage', 'Previous page')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150 ${
                          currentPage === pageNum
                            ? 'bg-blue-800 text-white'
                            : 'text-stone-600 hover:bg-blue-50 hover:text-blue-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('common.nextPage', 'Next page')}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('common.lastPage', 'Last page')}
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredBranches.length === 0 && (
            <div className="text-center py-8 sm:py-16 text-stone-500 bg-stone-50 rounded-xl">
              <div className="text-4xl sm:text-5xl mb-3">🏢</div>
              <div className="text-lg sm:text-xl font-semibold text-stone-700 mb-2">
                {searchTerm ? t('branchManagement.noBranchesFound') : t('branchManagement.noBranchesYet')}
              </div>
              <p className="text-xs sm:text-sm px-4">
                {searchTerm
                  ? t('branchManagement.tryAdjustingSearch')
                  : t('branchManagement.startByAdding')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Branch Form Modal */}
      {showForm && (
        <BranchForm
          branch={editingBranch}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && branchToDelete && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">{t('branchManagement.confirmDelete')}</h2>
              <button
                onClick={handleDeleteCancel}
                className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
                disabled={deleting}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-[#1E40AF]/5 rounded-lg">
                <div className="p-1.5 sm:p-2 bg-[#1E40AF]/10 rounded-lg">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E40AF]" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-stone-900 truncate">{branchToDelete.branchName}</h3>
                  <p className="text-xs sm:text-sm text-stone-500 truncate">{branchToDelete.contactEmail}</p>
                </div>
              </div>
              
              <p className="text-stone-700 text-sm sm:text-base">
                {t('branchManagement.deleteConfirmation')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-3 sm:pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 sm:px-6 py-2 sm:py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-xs sm:text-sm shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-stone-300"
                disabled={deleting}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#1E40AF] text-white rounded-lg shadow-lg hover:bg-[#1E3A8A] transition duration-150 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#1E40AF]/30 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('branchManagement.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {t('branchManagement.deleteBranch')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;