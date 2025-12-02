import React, { useState, useEffect } from "react";
import { Building, Search, Plus, Edit, Trash2, Zap, Battery } from "lucide-react";
import type { Building as BuildingType } from "../types";
import { buildingApi } from "../api/BuildingAPI.tsx";
import BuildingForm from "../components/BuildingForm";

const BuildingManagement: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error("Error loading buildings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBuilding(null);
    setShowForm(true);
  };

  const handleEdit = (building: BuildingType) => {
    setEditingBuilding(building);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this building?")) {
      try {
        await buildingApi.delete(id);
        loadBuildings();
      } catch (error) {
        console.error("Error deleting building:", error);
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    loadBuildings();
  };

  const filteredBuildings = buildings.filter(
    (building) =>
      building.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.buildingCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US')} MMK`;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-base sm:text-lg font-medium text-stone-700 animate-pulse">Loading buildings...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 min-h-screen bg-stone-50">
      
      {/* Header and Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 lg:mb-8">
        <div className="w-full lg:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900">Building Management</h1>
          <p className="text-stone-600 mt-1 text-xs sm:text-sm lg:text-base">Manage all buildings within your branches</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full lg:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add New Building
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search buildings by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Buildings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredBuildings.map((building) => (
              <div
                key={building.id}
                className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" />
                    </div>
                    <div className="max-w-[180px] sm:max-w-none">
                      <h3 className="font-bold text-stone-900 text-base sm:text-lg truncate">
                        {building.buildingName}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 truncate">{building.branchName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(building)}
                      className="p-1 sm:p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      title="Edit building"
                      aria-label="Edit building"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(building.id)}
                      className="p-1 sm:p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      title="Delete building"
                      aria-label="Delete building"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      Building Code:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900">
                      {building.buildingCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      Total Floors:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900">
                      {building.totalFloors || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-stone-600">
                      Leasable Area:
                    </span>
                    <span className="text-xs sm:text-sm text-stone-900">
                      {building.totalLeasableArea
                        ? `${building.totalLeasableArea.toLocaleString()} sqft`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Transformer Fee */}
                  <div className="flex justify-between items-center pt-1 sm:pt-2 border-t border-stone-200">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        Transformer:
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-stone-900 font-medium">
                      {building.transformerFee ? formatCurrency(building.transformerFee) : "N/A"}
                    </span>
                  </div>

                  {/* Generator Fee */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Battery className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        Generator:
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-stone-900 font-medium">
                      {building.generatorFee ? formatCurrency(building.generatorFee) : "N/A"}
                    </span>
                  </div>

                  {/* Manager Information */}
                  {building.managerName && (
                    <div className="flex justify-between items-center pt-1 sm:pt-2 border-t border-stone-200">
                      <span className="text-xs sm:text-sm font-medium text-stone-600">
                        Manager:
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
                      <span className="text-xs text-stone-500">Floors</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.totalLeasableArea
                          ? Math.round(building.totalLeasableArea / 1000)
                          : 0}
                        K
                      </span>
                      <span className="text-xs text-stone-500">Sq Ft</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.transformerFee ? 
                          Math.round(building.transformerFee / 1000) + 'K' : 
                          '0'}
                      </span>
                      <span className="text-xs text-stone-500">Transformer</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm sm:text-lg font-bold text-stone-900">
                        {building.generatorFee ? 
                          Math.round(building.generatorFee / 1000) + 'K' : 
                          '0'}
                      </span>
                      <span className="text-xs text-stone-500">Generator</span>
                    </div>
                  </div>

                  {/* Total Fees */}
                  {(building.transformerFee > 0 || building.generatorFee > 0) && (
                    <div className="pt-1 sm:pt-2 border-t border-stone-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-stone-600">
                          Total Additional Fees:
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
                {searchTerm ? "No Buildings Found" : "No Buildings Yet"}
              </div>
              <p className="text-xs sm:text-sm px-4">
                {searchTerm
                  ? "Try adjusting your search terms to find what you're looking for."
                  : "Start by clicking 'Add New Building' to define your first building."}
              </p>
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
    </div>
  );
};

export default BuildingManagement;