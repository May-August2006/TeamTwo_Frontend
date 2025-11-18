/** @format */

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Layers, Calendar } from "lucide-react";
import type { Level } from "../types";
import { levelApi } from "../api/LevelAPI";
import LevelForm from "../components/LevelForm";

const LevelManagement: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      setLoading(true);
      const response = await levelApi.getAll();
      setLevels(response.data);
    } catch (error) {
      console.error("Error loading levels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLevel(null);
    setShowForm(true);
  };

  const handleEdit = (level: Level) => {
    setEditingLevel(level);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this level?")) {
      try {
        await levelApi.delete(id);
        loadLevels();
      } catch (error) {
        console.error("Error deleting level:", error);
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    loadLevels();
  };

  const filteredLevels = levels.filter(
    (level) =>
      level.levelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      level.buildingName.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search levels by name or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Add Level Button */}
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Level</span>
        </button>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {/* Levels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLevels.map((level) => (
              <div
                key={level.id}
                className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Layers className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {level.levelName}
                      </h3>
                      <p className="text-sm text-gray-500">{level.buildingName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(level)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit level"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(level.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete level"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Level Number:
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Floor {level.levelNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Total Rooms:
                    </span>
                    <span className="text-sm text-gray-900">
                      {level.totalRooms || 0}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Created: {new Date(level.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredLevels.length === 0 && (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No levels found" : "No levels yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms to find what you're looking for."
                  : "Get started by creating your first level for your building."}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreate}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Level</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level Form Modal */}
      {showForm && (
        <LevelForm
          level={editingLevel}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default LevelManagement;