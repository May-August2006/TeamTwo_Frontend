import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Building } from '../types';
import { branchApi } from '../api/BranchAPI';
import type { Branch } from '../types';
import { buildingApi } from '../api/BuildingAPI';
import '../assets/css/BuildingForm.css';

interface BuildingFormProps {
  building?: Building | null;
  onClose: () => void;
  onSubmit: () => void;
}

const BuildingForm: React.FC<BuildingFormProps> = ({ building, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    branchId: 0,
    buildingName: '',
    buildingCode: '',
    totalFloors: 0,
    totalLeasableArea: 0,
    transformerFee: 0,
    generatorFee: 0,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
    if (building) {
      setFormData({
        branchId: building.branchId,
        buildingName: building.buildingName,
        buildingCode: building.buildingCode || '',
        totalFloors: building.totalFloors || 0,
        totalLeasableArea: building.totalLeasableArea || 0,
        transformerFee: building.transformerFee || 0,
        generatorFee: building.generatorFee || 0,
      });
    }
  }, [building]);

  const loadBranches = async () => {
    try {
      const response = await branchApi.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (building) {
        await buildingApi.update(building.id, formData);
      } else {
        await buildingApi.create(formData);
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving building:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'branchId' || 
               name === 'totalFloors' || 
               name === 'totalLeasableArea' ||
               name === 'transformerFee' ||
               name === 'generatorFee' 
        ? Number(value) 
        : value,
    }));
  };

  return (
    <div className="building-form-overlay">
      <div className="building-form-container">
        <div className="building-form-header">
          <h2 className="building-form-title">
            {building ? 'Edit Building' : 'Add New Building'}
          </h2>
          <button
            onClick={onClose}
            className="building-form-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="building-form">
          <div className="form-group">
            <label className="form-label">
              Branch *
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value={0}>Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Building Name *
            </label>
            <input
              type="text"
              name="buildingName"
              value={formData.buildingName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Building Code
            </label>
            <input
              type="text"
              name="buildingCode"
              value={formData.buildingCode}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Total Floors
            </label>
            <input
              type="number"
              name="totalFloors"
              value={formData.totalFloors}
              onChange={handleChange}
              min="0"
              className="number-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Total Leasable Area (sqft)
            </label>
            <input
              type="number"
              name="totalLeasableArea"
              value={formData.totalLeasableArea}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="number-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Transformer Fee ($)
            </label>
            <input
              type="number"
              name="transformerFee"
              value={formData.transformerFee}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="number-input"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Generator Fee ($)
            </label>
            <input
              type="number"
              name="generatorFee"
              value={formData.generatorFee}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="number-input"
              placeholder="0.00"
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
              {loading ? 'Saving...' : building ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuildingForm;