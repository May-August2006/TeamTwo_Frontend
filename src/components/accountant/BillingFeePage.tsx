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
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading Billing Fees...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Billing Fees</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">Configure billing fees and rates for tenant charges</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Add Billing Fee
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-stone-900">
              {editingFee ? "Edit Billing Fee" : "Add Billing Fee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Fee Name</label>
                <input
                  type="text"
                  required
                  value={formData.feeName}
                  onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Fee Type</label>
                <select
                  value={formData.feeType}
                  onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 bg-white"
                >
                  {feeTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Calculation Base</label>
                <select
                  value={formData.calculationBase}
                  onChange={(e) => setFormData({ ...formData, calculationBase: e.target.value })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150 bg-white"
                >
                  {calculationBaseOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-stone-300 rounded transition duration-150"
                />
                <label className="ml-2 block text-sm text-stone-900 font-medium">Active</label>
              </div>
              
              <div className="flex gap-2 justify-end pt-4 border-t border-stone-200">
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
                  className="px-4 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 font-semibold"
                >
                  {editingFee ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Fee Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Calculation Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {billingFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-red-50/50 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    {fee.feeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {fee.feeType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {fee.calculationBase}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
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
                      className="text-red-600 hover:text-red-700 mr-3 transition duration-150"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="text-red-600 hover:text-red-800 transition duration-150"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {billingFees.length === 0 && (
          <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-b-xl">
            <div className="text-5xl mb-3">🛠️</div>
            <div className="text-xl font-semibold text-stone-700">No Billing Fees Found</div>
            <p className="text-sm mt-1">Start by clicking "Add Billing Fee" to define your first billing configuration.</p>
          </div>
        )}
      </div>
    </div>
  );
};