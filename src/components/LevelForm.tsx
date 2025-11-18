import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Level, Building, LevelRequest } from '../types';
import { levelApi } from '../api/LevelAPI';
import { buildingApi } from '../api/BuildingAPI';
import '../assets/css/LevelForm.css';

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
    <div className="level-form-overlay">
      <div className="level-form-container">
        <div className="level-form-header">
          <h2 className="level-form-title">
            {level ? 'Edit Level' : 'Add New Level'}
          </h2>
          <button
            onClick={onClose}
            className="level-form-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="level-form">
          <div className="form-group">
            <label className="form-label">
              Building *
            </label>
            <select
              name="buildingId"
              value={formData.buildingId}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value={0}>Select a building</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingName} - {building.branchName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Level Name *
            </label>
            <input
              type="text"
              name="levelName"
              value={formData.levelName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Level Number *
            </label>
            <input
              type="number"
              name="levelNumber"
              value={formData.levelNumber}
              onChange={handleChange}
              required
              min="0"
              className="number-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Total Rooms
            </label>
            <input
              type="number"
              name="totalRooms"
              value={formData.totalRooms}
              onChange={handleChange}
              min="0"
              className="number-input"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Saving...' : level ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LevelForm;