/** @format */
import React, { useState, useEffect } from "react";
import { billingFeeApi } from "../../api/BillingFeeAPI";
import { utilityApi } from "../../api/UtilityAPI";
import type { BillingFee, BillingFeeRequest } from "../../types/billing";
import type { UtilityType } from "../../types/room";

const AdminBillingConfiguration: React.FC = () => {
  const [billingFees, setBillingFees] = useState<BillingFee[]>([]);
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<BillingFee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BillingFeeRequest>({
    feeName: "",
    utilityTypeId: 0,
    calculationBase: "FIXED",
    rate: 0,
    description: "",
    isActive: true
  });

  // Get selected utility type
  const selectedUtility = utilityTypes.find(u => u.id === formData.utilityTypeId);

  // Get available calculation bases based on utility type
  const getAvailableCalculationBases = (utilityMethod: string) => {
    switch(utilityMethod) {
      case 'FIXED':
        return [
          { value: 'FIXED', label: 'Fixed Amount (One-time charge)' },
          { value: 'PERCENTAGE', label: 'Percentage (Of total or other amount)' }
        ];
      case 'METERED':
        return [
          { value: 'PER_UNIT', label: 'Per Consumption Unit (kWh, gallons, etc.)' }
        ];
      case 'ALLOCATED':
        return [
          { value: 'PER_SQ_FT', label: 'Per Square Foot (Area-based allocation)' },
          { value: 'PER_UNIT', label: 'Per Unit (Per room or tenant)' },
          { value: 'PERCENTAGE', label: 'Percentage (Shared cost allocation)' }
        ];
      default:
        return [
          { value: 'FIXED', label: 'Fixed Amount' },
          { value: 'PER_SQ_FT', label: 'Per Square Foot' },
          { value: 'PER_UNIT', label: 'Per Unit' },
          { value: 'PERCENTAGE', label: 'Percentage' }
        ];
    }
  };

  const availableBases = selectedUtility ? 
    getAvailableCalculationBases(selectedUtility.calculationMethod) : 
    [
      { value: 'FIXED', label: 'Fixed Amount' },
      { value: 'PER_SQ_FT', label: 'Per Square Foot' },
      { value: 'PER_UNIT', label: 'Per Unit' },
      { value: 'PERCENTAGE', label: 'Percentage' }
    ];

  // Auto-set calculation base when utility type changes
  useEffect(() => {
    if (selectedUtility && !editingFee) {
      const bases = getAvailableCalculationBases(selectedUtility.calculationMethod);
      if (bases.length > 0 && !bases.some(b => b.value === formData.calculationBase)) {
        setFormData(prev => ({ ...prev, calculationBase: bases[0].value as any }));
      }
    }
  }, [formData.utilityTypeId, utilityTypes]);

  useEffect(() => {
    fetchBillingFees();
    fetchUtilityTypes();
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

  const fetchUtilityTypes = async () => {
    try {
      const response = await utilityApi.getActive();
      setUtilityTypes(response.data);
      // Set default utility type if available
      if (response.data.length > 0 && formData.utilityTypeId === 0) {
        setFormData(prev => ({ ...prev, utilityTypeId: response.data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching utility types:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.utilityTypeId === 0) {
      alert("Please select a utility type");
      return;
    }

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
        utilityTypeId: utilityTypes[0]?.id || 0, 
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
      utilityTypeId: fee.utilityTypeId,
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

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const fee = billingFees.find(f => f.id === id);
      if (!fee) return;

      const updateData: BillingFeeRequest = {
        feeName: fee.feeName,
        utilityTypeId: fee.utilityTypeId,
        calculationBase: fee.calculationBase,
        rate: fee.rate,
        description: fee.description,
        isActive: !currentStatus
      };

      await billingFeeApi.update(id, updateData);
      fetchBillingFees();
      alert(`Billing fee ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      console.error("Error updating billing fee:", error);
      alert(error.response?.data?.message || "Failed to update billing fee");
    }
  };

  const getCalculationBaseDescription = (base: string, rate: number) => {
    switch (base) {
      case 'FIXED': return `Fixed amount: ${rate}`;
      case 'PER_UNIT': return `Per unit: ${rate} per unit`;
      case 'PER_SQ_FT': return `Per sq ft: ${rate} per sq ft`;
      case 'PERCENTAGE': return `Percentage: ${rate}%`;
      default: return base;
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Configuration</h1>
          <p className="text-gray-600 mt-1">Manage billing fees and calculation formulas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Add Billing Fee
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingFee ? "Edit Billing Fee" : "Add Billing Fee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Name *</label>
                <input
                  type="text"
                  required
                  value={formData.feeName}
                  onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Electricity Charge, Water Fee"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Utility Type *</label>
                <select
                  required
                  value={formData.utilityTypeId}
                  onChange={(e) => setFormData({ ...formData, utilityTypeId: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>Select Utility Type</option>
                  {utilityTypes.map((utility) => (
                    <option key={utility.id} value={utility.id}>
                      {utility.utilityName}
                    </option>
                  ))}
                </select>
                {selectedUtility && (
                  <p className="text-xs text-green-600 mt-1">
                    {selectedUtility.utilityName} uses <strong>{selectedUtility.calculationMethod}</strong> method: {getCalculationMethodDescription(selectedUtility.calculationMethod)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Create utility types first in Utility Type Management
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Calculation Base *
                  {selectedUtility && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Available options for {selectedUtility.calculationMethod} method)
                    </span>
                  )}
                </label>
                <select
                  required
                  value={formData.calculationBase}
                  onChange={(e) => setFormData({ ...formData, calculationBase: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableBases.map((base) => (
                    <option key={base.value} value={base.value}>
                      {base.label}
                    </option>
                  ))}
                </select>
                {availableBases.length === 1 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Auto-selected for {selectedUtility?.calculationMethod} utility type
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rate * 
                  <span className="text-gray-500 text-sm ml-2">
                    {formData.calculationBase === 'PERCENTAGE' ? '(e.g., 0.02 for 2%)' : 
                     formData.calculationBase === 'PER_UNIT' ? '(per unit)' :
                     formData.calculationBase === 'PER_SQ_FT' ? '(per square foot)' : '(fixed amount)'}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
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
                  placeholder="Describe how this fee is calculated..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFee(null);
                    setFormData({ 
                      feeName: "", 
                      utilityTypeId: utilityTypes[0]?.id || 0, 
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

      {/* Rest of the component remains the same */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utility Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calculation Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
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
            {billingFees.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {fee.feeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {fee.utilityTypeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCalculationBaseDescription(fee.calculationBase, fee.rate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fee.rate}
                  {fee.calculationBase === 'PERCENTAGE' ? '%' : ''}
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
                <td className="px-6 py-4 text-sm text-gray-500">
                  {fee.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(fee)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(fee.id, fee.isActive)}
                    className={`mr-3 ${
                      fee.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {fee.isActive ? 'Deactivate' : 'Activate'}
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
        {billingFees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-lg">No billing fees configured</div>
            <p className="text-sm mt-1">Click "Add Billing Fee" to create your first billing configuration</p>
          </div>
        )}
      </div>

      {/* Updated Sample Configuration Guide */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How Utility Types & Billing Bases Work Together</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <strong>Electricity (METERED):</strong><br/>
            → <em>Auto-suggests: PER_UNIT</em><br/>
            Rate: 350 (350 per kWh unit)
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>Water (FIXED):</strong><br/>
            → <em>Available: FIXED, PERCENTAGE</em><br/>
            Rate: 5000 (Fixed 5000/month)
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>CAM (ALLOCATED):</strong><br/>
            → <em>Available: PER_SQ_FT, PER_UNIT, PERCENTAGE</em><br/>
            Rate: 1500 (1500 per sq ft)
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>Transformer (FIXED):</strong><br/>
            → <em>Available: FIXED, PERCENTAGE</em><br/>
            Rate: 0.02 (2% of electricity)
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBillingConfiguration;