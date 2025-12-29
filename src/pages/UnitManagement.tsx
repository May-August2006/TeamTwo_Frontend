// pages/UnitManagement.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../components/common/ui/Modal';
import { Layers, Building, Video } from 'lucide-react';
import type { HallType, RoomType, SpaceType, Unit, UnitSearchParams } from '../types/unit';
import { unitApi, hallTypeApi, roomTypeApi, spaceTypeApi } from '../api/UnitAPI';
import { UnitEditForm } from '../components/units/UnitEditForm';
import { UnitAddForm } from '../components/units/UnitAddForm';
import { Button } from '../components/common/ui/Button';
import { UnitSearch } from '../components/units/UnitSearch';
import { UnitList } from '../components/units/UnitList';
import { SpaceTypeForm } from '../components/units/SpaceTypeForm';
import { HallTypeForm } from '../components/units/HallTypeForm';
import { RoomTypeForm } from '../components/units/RoomTypeForm';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

const UnitManagement: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  
  // Data states
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [hallTypes, setHallTypes] = useState<HallType[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'units' | 'roomTypes' | 'spaceTypes' | 'hallTypes'>('units');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
  const [showSpaceTypeForm, setShowSpaceTypeForm] = useState(false);
  const [showHallTypeForm, setShowHallTypeForm] = useState(false);
  
  // Editing states
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [editingSpaceType, setEditingSpaceType] = useState<SpaceType | null>(null);
  const [editingHallType, setEditingHallType] = useState<HallType | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
  } | null>(null);

  // Pagination state - ADDED
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [displayUnits, setDisplayUnits] = useState<Unit[]>([]);

  // ========== DATA LOADING ==========
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    updateDisplayUnits();
  }, [filteredUnits, currentPage]);

  const updateDisplayUnits = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const pageUnits = filteredUnits.slice(startIndex, endIndex);
    setDisplayUnits(pageUnits);
    setTotalPages(Math.ceil(filteredUnits.length / itemsPerPage));
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      
      const [unitsRes, roomTypesRes, spaceTypesRes, hallTypesRes] = await Promise.all([
        unitApi.getAll(),
        roomTypeApi.getAll(),
        spaceTypeApi.getAll(),
        hallTypeApi.getAll()
      ]);
      
      setUnits(unitsRes.data || []);
      setFilteredUnits(unitsRes.data || []);
      setRoomTypes(roomTypesRes.data || []);
      setSpaceTypes(spaceTypesRes.data || []);
      setHallTypes(hallTypesRes.data || []);
      
    } catch (error: any) {
      console.error("Error loading data:", error);
      const errorMessage = error.response?.data?.message || t('error.loadDataFailed', 'Failed to load data');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ========== PAGINATION FUNCTIONS - ADDED ==========
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

  // ========== CONFIRMATION DIALOG ==========
  const showConfirmDialog = (
    title: string, 
    message: string, 
    onConfirm: () => Promise<void>
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmDialog(null)
    });
  };

  // ========== UNIT OPERATIONS ==========
  const handleCreateUnit = async (formData: FormData) => {
    try {
      const response = await unitApi.create(formData);
      setShowUnitForm(false);
      await loadAllData();
      showSuccess(t('notification.unitCreated', 'Unit {{unitNumber}} created successfully!', { unitNumber: response.data.unitNumber }));
      return true;
    } catch (error: any) {
      console.error("Error creating unit:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || t('error.createUnitFailed', 'Failed to create unit');
      showError(errorMessage);
      return false;
    }
  };

  const handleUpdateUnit = async (formData: FormData) => {
    if (!editingUnit) return false;
    
    try {
      const response = await unitApi.update(editingUnit.id, formData);
      setShowUnitForm(false);
      setEditingUnit(null);
      await loadAllData();
      showSuccess(t('notification.unitUpdated', 'Unit {{unitNumber}} updated successfully!', { unitNumber: response.data.unitNumber }));
      return true;
    } catch (error: any) {
      console.error("Error updating unit:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || t('error.updateUnitFailed', 'Failed to update unit');
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteUnit = async (id: number, unitNumber: string) => {
    showConfirmDialog(
      t('confirmation.deleteUnitTitle', 'Delete Unit'),
      t('confirmation.deleteUnit', 'Are you sure you want to delete unit {{unitNumber}}? This action cannot be undone.', { unitNumber }),
      async () => {
        try {
          await unitApi.delete(id);
          await loadAllData();
          showSuccess(t('notification.unitDeleted', 'Unit {{unitNumber}} deleted successfully!', { unitNumber }));
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting unit:", error);
          const errorMessage = error.response?.data?.message || t('error.deleteUnitFailed', 'Failed to delete unit');
          showError(errorMessage);
          setConfirmDialog(null);
        }
      }
    );
  };

  // ========== ROOM TYPE OPERATIONS ==========
  const handleCreateRoomType = async (roomTypeData: any) => {
    try {
      await roomTypeApi.create(roomTypeData);
      setShowRoomTypeForm(false);
      await loadAllData();
      showSuccess(t('notification.roomTypeCreated', 'Room type created successfully!'));
      return true;
    } catch (error: any) {
      console.error("Error creating room type:", error);
      const errorMessage = error.response?.data?.message || t('error.createRoomTypeFailed', 'Failed to create room type');
      showError(errorMessage);
      return false;
    }
  };

  const handleUpdateRoomType = async (roomTypeData: any) => {
    if (!editingRoomType) return false;
    
    try {
      await roomTypeApi.update(editingRoomType.id, roomTypeData);
      setShowRoomTypeForm(false);
      setEditingRoomType(null);
      await loadAllData();
      showSuccess(t('notification.roomTypeUpdated', 'Room type updated successfully!'));
      return true;
    } catch (error: any) {
      console.error("Error updating room type:", error);
      const errorMessage = error.response?.data?.message || t('error.updateRoomTypeFailed', 'Failed to update room type');
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteRoomType = async (id: number, typeName: string) => {
    showConfirmDialog(
      t('confirmation.deleteRoomTypeTitle', 'Delete Room Type'),
      t('confirmation.deleteRoomType', 'Are you sure you want to delete room type "{{typeName}}"? This action cannot be undone.', { typeName }),
      async () => {
        try {
          await roomTypeApi.delete(id);
          await loadAllData();
          showSuccess(t('notification.roomTypeDeleted', 'Room type "{{typeName}}" deleted successfully!', { typeName }));
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting room type:", error);
          const errorMessage = error.response?.data?.message || t('error.deleteRoomTypeFailed', 'Failed to delete room type');
          showError(errorMessage);
          setConfirmDialog(null);
        }
      }
    );
  };

  // ========== SPACE TYPE OPERATIONS ==========
  const handleCreateSpaceType = async (spaceTypeData: any) => {
    try {
      await spaceTypeApi.create(spaceTypeData);
      setShowSpaceTypeForm(false);
      setEditingSpaceType(null);
      await loadAllData();
      showSuccess(t('notification.spaceTypeCreated', 'Space type created successfully!'));
      return true;
    } catch (error: any) {
      console.error("Error creating space type:", error);
      const errorMessage = error.response?.data?.message || t('error.createSpaceTypeFailed', 'Failed to create space type');
      showError(errorMessage);
      return false;
    }
  };

  const handleUpdateSpaceType = async (spaceTypeData: any) => {
    if (!editingSpaceType) return false;
    
    try {
      await spaceTypeApi.update(editingSpaceType.id, spaceTypeData);
      setShowSpaceTypeForm(false);
      setEditingSpaceType(null);
      await loadAllData();
      showSuccess(t('notification.spaceTypeUpdated', 'Space type updated successfully!'));
      return true;
    } catch (error: any) {
      console.error("Error updating space type:", error);
      const errorMessage = error.response?.data?.message || t('error.updateSpaceTypeFailed', 'Failed to update space type');
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteSpaceType = async (id: number, name: string) => {
    showConfirmDialog(
      t('confirmation.deleteSpaceTypeTitle', 'Delete Space Type'),
      t('confirmation.deleteSpaceType', 'Are you sure you want to delete space type "{{name}}"? This action cannot be undone.', { name }),
      async () => {
        try {
          await spaceTypeApi.delete(id);
          await loadAllData();
          showSuccess(t('notification.spaceTypeDeleted', 'Space type "{{name}}" deleted successfully!', { name }));
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting space type:", error);
          const errorMessage = error.response?.data?.message || t('error.deleteSpaceTypeFailed', 'Failed to delete space type');
          showError(errorMessage);
          setConfirmDialog(null);
        }
      }
    );
  };

  // ========== HALL TYPE OPERATIONS ==========
  const handleCreateHallType = async (hallTypeData: any) => {
    try {
      await hallTypeApi.create(hallTypeData);
      setShowHallTypeForm(false);
      setEditingHallType(null);
      await loadAllData();
      showSuccess(t('notification.hallTypeCreated', 'Hall type created successfully!'));
      return true;
    } catch (error: any) {
      console.error("Error creating hall type:", error);
      const errorMessage = error.response?.data?.message || t('error.createHallTypeFailed', 'Failed to create hall type');
      showError(errorMessage);
      return false;
    }
  };

  const handleUpdateHallType = async (hallTypeData: any) => {
    if (!editingHallType) return false;
    
    try {
      await hallTypeApi.update(editingHallType.id, hallTypeData);
      setShowHallTypeForm(false);
      setEditingHallType(null);
      await loadAllData();
      showSuccess(t('notification.hallTypeUpdated', 'Hall type updated successfully!'));
      return true;
    } catch (error: any) {
      console.error("Error updating hall type:", error);
      const errorMessage = error.response?.data?.message || t('error.updateHallTypeFailed', 'Failed to update hall type');
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteHallType = async (id: number, name: string) => {
    showConfirmDialog(
      t('confirmation.deleteHallTypeTitle', 'Delete Hall Type'),
      t('confirmation.deleteHallType', 'Are you sure you want to delete hall type "{{name}}"? This action cannot be undone.', { name }),
      async () => {
        try {
          await hallTypeApi.delete(id);
          await loadAllData();
          showSuccess(t('notification.hallTypeDeleted', 'Hall type "{{name}}" deleted successfully!', { name }));
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting hall type:", error);
          const errorMessage = error.response?.data?.message || t('error.deleteHallTypeFailed', 'Failed to delete hall type');
          showError(errorMessage);
          setConfirmDialog(null);
        }
      }
    );
  };

  // ========== SEARCH HANDLING ==========
  const handleSearch = async (searchParams: UnitSearchParams) => {
    try {
      setLoading(true);
      
      // Debug logging
      console.log('🔍 Searching with params:', searchParams);
      console.log('🔍 Unit number:', searchParams.unitNumber);
      
      const response = await unitApi.search(searchParams);
      setFilteredUnits(response.data || []);
      setCurrentPage(1); // Reset to first page when searching
      
      // REMOVED: Notification for search results
      // Only show error if something went wrong
    } catch (error: any) {
      console.error("Error searching units:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || t('error.searchUnitsFailed', 'Failed to search units');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function for simple unit number search
  const handleUnitNumberSearch = async (unitNumber: string) => {
    if (!unitNumber.trim()) {
      resetSearch();
      return;
    }

    try {
      setLoading(true);
      const response = await unitApi.search({ unitNumber });
      setFilteredUnits(response.data || []);
      setCurrentPage(1);
      
      // Optional: You could add a subtle indicator instead of notification
      // Or leave it silent as requested
    } catch (error: any) {
      console.error("Error searching by unit number:", error);
      const errorMessage = error.response?.data?.message || t('error.searchUnitsFailed', 'Failed to search units');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setFilteredUnits(units);
    setCurrentPage(1); // Reset to first page
    setError(null);
    // REMOVED: showSuccess('Search reset to show all units');
  };

  // ========== UI HANDLERS ==========
  const openCreateUnitModal = () => {
    setEditingUnit(null);
    setShowUnitForm(true);
  };

  const openEditUnitModal = (unit: Unit) => {
    setEditingUnit(unit);
    setShowUnitForm(true);
  };

  const openCreateRoomTypeModal = () => {
    setEditingRoomType(null);
    setShowRoomTypeForm(true);
  };

  const openEditRoomTypeModal = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setShowRoomTypeForm(true);
  };

  const openCreateSpaceTypeModal = () => {
    setEditingSpaceType(null);
    setShowSpaceTypeForm(true);
  };

  const openEditSpaceTypeModal = (spaceType: SpaceType) => {
    setEditingSpaceType(spaceType);
    setShowSpaceTypeForm(true);
  };

  const openCreateHallTypeModal = () => {
    setEditingHallType(null);
    setShowHallTypeForm(true);
  };

  const openEditHallTypeModal = (hallType: HallType) => {
    setEditingHallType(hallType);
    setShowHallTypeForm(true);
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case 'units': return t('unitManagement.addUnit', 'Add Unit');
      case 'roomTypes': return t('unitManagement.addRoomType', 'Add Room Type');
      case 'spaceTypes': return t('unitManagement.addSpaceType', 'Add Space Type');
      case 'hallTypes': return t('unitManagement.addHallType', 'Add Hall Type');
      default: return t('common.add', 'Add');
    }
  };

  const handleAddClick = () => {
    switch (activeTab) {
      case 'units': openCreateUnitModal(); break;
      case 'roomTypes': openCreateRoomTypeModal(); break;
      case 'spaceTypes': openCreateSpaceTypeModal(); break;
      case 'hallTypes': openCreateHallTypeModal(); break;
    }
  };

  const closeAllModals = () => {
    setShowUnitForm(false);
    setShowRoomTypeForm(false);
    setShowSpaceTypeForm(false);
    setShowHallTypeForm(false);
    setEditingUnit(null);
    setEditingRoomType(null);
    setEditingSpaceType(null);
    setEditingHallType(null);
    setError(null);
  };

  // ========== RENDER FUNCTIONS ==========
  const renderUnitForm = () => {
    if (editingUnit) {
      return (
        <UnitEditForm
          unit={editingUnit}
          onSubmit={handleUpdateUnit}
          onCancel={closeAllModals}
          isLoading={false}
        />
      );
    } else {
      return (
        <UnitAddForm
          onSubmit={handleCreateUnit}
          onCancel={closeAllModals}
          isLoading={false}
        />
      );
    }
  };

  const renderDeleteButtons = (type: 'unit' | 'roomType' | 'spaceType' | 'hallType', item: any) => {
    const deleteHandlers = {
      unit: () => confirmDeleteUnit(item.id, item.unitNumber),
      roomType: () => confirmDeleteRoomType(item.id, item.typeName),
      spaceType: () => confirmDeleteSpaceType(item.id, item.name),
      hallType: () => confirmDeleteHallType(item.id, item.name)
    };

    return (
      <button
        onClick={deleteHandlers[type]}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title={t('common.delete', 'Delete')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    );
  };

  // ========== RENDER PAGINATION - ADDED ==========
  const renderPagination = () => {
    if (filteredUnits.length <= itemsPerPage) return null;

    return (
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Results summary */}
          <div className="text-sm text-gray-600">
            {t('common.showing', 'Showing')}{" "}
            <span className="font-medium text-gray-900">
              {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUnits.length)}
            </span>
            {" "}
            {/* {t('common.of', 'of')}{" "}
            <span className="font-medium text-gray-900">{filteredUnits.length}</span>{" "}
            {t('unitManagement.units', 'units')} */}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center space-x-2">
            {/* First page button */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common.firstPage', 'First Page')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline ml-1">{t('common.first', 'First')}</span>
          </button>
            {/* Previous button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{t('common.previous', 'Previous')}</span>
              <span className="sm:hidden">{t('common.prev', 'Prev')}</span>
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
                        ? "bg-gradient-to-r from-blue-800 to-blue-900 text-white"
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
              <span className="hidden sm:inline">{t('common.next', 'Next')}</span>
              <span className="sm:hidden">{t('common.next', 'Next')}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Last page button */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common.lastPage', 'Last Page')}
          >
            <span className="hidden sm:inline mr-1">{t('common.last', 'Last')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && units.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-medium text-gray-700">{t('common.loadingUnitManagement', 'Loading Unit Management...')}</div>
        </div>
      </div>
    );
  }

  return (
 <div className="min-h-screen bg-stone-50 p-4 md:p-6 lg:p-8">      
      {/* Header and Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {t('unitManagement.title', 'Unit Management')}
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            {t('unitManagement.subtitle', 'Manage all units and their types in your properties.')}
          </p>
        </div>

        {/* Add Button */}
        <Button
          onClick={handleAddClick}
          className="whitespace-nowrap bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-6 py-3 rounded-xl shadow-lg transition duration-150 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          {getAddButtonText()}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 flex-1">
        <nav className="-mb-px flex space-x-2 md:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('units')}
            className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'units'
                ? 'border-blue-800 text-blue-800 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              {t('unitManagement.units', 'Units')} ({filteredUnits.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('roomTypes')}
            className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'roomTypes'
                ? 'border-blue-800 text-blue-800 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              {t('unitManagement.roomTypes', 'Room Types')} ({roomTypes.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('spaceTypes')}
            className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'spaceTypes'
                ? 'border-blue-800 text-blue-800 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
              </svg>
              {t('unitManagement.spaceTypes', 'Space Types')} ({spaceTypes.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('hallTypes')}
            className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'hallTypes'
                ? 'border-blue-800 text-blue-800 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <Video className="w-4 h-4 mr-2" />
              {t('unitManagement.hallTypes', 'Hall Types')} ({hallTypes.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Search Section - Only for Units tab */}
      {activeTab === 'units' && (
        <div className="mb-6">
          <UnitSearch
            onSearch={handleSearch}
            onReset={resetSearch}
            isLoading={loading}
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-gray-200">
        
        {/* Units Tab Content */}
        {activeTab === 'units' && (
          <>
            <UnitList
              units={displayUnits}
              onEdit={openEditUnitModal}
              onDelete={(id, unitNumber) => confirmDeleteUnit(id, unitNumber)}
              isLoading={loading}
              viewMode="grid"
            />
            {renderPagination()}
          </>
        )}

        {/* Room Types Tab Content */}
        {activeTab === 'roomTypes' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map(roomType => (
                <div key={roomType.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{roomType.typeName}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditRoomTypeModal(roomType)}
                        className="p-2 text-gray-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('common.edit', 'Edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {renderDeleteButtons('roomType', roomType)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{roomType.description || t('common.noDescription', 'No description provided')}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{t('common.created', 'Created')}: {new Date(roomType.createdAt).toLocaleDateString()}</span>
                    {/* <Button
                      onClick={() => openEditRoomTypeModal(roomType)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Edit
                    </Button> */}
                  </div>
                </div>
              ))}
            </div>

            {roomTypes.length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-3">🏢</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">
                  {t('unitManagement.noRoomTypes', 'No Room Types Found')}
                </div>
                <p className="text-sm mb-4">{t('common.createFirst', 'Create your first room type to get started.')}</p>
                <Button
                  onClick={openCreateRoomTypeModal}
                  className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  {t('unitManagement.addRoomType', 'Add Room Type')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Space Types Tab Content */}
        {activeTab === 'spaceTypes' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaceTypes.map(spaceType => (
                <div key={spaceType.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{spaceType.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        spaceType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {spaceType.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditSpaceTypeModal(spaceType)}
                        className="p-2 text-gray-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('common.edit', 'Edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {renderDeleteButtons('spaceType', spaceType)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{spaceType.description || t('common.noDescription', 'No description provided')}</p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('common.basePrice', 'Base Price')}:</span>
                      <span className="font-medium">{spaceType.basePricePerSqm || 0} MMK/sqm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('common.spaceRange', 'Space Range')}:</span>
                      <span className="font-medium">{spaceType.minSpace || 0} - {spaceType.maxSpace || 0} sqm</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{t('common.created', 'Created')}: {new Date(spaceType.createdAt).toLocaleDateString()}</span>
                    {/* <Button
                      onClick={() => openEditSpaceTypeModal(spaceType)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Edit
                    </Button> */}
                  </div>
                </div>
              ))}
            </div>

            {spaceTypes.length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-3">📐</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">
                  {t('unitManagement.noSpaceTypes', 'No Space Types Found')}
                </div>
                <p className="text-sm mb-4">{t('common.createFirst', 'Create your first space type to get started.')}</p>
                <Button
                  onClick={openCreateSpaceTypeModal}
                  className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  {t('unitManagement.addSpaceType', 'Add Space Type')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hall Types Tab Content */}
        {activeTab === 'hallTypes' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hallTypes.map(hallType => (
                <div key={hallType.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{hallType.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        hallType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hallType.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditHallTypeModal(hallType)}
                        className="p-2 text-gray-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('common.edit', 'Edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {renderDeleteButtons('hallType', hallType)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hallType.description || t('common.noDescription', 'No description provided')}</p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('common.basePrice', 'Base Price')}:</span>
                      <span className="font-medium">{hallType.basePrice || 0} MMK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('common.capacity', 'Capacity')}:</span>
                      <span className="font-medium">{hallType.capacity || 0} {t('common.people', 'people')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{t('common.created', 'Created')}: {new Date(hallType.createdAt).toLocaleDateString()}</span>
                    {/* <Button
                      onClick={() => openEditHallTypeModal(hallType)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Edit
                    </Button> */}
                  </div>
                </div>
              ))}
            </div>

            {hallTypes.length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-3">🎭</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">
                  {t('unitManagement.noHallTypes', 'No Hall Types Found')}
                </div>
                <p className="text-sm mb-4">{t('common.createFirst', 'Create your first hall type to get started.')}</p>
                <Button
                  onClick={openCreateHallTypeModal}
                  className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  {t('unitManagement.addHallType', 'Add Hall Type')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Unit Modal */}
      <Modal
        isOpen={showUnitForm}
        onClose={closeAllModals}
        title={editingUnit ? t('modal.editUnit', 'Edit Unit') : t('modal.createUnit', 'Create New Unit')}
        size="lg"
      >
        {renderUnitForm()}
      </Modal>

      {/* Create/Edit Room Type Modal */}
      <Modal
        isOpen={showRoomTypeForm}
        onClose={closeAllModals}
        title={editingRoomType ? t('modal.editRoomType', 'Edit Room Type') : t('modal.createRoomType', 'Create New Room Type')}
        size="md"
      >
        <RoomTypeForm
          roomType={editingRoomType}
          onSubmit={editingRoomType ? handleUpdateRoomType : handleCreateRoomType}
          onCancel={closeAllModals}
          isLoading={false}
        />
      </Modal>

      {/* Create/Edit Space Type Modal */}
      <Modal
        isOpen={showSpaceTypeForm}
        onClose={closeAllModals}
        title={editingSpaceType ? t('modal.editSpaceType', 'Edit Space Type') : t('modal.createSpaceType', 'Create New Space Type')}
        size="md"
      >
        <SpaceTypeForm
          spaceType={editingSpaceType}
          onSubmit={editingSpaceType ? handleUpdateSpaceType : handleCreateSpaceType}
          onCancel={closeAllModals}
          isLoading={false}
        />
      </Modal>

      {/* Create/Edit Hall Type Modal */}
      <Modal
        isOpen={showHallTypeForm}
        onClose={closeAllModals}
        title={editingHallType ? t('modal.editHallType', 'Edit Hall Type') : t('modal.createHallType', 'Create New Hall Type')}
        size="md"
      >
        <HallTypeForm
          hallType={editingHallType}
          onSubmit={editingHallType ? handleUpdateHallType : handleCreateHallType}
          onCancel={closeAllModals}
          isLoading={false}
        />
      </Modal>

      {/* Custom Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={confirmDialog.onCancel}
                  variant="secondary"
                  className="px-4 py-2"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  onClick={confirmDialog.onConfirm}
                  variant="danger"
                  className="px-4 py-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
                >
                  {t('common.delete', 'Delete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;