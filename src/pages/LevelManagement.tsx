/** @format */

import React, { useState, useEffect } from "react";
import { Layers, Calendar, Trash2, Edit2, X } from "lucide-react";
import type { Level } from "../types";
import { levelApi } from "../api/LevelAPI";
import LevelForm from "../components/LevelForm";
import { Notification, type NotificationType } from "../components/common/ui/Notification";

const LevelManagement: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    title?: string;
  } | null>(null);

  useEffect(() => {
    loadLevels();
  }, []);

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({ type, message, title });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const loadLevels = async () => {
    try {
      setLoading(true);
      const response = await levelApi.getAll();
      setLevels(response.data);
    } catch (error) {
      console.error("Error loading levels:", error);
      showNotification('error', "Failed to load floors. Please try again.", "Error");
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

  const handleDeleteClick = (level: Level) => {
    setLevelToDelete(level);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!levelToDelete) return;

    try {
      setDeleting(true);
      await levelApi.delete(levelToDelete.id);
      showNotification('success', `Floor "${levelToDelete.levelName}" deleted successfully!`, "Deleted");
      loadLevels();
    } catch (error: any) {
      console.error("Error deleting level:", error);
      showNotification('error', 
        error.response?.data?.message || "Failed to delete floor. Please try again.", 
        "Delete Failed"
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setLevelToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setLevelToDelete(null);
  };

  const handleFormSubmit = (message: string) => {
    setShowForm(false);
    
    let title = "Success";
    if (message.includes("created")) {
      title = "Floor Created";
    } else if (message.includes("updated")) {
      title = "Floor Updated";
    }
    
    showNotification('success', message, title);
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
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading Floor Management...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          title={notification.title}
          onClose={() => setNotification(null)}
          duration={3000}
        />
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Floor Management</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">Manage all floors within your buildings.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Add New Floor
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
            placeholder="Search floors by name or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
          />
        </div>
      </div>

      
      {/* Content Section */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="p-6">
          {levels.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-stone-600">
                  Showing <span className="font-semibold">{filteredLevels.length}</span> of <span className="font-semibold">{levels.length}</span> floors
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {/* Levels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLevels.map((level) => (
                  <div
                    key={level.id}
                    className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow duration-150 hover:border-red-200"
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
                          title="Edit floor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(level)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Delete floor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-stone-600">
                          Floor Number:
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {level.levelNumber === 0 ? 'Ground Floor' : 
                           level.levelNumber === 1 ? '1st Floor' :
                           level.levelNumber === 2 ? '2nd Floor' :
                           level.levelNumber === 3 ? '3rd Floor' :
                           `${level.levelNumber}th Floor`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-stone-600">
                          Total Units:
                        </span>
                        <span className="text-sm text-stone-900 font-medium">
                          {level.totalUnits || 0} {level.totalUnits === 1 ? 'unit' : 'units'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-stone-500 pt-3 border-t border-stone-200">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Created: {new Date(level.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Empty State - No floors at all
            <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
              <div className="text-5xl mb-3">🏢</div>
              <div className="text-xl font-semibold text-stone-700 mb-2">
                No Floors Yet
              </div>
              <p className="text-sm mb-6">
                Start by clicking 'Add New Floor' to define your first floor.
              </p>
              <button
                onClick={handleCreate}
                className="bg-red-600 text-white px-6 py-3 rounded-lg shadow hover:bg-red-700 transition duration-150 flex items-center gap-2 mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="M12 5v14"/>
                </svg>
                Add Your First Floor
              </button>
            </div>
          )}

          {/* Empty Search Results */}
          {levels.length > 0 && filteredLevels.length === 0 && (
            <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-xl">
              <div className="text-5xl mb-3">🔍</div>
              <div className="text-xl font-semibold text-stone-700 mb-2">
                No Floors Found
              </div>
              <p className="text-sm mb-4">
                No floors match your search for "<span className="font-medium">{searchTerm}</span>"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Clear search and show all floors
              </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && levelToDelete && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900">Delete Floor</h2>
              <button
                onClick={handleDeleteCancel}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
                disabled={deleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4 p-3 bg-red-50 rounded-lg">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Layers className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{levelToDelete.levelName}</h3>
                  <p className="text-sm text-stone-500">
                    {levelToDelete.buildingName} • {levelToDelete.totalUnits || 0} units
                  </p>
                </div>
              </div>
              
              <p className="text-stone-700">
                Are you sure you want to delete the floor "<span className="font-semibold">{levelToDelete.levelName}</span>"? 
                This action cannot be undone and will remove all associated data.
              </p>
              
              <div className="mt-4 p-3 bg-stone-50 rounded-lg">
                <p className="text-sm text-stone-600">
                  <span className="font-medium">Note:</span> Deleting a floor will also remove all units and related information associated with this floor.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-stone-300"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Floor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      {levels.length > 0 && (
        <div className="mt-8 text-sm text-stone-600">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>
              <span className="font-medium">Tip:</span> You can edit or delete floors using the action buttons on each card. 
              Floor names are automatically capitalized for consistency.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelManagement;