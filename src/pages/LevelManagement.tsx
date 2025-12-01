/** @format */

import React, { useState, useEffect } from "react";
import { Layers, Calendar } from "lucide-react";
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
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading Level Management...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Level Management</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">Manage all levels within your buildings.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Add New Level
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
            placeholder="Search levels by name or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="p-6">
          {/* Levels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLevels.map((level) => (
              <div
                key={level.id}
                className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Layers className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg">
                        {level.levelName}
                      </h3>
                      <p className="text-sm text-stone-500">{level.buildingName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(level)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      title="Edit level"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(level.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      title="Delete level"
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
                      Level Number:
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Floor {level.levelNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-600">
                      Total Rooms:
                    </span>
                    <span className="text-sm text-stone-900">
                      {level.totalRooms || 0}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-stone-500 pt-3 border-t border-stone-200">
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
            <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
              <div className="text-5xl mb-3">🏢</div>
              <div className="text-xl font-semibold text-stone-700 mb-2">
                {searchTerm ? "No Levels Found" : "No Levels Yet"}
              </div>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search terms to find what you're looking for."
                  : "Start by clicking 'Add New Level' to define your first level."}
              </p>
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