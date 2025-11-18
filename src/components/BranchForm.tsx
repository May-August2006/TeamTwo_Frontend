import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Branch } from '../types';
import { branchApi } from '../api/BranchAPI';
import '../assets/css/BranchForm.css';

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
    <div className="branch-form-overlay">
      <div className="branch-form-container">
        <div className="branch-form-header">
          <h2 className="branch-form-title">
            {branch ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button
            onClick={onClose}
            className="branch-form-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="branch-form">
          <div className="form-group">
            <label className="form-label">
              Branch Name *
            </label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="form-input"
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
              {loading ? 'Saving...' : branch ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchForm;