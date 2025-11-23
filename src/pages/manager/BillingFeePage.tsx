/** @format */
import React, { useState, useEffect } from "react";
import { billingFeeApi } from "../../api/BillingFeeAPI";
import type { BillingFee, BillingFeeRequest } from "../../types/billing";


export const BillingFeePage: React.FC = () => {
  const [billingFees, setBillingFees] = useState<BillingFee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<BillingFee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BillingFeeRequest>({
    feeName: "",
    feeType: "RENT",
    calculationBase: "FIXED",
    rate: 0,
    description: "",
    isActive: true
  });

  useEffect(() => {
    fetchBillingFees();
  }, []);

  const fetchBillingFees = async () => {
    try {
      setLoading(true);
      const response = await billingFeeApi.getAll();
      setBillingFees(response.data);
    } catch (error) {
      console.error("Error fetching billing fees:", error);
      alert("Failed to fetch billing fees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFee) {
        await billingFeeApi.update(editingFee.id, formData);
      } else {
        await billingFeeApi.create(formData);
      }
      
      setShowForm(false);
      setEditingFee(null);
      setFormData({ 
        feeName: "", 
        feeType: "RENT", 
        calculationBase: "FIXED", 
        rate: 0, 
        description: "",
        isActive: true 
      });
      fetchBillingFees();
      alert(`Billing fee ${editingFee ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error("Error saving billing fee:", error);
      alert(error.response?.data?.message || "Failed to save billing fee");
    }
  };

  const handleEdit = (fee: BillingFee) => {
    setEditingFee(fee);
    setFormData({
      feeName: fee.feeName,
      feeType: fee.feeType,
      calculationBase: fee.calculationBase,
      rate: fee.rate,
      description: fee.description,
      isActive: fee.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this billing fee?")) {
      try {
        await billingFeeApi.delete(id);
        fetchBillingFees();
        alert("Billing fee deleted successfully!");
      } catch (error: any) {
        console.error("Error deleting billing fee:", error);
        alert(error.response?.data?.message || "Failed to delete billing fee");
      }
    }
  };

  const feeTypeOptions = ["RENT", "ELECTRICITY", "WATER", "CAM", "TRANSFORMER", "GENERATOR", "MAINTENANCE", "OTHER"];
  const calculationBaseOptions = ["FIXED", "PERCENTAGE", "PER_SQ_FT", "PER_UNIT"];

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing Fees</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Billing Fee
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingFee ? "Edit Billing Fee" : "Add Billing Fee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Name</label>
                <input
                  type="text"
                  required
                  value={formData.feeName}
                  onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Type</label>
                <select
                  value={formData.feeType}
                  onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {feeTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Calculation Base</label>
                <select
                  value={formData.calculationBase}
                  onChange={(e) => setFormData({ ...formData, calculationBase: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {calculationBaseOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFee(null);
                    setFormData({ 
                      feeName: "", 
                      feeType: "RENT", 
                      calculationBase: "FIXED", 
                      rate: 0, 
                      description: "",
                      isActive: true 
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingFee ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calculation Base
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {billingFees.map((fee) => (
              <tr key={fee.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {fee.feeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fee.feeType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fee.calculationBase}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fee.rate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    fee.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {fee.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(fee)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(fee.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};