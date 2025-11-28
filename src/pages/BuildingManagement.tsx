/** @format */

import React, { useState, useEffect } from "react";
import { Building } from "lucide-react";
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading Building Management...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Building Management</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">Manage all buildings within your branches.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Add New Building
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search buildings by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="p-6">
          {/* Buildings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuildings.map((building) => (
              <div
                key={building.id}
                className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Building className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg">
                        {building.buildingName}
                      </h3>
                      <p className="text-sm text-stone-500">{building.branchName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(building)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      title="Edit building"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(building.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      title="Delete building"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-600">
                      Building Code:
                    </span>
                    <span className="text-sm text-stone-900">
                      {building.buildingCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-600">
                      Total Floors:
                    </span>
                    <span className="text-sm text-stone-900">
                      {building.totalFloors || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-600">
                      Leasable Area:
                    </span>
                    <span className="text-sm text-stone-900">
                      {building.totalLeasableArea
                        ? `${building.totalLeasableArea.toLocaleString()} sqft`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-4 pt-3 border-t border-stone-200">
                    <div className="text-center">
                      <span className="block text-lg font-bold text-stone-900">
                        {building.totalFloors || 0}
                      </span>
                      <span className="text-xs text-stone-500">Floors</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-bold text-stone-900">
                        {building.totalLeasableArea
                          ? Math.round(building.totalLeasableArea / 1000)
                          : 0}
                        K
                      </span>
                      <span className="text-xs text-stone-500">Sq Ft</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBuildings.length === 0 && (
            <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
              <div className="text-5xl mb-3">🏗️</div>
              <div className="text-xl font-semibold text-stone-700 mb-2">
                {searchTerm ? "No Buildings Found" : "No Buildings Yet"}
              </div>
              <p className="text-sm">
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