import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Building } from '../types';
import { branchApi } from '../api/BranchAPI';
import type { Branch } from '../types';
import { buildingApi } from '../api/BuildingAPI';

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
      [name]: name === 'branchId' || name === 'totalFloors' || name === 'totalLeasableArea' 
        ? Number(value) 
        : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            {building ? 'Edit Building' : 'Add New Building'}
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
              Branch *
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              required
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 bg-white shadow-sm"
            >
              <option value={0}>Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Building Name *
            </label>
            <input
              type="text"
              name="buildingName"
              value={formData.buildingName}
              onChange={handleChange}
              required
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
              placeholder="Enter building name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Building Code
            </label>
            <input
              type="text"
              name="buildingCode"
              value={formData.buildingCode}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
              placeholder="Enter building code (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Total Floors
            </label>
            <input
              type="number"
              name="totalFloors"
              value={formData.totalFloors}
              onChange={handleChange}
              min="0"
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Total Leasable Area (sqft)
            </label>
            <input
              type="number"
              name="totalLeasableArea"
              value={formData.totalLeasableArea}
              onChange={handleChange}
              min="0"
              step="0.01"
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
              {loading ? 'Saving...' : building ? 'Update Building' : 'Create Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuildingForm;