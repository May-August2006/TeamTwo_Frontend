/** @format */

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Building } from "lucide-react";
import type { Building as BuildingType } from "../types";
import { buildingApi } from "../api/BuildingAPI.tsx";
import BuildingForm from "../components/BuildingForm";

const BuildingManagement: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingType | null>(
    null
  );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search buildings by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Add Building Button */}
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Building</span>
        </button>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {/* Buildings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuildings.map((building) => (
              <div
                key={building.id}
                className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {building.buildingName}
                      </h3>
                      <p className="text-sm text-gray-500">{building.branchName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(building)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit building"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(building.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete building"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Building Code:
                    </span>
                    <span className="text-sm text-gray-900">
                      {building.buildingCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Total Floors:
                    </span>
                    <span className="text-sm text-gray-900">
                      {building.totalFloors || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Leasable Area:
                    </span>
                    <span className="text-sm text-gray-900">
                      {building.totalLeasableArea
                        ? `${building.totalLeasableArea.toLocaleString()} sqft`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-4 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <span className="block text-lg font-bold text-gray-900">
                        {building.totalFloors || 0}
                      </span>
                      <span className="text-xs text-gray-500">Floors</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-bold text-gray-900">
                        {building.totalLeasableArea
                          ? Math.round(building.totalLeasableArea / 1000)
                          : 0}
                        K
                      </span>
                      <span className="text-xs text-gray-500">Sq Ft</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBuildings.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No buildings found" : "No buildings yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms to find what you're looking for."
                  : "Get started by creating your first building for your branch."}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreate}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Building</span>
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
    </div>
  );
};

export default BuildingManagement;