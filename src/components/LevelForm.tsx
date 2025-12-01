import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Level, Building, LevelRequest } from '../types';
import { levelApi } from '../api/LevelAPI';
import { buildingApi } from '../api/BuildingAPI';

interface LevelFormProps {
  level?: Level | null;
  onClose: () => void;
  onSubmit: () => void;
}

const LevelForm: React.FC<LevelFormProps> = ({ level, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<LevelRequest>({
    buildingId: 0,
    levelName: '',
    levelNumber: 0,
    totalRooms: 0,
  });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBuildings();
    if (level) {
      setFormData({
        buildingId: level.buildingId,
        levelName: level.levelName,
        levelNumber: level.levelNumber,
        totalRooms: level.totalRooms || 0,
      });
    }
  }, [level]);

  const loadBuildings = async () => {
    try {
      const response = await buildingApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (level) {
        await levelApi.update(level.id, formData);
      } else {
        await levelApi.create(formData);
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving level:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'buildingId' || name === 'levelNumber' || name === 'totalRooms'
          ? Number(value)
          : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            {level ? 'Edit Level' : 'Add New Level'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Building *
            </label>
            <select
              name="buildingId"
              value={formData.buildingId}
              onChange={handleChange}
              required
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 bg-white shadow-sm"
            >
              <option value={0}>Select a building</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingName} - {building.branchName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Level Name *
            </label>
            <input
              type="text"
              name="levelName"
              value={formData.levelName}
              onChange={handleChange}
              required
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
              placeholder="Enter level name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Level Number *
            </label>
            <input
              type="number"
              name="levelNumber"
              value={formData.levelNumber}
              onChange={handleChange}
              required
              min="0"
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Total Rooms
            </label>
            <input
              type="number"
              name="totalRooms"
              value={formData.totalRooms}
              onChange={handleChange}
              min="0"
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? 'Saving...' : level ? 'Update Level' : 'Create Level'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LevelForm;