/** @format */
import React, { useState, useEffect } from "react";
import { utilityApi } from "../../api/UtilityAPI";
import type { UtilityType, UtilityTypeRequest } from "../../types/room";

const UtilityTypeManagement: React.FC = () => {
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUtility, setEditingUtility] = useState<UtilityType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UtilityTypeRequest>({
    utilityName: "",
    calculationMethod: "FIXED",
    ratePerUnit: 0,
    description: "",
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
        calculationMethod: "FIXED", 
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
      calculationMethod: utility.calculationMethod || "FIXED",
      ratePerUnit: utility.ratePerUnit || 0,
      description: utility.description || ""
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
        calculationMethod: utility.calculationMethod || "FIXED",
        ratePerUnit: utility.ratePerUnit || 0,
        description: utility.description || ""
      };

      await utilityApi.update(id, updateData);
      fetchUtilityTypes();
      alert(`Utility type ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      console.error("Error updating utility type:", error);
      alert(error.response?.data?.message || "Failed to update utility type");
    }
  };

  const getCalculationMethodDescription = (method: string) => {
    switch (method) {
      case 'FIXED': return 'Fixed rate per billing period';
      case 'METERED': return 'Based on actual consumption (meter reading)';
      case 'ALLOCATED': return 'Allocated based on usage or area';
      default: return method;
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Utility Type Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage utility types and calculation methods</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <span>+</span>
          Add Utility Type
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {editingUtility ? "Edit Utility Type" : "Add Utility Type"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Utility Name *</label>
                <input
                  type="text"
                  required
                  value={formData.utilityName}
                  onChange={(e) => setFormData({ ...formData, utilityName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                  placeholder="e.g., Electricity, Water, CAM"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Calculation Method *</label>
                <select
                  required
                  value={formData.calculationMethod}
                  onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                >
                  <option value="FIXED">Fixed Rate</option>
                  <option value="METERED">Metered (Consumption-based)</option>
                  <option value="ALLOCATED">Allocated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rate Per Unit
                  <span className="text-gray-500 text-sm ml-2">
                    (base rate for calculations)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.ratePerUnit}
                  onChange={(e) => setFormData({ ...formData, ratePerUnit: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                  placeholder="Describe this utility type and how it should be calculated..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUtility(null);
                    setFormData({ 
                      utilityName: "", 
                      calculationMethod: "FIXED", 
                      ratePerUnit: 0, 
                      description: "" 
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm sm:text-base"
                >
                  {editingUtility ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responsive Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utility Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Calculation Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utilityTypes.map((utility) => (
                <tr key={utility.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>
                      <div className="font-medium">{utility.utilityName}</div>
                      <div className="text-gray-500 text-xs sm:hidden">
                        {getCalculationMethodDescription(utility.calculationMethod || "FIXED")}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {getCalculationMethodDescription(utility.calculationMethod || "FIXED")}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {utility.ratePerUnit || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      utility.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {utility.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                    <div className="truncate max-w-xs">
                      {utility.description || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(utility)}
                        className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(utility.id, utility.isActive)}
                        className={`text-xs sm:text-sm ${
                          utility.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {utility.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(utility.id)}
                        className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {utilityTypes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-lg">No utility types configured</div>
            <p className="text-sm mt-1">Click "Add Utility Type" to create your first utility configuration</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UtilityTypeManagement;