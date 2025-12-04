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

const UnitManagement: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  
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

  // ========== DATA LOADING ==========
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      const errorMessage = error.response?.data?.message || 'Failed to load data';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
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
      showSuccess(`Unit ${response.data.unitNumber} created successfully!`);
      return true;
    } catch (error: any) {
      console.error("Error creating unit:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create unit';
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
      showSuccess(`Unit ${response.data.unitNumber} updated successfully!`);
      return true;
    } catch (error: any) {
      console.error("Error updating unit:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update unit';
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteUnit = async (id: number, unitNumber: string) => {
    showConfirmDialog(
      'Delete Unit',
      `Are you sure you want to delete unit ${unitNumber}? This action cannot be undone.`,
      async () => {
        try {
          await unitApi.delete(id);
          await loadAllData();
          showSuccess(`Unit ${unitNumber} deleted successfully!`);
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting unit:", error);
          const errorMessage = error.response?.data?.message || 'Failed to delete unit';
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
      showSuccess('Room type created successfully!');
      return true;
    } catch (error: any) {
      console.error("Error creating room type:", error);
      const errorMessage = error.response?.data?.message || 'Failed to create room type';
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
      showSuccess('Room type updated successfully!');
      return true;
    } catch (error: any) {
      console.error("Error updating room type:", error);
      const errorMessage = error.response?.data?.message || 'Failed to update room type';
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteRoomType = async (id: number, typeName: string) => {
    showConfirmDialog(
      'Delete Room Type',
      `Are you sure you want to delete room type "${typeName}"? This action cannot be undone.`,
      async () => {
        try {
          await roomTypeApi.delete(id);
          await loadAllData();
          showSuccess(`Room type "${typeName}" deleted successfully!`);
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting room type:", error);
          const errorMessage = error.response?.data?.message || 'Failed to delete room type';
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
      showSuccess('Space type created successfully!');
      return true;
    } catch (error: any) {
      console.error("Error creating space type:", error);
      const errorMessage = error.response?.data?.message || 'Failed to create space type';
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
      showSuccess('Space type updated successfully!');
      return true;
    } catch (error: any) {
      console.error("Error updating space type:", error);
      const errorMessage = error.response?.data?.message || 'Failed to update space type';
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteSpaceType = async (id: number, name: string) => {
    showConfirmDialog(
      'Delete Space Type',
      `Are you sure you want to delete space type "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await spaceTypeApi.delete(id);
          await loadAllData();
          showSuccess(`Space type "${name}" deleted successfully!`);
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting space type:", error);
          const errorMessage = error.response?.data?.message || 'Failed to delete space type';
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
      showSuccess('Hall type created successfully!');
      return true;
    } catch (error: any) {
      console.error("Error creating hall type:", error);
      const errorMessage = error.response?.data?.message || 'Failed to create hall type';
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
      showSuccess('Hall type updated successfully!');
      return true;
    } catch (error: any) {
      console.error("Error updating hall type:", error);
      const errorMessage = error.response?.data?.message || 'Failed to update hall type';
      showError(errorMessage);
      return false;
    }
  };

  const confirmDeleteHallType = async (id: number, name: string) => {
    showConfirmDialog(
      'Delete Hall Type',
      `Are you sure you want to delete hall type "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await hallTypeApi.delete(id);
          await loadAllData();
          showSuccess(`Hall type "${name}" deleted successfully!`);
          setConfirmDialog(null);
        } catch (error: any) {
          console.error("Error deleting hall type:", error);
          const errorMessage = error.response?.data?.message || 'Failed to delete hall type';
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
      const response = await unitApi.search(searchParams);
      setFilteredUnits(response.data || []);
      if (response.data?.length === 0) {
        showInfo('No units found matching your search criteria');
      }
    } catch (error: any) {
      console.error("Error searching units:", error);
      const errorMessage = error.response?.data?.message || 'Failed to search units';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setFilteredUnits(units);
    setError(null);
    showInfo('Search reset to show all units');
  };

  const showInfo = (message: string) => {
    // You can add this to your NotificationContext if you want info notifications
    console.info(message);
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
      case 'units': return 'Add Unit';
      case 'roomTypes': return 'Add Room Type';
      case 'spaceTypes': return 'Add Space Type';
      case 'hallTypes': return 'Add Hall Type';
      default: return 'Add';
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
        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    );
  };

  if (loading && units.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-medium text-stone-700">Loading Unit Management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6 lg:p-8">
      
      {/* Header and Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900">Unit Management</h1>
          <p className="text-stone-600 mt-1 text-sm md:text-base">Manage all units and their types in your properties.</p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-stone-200 flex-1">
          <nav className="-mb-px flex space-x-2 md:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('units')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'units'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Units ({filteredUnits.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('roomTypes')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'roomTypes'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Room Types ({roomTypes.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('spaceTypes')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'spaceTypes'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                </svg>
                Space Types ({spaceTypes.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('hallTypes')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'hallTypes'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center">
                <Video className="w-4 h-4 mr-2" />
                Hall Types ({hallTypes.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Add Button */}
        <Button
          onClick={handleAddClick}
          className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-lg transition duration-150 font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          {getAddButtonText()}
        </Button>
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
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        
        {/* Units Tab Content */}
        {activeTab === 'units' && (
          <UnitList
            units={filteredUnits}
            onEdit={openEditUnitModal}
            onDelete={(id, unitNumber) => confirmDeleteUnit(id, unitNumber)}
            isLoading={loading}
            viewMode="grid"
          />
        )}

        {/* Room Types Tab Content */}
        {activeTab === 'roomTypes' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map(roomType => (
                <div key={roomType.id} className="bg-stone-50 rounded-xl border border-stone-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-stone-900">{roomType.typeName}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditRoomTypeModal(roomType)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {renderDeleteButtons('roomType', roomType)}
                    </div>
                  </div>
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">{roomType.description || 'No description provided'}</p>
                  <div className="flex justify-between items-center text-xs text-stone-500">
                    <span>Created: {new Date(roomType.createdAt).toLocaleDateString()}</span>
                    <Button
                      onClick={() => openEditRoomTypeModal(roomType)}
                      className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {roomTypes.length === 0 && (
              <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
                <div className="text-5xl mb-3">🏢</div>
                <div className="text-xl font-semibold text-stone-700 mb-2">No Room Types Found</div>
                <p className="text-sm mb-4">Create your first room type to get started.</p>
                <Button
                  onClick={openCreateRoomTypeModal}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  Create Room Type
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
                <div key={spaceType.id} className="bg-stone-50 rounded-xl border border-stone-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{spaceType.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        spaceType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {spaceType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditSpaceTypeModal(spaceType)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {renderDeleteButtons('spaceType', spaceType)}
                    </div>
                  </div>
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">{spaceType.description || 'No description provided'}</p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Base Price:</span>
                      <span className="font-medium">{spaceType.basePricePerSqm || 0} MMK/sqm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Space Range:</span>
                      <span className="font-medium">{spaceType.minSpace || 0} - {spaceType.maxSpace || 0} sqm</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-stone-500">
                    <span>Created: {new Date(spaceType.createdAt).toLocaleDateString()}</span>
                    <Button
                      onClick={() => openEditSpaceTypeModal(spaceType)}
                      className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {spaceTypes.length === 0 && (
              <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
                <div className="text-5xl mb-3">📐</div>
                <div className="text-xl font-semibold text-stone-700 mb-2">No Space Types Found</div>
                <p className="text-sm mb-4">Create your first space type to get started.</p>
                <Button
                  onClick={openCreateSpaceTypeModal}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  Create Space Type
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
                <div key={hallType.id} className="bg-stone-50 rounded-xl border border-stone-200 hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{hallType.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        hallType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hallType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditHallTypeModal(hallType)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {renderDeleteButtons('hallType', hallType)}
                    </div>
                  </div>
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">{hallType.description || 'No description provided'}</p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Base Price:</span>
                      <span className="font-medium">{hallType.basePrice || 0} MMK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Capacity:</span>
                      <span className="font-medium">{hallType.capacity || 0} people</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-stone-500">
                    <span>Created: {new Date(hallType.createdAt).toLocaleDateString()}</span>
                    <Button
                      onClick={() => openEditHallTypeModal(hallType)}
                      className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {hallTypes.length === 0 && (
              <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
                <div className="text-5xl mb-3">🎭</div>
                <div className="text-xl font-semibold text-stone-700 mb-2">No Hall Types Found</div>
                <p className="text-sm mb-4">Create your first hall type to get started.</p>
                <Button
                  onClick={openCreateHallTypeModal}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  Create Hall Type
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
        title={editingUnit ? 'Edit Unit' : 'Create New Unit'}
        size="lg"
      >
        {renderUnitForm()}
      </Modal>

      {/* Create/Edit Room Type Modal */}
      <Modal
        isOpen={showRoomTypeForm}
        onClose={closeAllModals}
        title={editingRoomType ? 'Edit Room Type' : 'Create New Room Type'}
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
        title={editingSpaceType ? 'Edit Space Type' : 'Create New Space Type'}
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
        title={editingHallType ? 'Edit Hall Type' : 'Create New Hall Type'}
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
                  Cancel
                </Button>
                <Button
                  onClick={confirmDialog.onConfirm}
                  variant="danger"
                  className="px-4 py-2"
                >
                  Delete
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