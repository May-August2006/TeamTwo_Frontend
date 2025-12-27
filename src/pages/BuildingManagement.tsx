import React, { useState, useEffect, useCallback } from "react";
import { Building, Search, Plus, Edit, Trash2, Zap, Battery, Filter, X, ChevronDown } from "lucide-react";
import type { Building as BuildingType } from "../types";
import { buildingApi } from "../api/BuildingAPI";
import BuildingForm from "../components/BuildingForm";
import { useNotification } from "../context/NotificationContext";
import { branchApi } from "../api/BranchAPI";
import type { Branch } from "../types";
import { useTranslation } from 'react-i18next';

const BuildingManagement: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<BuildingType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<BuildingType | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<BuildingType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const loadBranches = useCallback(async () => {
    try {
      setLoadingBranches(true);
      const response = await branchApi.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error("Error loading branches:", error);
      showError(t('error.loadBranchesFailed', 'Failed to load branches. Please try again.'));
    } finally {
      setLoadingBranches(false);
    }
  }, [showError, t]);

  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await buildingApi.getAll();
      setBuildings(response.data);
      setFilteredBuildings(response.data);
    } catch (error) {
      console.error("Error loading buildings:", error);
      showError(t('error.loadBuildingsFailed', 'Failed to load buildings. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    loadBranches();
    loadBuildings();
  }, [loadBranches, loadBuildings]);

  useEffect(() => {
    let filtered = buildings;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (building) =>
          building.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          building.buildingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          building.branchName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedBranchId) {
      filtered = filtered.filter(building => building.branchId === selectedBranchId);
    }
    
    setFilteredBuildings(filtered);
  }, [searchTerm, selectedBranchId, buildings]);

  const handleCreate = () => {
    setEditingBuilding(null);
    setShowForm(true);
  };

  const handleEdit = (building: BuildingType) => {
    setEditingBuilding(building);
    setShowForm(true);
  };

  const handleDeleteClick = (building: BuildingType) => {
    setBuildingToDelete(building);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!buildingToDelete) return;

    try {
      setDeleting(true);
      await buildingApi.delete(buildingToDelete.id);
      showSuccess(t('notification.buildingDeleted', 'Building "{{name}}" deleted successfully!', { name: buildingToDelete.buildingName }));
      loadBuildings();
    } catch (error: any) {
      console.error("Error deleting building:", error);
      
      if (error.response?.status === 409) {
        showError(t('error.cannotDeleteBuilding', 'Cannot delete building. It may have associated shops or tenants.'));
      } else if (error.response?.status === 404) {
        showError(t('error.buildingNotFound', 'Building not found. It may have been deleted already.'));
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message?.includes('Network Error')) {
        showError(t('error.networkError', 'Network error. Please check your connection and try again.'));
      } else {
        showError(t('error.deleteBuildingFailed', 'Failed to delete building. Please try again.'));
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setBuildingToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setBuildingToDelete(null);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    loadBuildings();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBranchId(null);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US')} MMK`;
  };

  const getTotalStats = () => {
    const totalBuildings = buildings.length;
    const totalFloors = buildings.reduce((sum, b) => sum + (b.totalFloors || 0), 0);
    const totalArea = buildings.reduce((sum, b) => sum + (b.totalLeasableArea || 0), 0);
    const totalFees = buildings.reduce((sum, b) => sum + (b.transformerFee || 0) + (b.generatorFee || 0), 0);
    
    return { totalBuildings, totalFloors, totalArea, totalFees };
  };

  const stats = getTotalStats();

  if (loading && buildings.length === 0) {
    return (
      <div className="p-4 sm:p-8 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <div className="text-base sm:text-lg font-medium text-stone-700 mt-4">
            {t('common.loadingBuildings', 'Loading buildings...')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 min-h-screen bg-stone-50">
      
      {/* Header and Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 lg:mb-8">
        <div className="w-full lg:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900">
            {t('buildingManagement.title', 'Building Management')}
          </h1>
          <p className="text-stone-600 mt-1 text-xs sm:text-sm lg:text-base">
            {t('buildingManagement.subtitle', 'Manage all buildings within your branches')}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:bg-blue-900 transition duration-150 flex items-center gap-2 w-full lg:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300 transform active:scale-95 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          {t('buildingManagement.addBuilding', 'Add New Building')}
        </button>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 relative max-w-md">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('buildingManagement.searchPlaceholder', 'Search buildings by name, code, or branch...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={50}
            className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-sm text-sm sm:text-base"
          />
        </div>

        {/* Branch Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedBranchId || ""}
            onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
            className="appearance-none w-full sm:w-48 pl-4 pr-10 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-sm text-sm sm:text-base cursor-pointer"
            disabled={loadingBranches}
          >
            <option value="">{t('buildingManagement.allBranches', 'All Branches')}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branchName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedBranchId) && (
          <button
            onClick={clearFilters}
            className="px-4 py-3 text-blue-800 border border-blue-300 rounded-xl hover:bg-blue-50 transition duration-150 font-medium text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {t('buildingManagement.clearFilters', 'Clear Filters')}
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Buildings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredBuildings.map((building) => (
              <div
                key={building.id}
                className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-150 relative group"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-800" />
                    </div>
                    <div className="max-w-[180px] sm:max-w-none">
                      <h3 className="font-bold text-stone-900 text-base sm:text-lg truncate">
                        {building.buildingName}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 truncate">
                        {building.branchName}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(building)}
                      className="p-1 sm:p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                      title={t('tooltip.editBuilding', 'Edit building')}
                      aria-label={t('tooltip.editBuilding', 'Edit building')}
                      disabled={deleting}
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(building)}
                      className="p-1 sm:p-2 text-stone-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                      title={t('tooltip.deleteBuilding', 'Delete building')}
                      aria-label={t('tooltip.deleteBuilding', 'Delete building')}
                      disabled={deleting}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      {t('common.buildingCode', 'Building Code')}:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900">
                      {building.buildingCode || t('common.notAvailable', 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      {t('common.totalFloors', 'Total Floors')}:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900">
                      {building.totalFloors || t('common.notAvailable', 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      {t('common.leasableArea', 'Leasable Area')}:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900">
                      {building.totalLeasableArea
                        ? `${building.totalLeasableArea.toLocaleString()} sqft`
                        : t('common.notAvailable', 'N/A')}
                    </span>
                  </div>

                  {/* Transformer Fee */}
                  <div className="flex justify-between items-center pt-1 sm:pt-2 border-t border-stone-200">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        {t('common.transformer', 'Transformer')}:
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-stone-900 font-medium">
                      {building.transformerFee ? formatCurrency(building.transformerFee) : t('common.notAvailable', 'N/A')}
                    </span>
                  </div>

                  {/* Generator Fee */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Battery className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        {t('common.generator', 'Generator')}:
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-stone-900 font-medium">
                      {building.generatorFee ? formatCurrency(building.generatorFee) : t('common.notAvailable', 'N/A')}
                    </span>
                  </div>

                  {/* Manager Information */}
                  {building.managerName && (
                    <div className="flex justify-between items-center pt-1 sm:pt-2 border-t border-stone-200">
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        {t('common.manager', 'Manager')}:
                      </span>
                      <span className="text-xs sm:text-sm text-stone-900">
                        {building.managerName}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 pt-2 sm:pt-3 border-t border-stone-200">
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.totalFloors || 0}
                      </span>
                      <span className="text-xs text-stone-500">{t('common.floors', 'Floors')}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.totalLeasableArea
                          ? Math.round(building.totalLeasableArea / 1000)
                          : 0}
                        K
                      </span>
                      <span className="text-xs text-stone-500">{t('common.sqFt', 'Sq Ft')}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.transformerFee ? 
                          Math.round(building.transformerFee / 1000) + 'K' : 
                          '0'}
                      </span>
                      <span className="text-xs text-stone-500">{t('common.transformer', 'Transformer')}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.generatorFee ? 
                          Math.round(building.generatorFee / 1000) + 'K' : 
                          '0'}
                      </span>
                      <span className="text-xs text-stone-500">{t('common.generator', 'Generator')}</span>
                    </div>
                  </div>

                  {/* Total Fees */}
                  {(building.transformerFee > 0 || building.generatorFee > 0) && (
                    <div className="pt-1 sm:pt-2 border-t border-stone-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-stone-600">
                          {t('common.totalAdditionalFees', 'Total Additional Fees')}:
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          {formatCurrency((building.transformerFee || 0) + (building.generatorFee || 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBuildings.length === 0 && (
            <div className="text-center py-8 sm:py-12 lg:py-16 text-stone-500 bg-stone-50 rounded-xl">
              <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🏗️</div>
              <div className="text-lg sm:text-xl font-semibold text-stone-700 mb-1 sm:mb-2">
                {searchTerm || selectedBranchId ? 
                  t('buildingManagement.noResults', 'No Buildings Found') : 
                  t('buildingManagement.noBuildings', 'No Buildings Yet')}
              </div>
              <p className="text-xs sm:text-sm px-4 mb-4">
                {searchTerm || selectedBranchId
                  ? t('common.tryAdjustSearch', 'Try adjusting your search terms or filters to find what you\'re looking for.')
                  : t('common.startByAdding', 'Start by clicking \'Add New Building\' to define your first building.')}
              </p>
              {(searchTerm || selectedBranchId) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm font-medium"
                >
                  {t('buildingManagement.clearFilters', 'Clear Filters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Building Form Modal */}
      {showForm && (
        <BuildingForm
          building={editingBuilding}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && buildingToDelete && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900">
                {t('confirmation.deleteBuildingTitle', 'Delete Building')}
              </h2>
              <button
                onClick={handleDeleteCancel}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
                disabled={deleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{buildingToDelete.buildingName}</h3>
                  <p className="text-sm text-stone-500">
                    {buildingToDelete.branchName} • {buildingToDelete.buildingCode || t('common.noCode', 'No Code')}
                  </p>
                </div>
              </div>
              
              <p className="text-stone-700 mb-4">
                {t('confirmation.deleteBuilding', 'Are you sure you want to delete the building "{{name}}"? This action cannot be undone.', { name: buildingToDelete.buildingName })}
              </p>
              
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-red-700">
                    <p className="font-medium">{t('common.warning', 'Warning')}:</p>
                    <p className="mt-1">
                      {t('warning.deleteBuilding', 'Deleting this building will also remove all associated floors, shops, and tenant information. This action may affect financial records and reporting.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-stone-300"
                disabled={deleting}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-6 py-3 bg-blue-800 text-white rounded-lg shadow-lg hover:bg-blue-900 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-blue-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.deleting', 'Deleting...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t('common.deleteBuilding', 'Delete Building')}
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

export default BuildingManagement;