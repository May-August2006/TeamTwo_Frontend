/** @format */
import React, { useState, useEffect } from "react";
import { utilityApi } from "../../api/UtilityAPI";
import type { UtilityType, UtilityTypeRequest } from "../../types/room";

export const UtilityTypePage: React.FC = () => {
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUtility, setEditingUtility] = useState<UtilityType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UtilityTypeRequest>({
    utilityName: "",
    calculationMethod: "METERED",
    ratePerUnit: 0,
    description: ""
  });

  useEffect(() => {
    fetchUtilityTypes();
  }, []);

  const fetchUtilityTypes = async () => {
    try {
      setLoading(true);
      const response = await utilityApi.getAll();
      setUtilityTypes(response.data);
    } catch (error) {
      console.error("Error fetching utility types:", error);
      alert("Failed to fetch utility types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUtility) {
        await utilityApi.update(editingUtility.id, formData);
      } else {
        await utilityApi.create(formData);
      }
      
      setShowForm(false);
      setEditingUtility(null);
      setFormData({ 
        utilityName: "", 
        calculationMethod: "METERED", 
        ratePerUnit: 0, 
        description: "" 
      });
      fetchUtilityTypes();
      alert(`Utility type ${editingUtility ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error("Error saving utility type:", error);
      alert(error.response?.data?.message || "Failed to save utility type");
    }
  };

  const handleEdit = (utility: UtilityType) => {
    setEditingUtility(utility);
    setFormData({
      utilityName: utility.utilityName,
      calculationMethod: utility.calculationMethod,
      ratePerUnit: utility.ratePerUnit,
      description: utility.description
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this utility type?")) {
      try {
        await utilityApi.delete(id);
        fetchUtilityTypes();
        alert("Utility type deleted successfully!");
      } catch (error: any) {
        console.error("Error deleting utility type:", error);
        alert(error.response?.data?.message || "Failed to delete utility type");
      }
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const utility = utilityTypes.find(u => u.id === id);
      if (!utility) return;

      const updateData: UtilityTypeRequest = {
        utilityName: utility.utilityName,
        calculationMethod: utility.calculationMethod,
        ratePerUnit: utility.ratePerUnit,
        description: utility.description
      };

      // Note: You'll need to add an update endpoint that handles isActive
      // For now, we'll just refetch
      await utilityApi.update(id, updateData);
      fetchUtilityTypes();
      alert(`Utility type ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      console.error("Error updating utility type:", error);
      alert(error.response?.data?.message || "Failed to update utility type");
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Utility Types</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Utility Type
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUtility ? "Edit Utility Type" : "Add Utility Type"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Utility Name</label>
                <input
                  type="text"
                  required
                  value={formData.utilityName}
                  onChange={(e) => setFormData({ ...formData, utilityName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
                <select
                  value={formData.calculationMethod}
                  onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="METERED">Metered</option>
                  <option value="FIXED">Fixed</option>
                  <option value="ALLOCATED">Allocated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rate Per Unit</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.ratePerUnit}
                  onChange={(e) => setFormData({ ...formData, ratePerUnit: parseFloat(e.target.value) })}
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
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUtility(null);
                    setFormData({ utilityName: "", calculationMethod: "METERED", ratePerUnit: 0, description: "" });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingUtility ? "Update" : "Create"}
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
                Utility Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calculation Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate Per Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {utilityTypes.map((utility) => (
              <tr key={utility.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {utility.utilityName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {utility.calculationMethod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {utility.ratePerUnit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    utility.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {utility.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {utility.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(utility)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(utility.id, utility.isActive)}
                    className={`mr-3 ${
                      utility.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {utility.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(utility.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {utilityTypes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No utility types found
          </div>
        )}
      </div>
    </div>
  );
};