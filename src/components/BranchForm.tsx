import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Branch } from '../types';
import { branchApi } from '../api/BranchAPI';

interface BranchFormProps {
  branch?: Branch | null;
  onClose: () => void;
  onSubmit: () => void;
}

const BranchForm: React.FC<BranchFormProps> = ({ branch, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    branchName: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branch) {
      setFormData({
        branchName: branch.branchName,
        address: branch.address,
        contactPhone: branch.contactPhone,
        contactEmail: branch.contactEmail,
      });
    }
  }, [branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (branch) {
        await branchApi.update(branch.id, formData);
      } else {
        await branchApi.create(formData);
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving branch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            {branch ? 'Edit Branch' : 'Add New Branch'}
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
              Branch Name *
            </label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleChange}
              required
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
              placeholder="Enter branch name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm resize-none"
              placeholder="Enter branch address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
              placeholder="Enter contact phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
              placeholder="Enter contact email"
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
              {loading ? 'Saving...' : branch ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchForm;