/** @format */
import React, { useState, useEffect } from "react";
import { billingFeeApi } from "../../api/BillingFeeAPI";
import { utilityApi } from "../../api/UtilityAPI";
import type { BillingFee, BillingFeeRequest } from "../../types/billing";
import type { UtilityType } from "../../types/room";

// Custom Modal Component for Confirmation and Alerts
const CustomMessageModal: React.FC<{
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  type: 'confirm' | 'alert' | 'success';
}> = ({ message, onClose, onConfirm, type }) => {
  if (!message) return null;

  const getColors = () => {
    switch (type) {
      case 'confirm':
        return { header: 'text-stone-900', border: 'border-stone-400' }; 
      case 'alert':
        return { header: 'text-red-700', border: 'border-red-600' };
      case 'success':
        return { header: 'text-green-700', border: 'border-green-600' };
      default:
        return { header: 'text-stone-900', border: 'border-stone-400' };
    }
  };

  const { header, border } = getColors();

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-[99]">
      <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm ${border} border-t-8`}>
        <h3 className={`text-xl font-bold mb-4 ${header}`}>
          {type === 'confirm' ? 'Confirm Action' : type === 'success' ? 'Success' : 'Attention'}
        </h3>
        <p className="text-stone-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition duration-150 bg-red-600 hover:bg-red-700`}
          >
            {type === 'confirm' ? 'Continue' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // Custom message/confirmation state
  const [message, setMessage] = useState<{
    text: string;
    type: 'confirm' | 'alert' | 'success';
    onConfirm?: () => void;
  } | null>(null);

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
      setMessage({ type: 'alert', text: "Failed to fetch billing fees" });
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

  const resetFormAndClose = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.utilityTypeId === 0) {
      setMessage({ type: 'alert', text: "Please select a utility type" });
      return;
    }

    try {
      if (editingFee) {
        await billingFeeApi.update(editingFee.id, formData);
      } else {
        await billingFeeApi.create(formData);
      }
      
      resetFormAndClose();
      fetchBillingFees();
      setMessage({ type: 'success', text: `Billing fee ${editingFee ? 'updated' : 'created'} successfully!` });
    } catch (error: any) {
      console.error("Error saving billing fee:", error);
      const errorMessage = error.response?.data?.message || "Failed to save billing fee";
      setMessage({ type: 'alert', text: errorMessage });
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

  const executeDelete = async (id: number) => {
    try {
      await billingFeeApi.delete(id);
      fetchBillingFees();
      setMessage({ type: 'success', text: "Billing fee deleted successfully!" });
    } catch (error: any) {
      console.error("Error deleting billing fee:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete billing fee";
      setMessage({ type: 'alert', text: errorMessage });
    }
  };

  const handleDelete = (id: number) => {
    setMessage({
      type: 'confirm',
      text: "Are you sure you want to delete this billing fee? This action cannot be undone.",
      onConfirm: () => executeDelete(id)
    });
  };

  const executeToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const fee = billingFees.find(f => f.id === id);
      if (!fee) {
        setMessage({ type: 'alert', text: "Fee not found." });
        return;
      }

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
      setMessage({ type: 'success', text: `Billing fee ${currentStatus ? 'deactivated' : 'activated'} successfully!` });
    } catch (error: any) {
      console.error("Error updating billing fee:", error);
      const errorMessage = error.response?.data?.message || "Failed to update billing fee";
      setMessage({ type: 'alert', text: errorMessage });
    }
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    setMessage({
      type: 'confirm',
      text: `Are you sure you want to ${action} this billing fee?`,
      onConfirm: () => executeToggleActive(id, currentStatus)
    });
  };

  const getCalculationBaseDescription = (base: string, rate: number) => {
    switch (base) {
      case 'FIXED': return `Fixed: $${rate.toFixed(2)}`;
      case 'PER_UNIT': return `Per unit: $${rate.toFixed(4)}`;
      case 'PER_SQ_FT': return `Per sq ft: $${rate.toFixed(4)}`;
      case 'PERCENTAGE': return `Percentage: ${(rate * 100).toFixed(2)}%`;
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
      <div className="p-6 flex justify-center items-center min-h-screen bg-stone-50">
        <div className="text-xl font-medium text-stone-700 animate-pulse">Loading Billing Configuration...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      
      {/* Custom Message Modal */}
      {message && (
        <CustomMessageModal
          message={message.text}
          type={message.type}
          onConfirm={message.onConfirm}
          onClose={() => setMessage(null)}
        />
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Billing Fee Management</h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">Configure standard and utility-based fees applied to tenant billing cycles.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Add New Fee
        </button>
      </div>

      {/* Fee Creation/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-stone-900 border-b border-stone-200 pb-2">
              {editingFee ? "Edit Billing Fee" : "Add New Billing Fee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Fee Name *</label>
                <input
                  type="text"
                  required
                  value={formData.feeName}
                  onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
                  placeholder="e.g., Electric Rate, Late Fee"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Utility Type *</label>
                <select
                  required
                  value={formData.utilityTypeId}
                  onChange={(e) => setFormData({ ...formData, utilityTypeId: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 bg-white shadow-sm"
                >
                  <option value={0} disabled>Select Utility Type</option>
                  {utilityTypes.map((utility) => (
                    <option key={utility.id} value={utility.id}>
                      {utility.utilityName} ({utility.calculationMethod})
                    </option>
                  ))}
                </select>
                {selectedUtility && (
                  <p className="text-xs text-red-700 mt-1 font-medium">
                    Utility method: <strong>{selectedUtility.calculationMethod}</strong>
                  </p>
                )}
                {utilityTypes.length === 0 && (
                    <p className="text-xs text-stone-500 mt-1">
                      No utility types available. Please create them first.
                    </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Calculation Base *
                  {selectedUtility && (
                    <span className="text-xs text-stone-500 ml-2">
                      (Options refined by {selectedUtility.calculationMethod})
                    </span>
                  )}
                </label>
                <select
                  required
                  value={formData.calculationBase}
                  onChange={(e) => setFormData({ ...formData, calculationBase: e.target.value as any })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 bg-white shadow-sm"
                >
                  {availableBases.map((base) => (
                    <option key={base.value} value={base.value}>
                      {base.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Rate * <span className="text-stone-500 text-xs ml-2">
                    {formData.calculationBase === 'PERCENTAGE' ? '(e.g., 0.02 for 2%)' : 
                      formData.calculationBase === 'PER_UNIT' ? '(Per unit cost)' :
                      formData.calculationBase === 'PER_SQ_FT' ? '(Per square foot cost)' : '(Fixed amount)'}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
                  min={0}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base transition duration-150 shadow-sm"
                  placeholder="Explain how this fee is calculated or applied..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-stone-300 rounded transition duration-150 shadow-sm"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-stone-900 font-medium">
                  Fee is Active
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={resetFormAndClose}
                  className="px-6 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-150 font-medium text-sm sm:text-base shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition duration-150 font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transform active:scale-95"
                >
                  {editingFee ? "Update Fee" : "Create Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responsive Table */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-stone-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Fee Name & Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden sm:table-cell">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Calculation Base
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden md:table-cell">
                  Raw Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider hidden lg:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {billingFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-red-50/50 transition duration-100">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    <div className="font-semibold">{fee.feeName}</div>
                    <div className="text-stone-500 text-xs mt-0.5">{fee.utilityTypeName}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-600 hidden sm:table-cell">
                    <span className="bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {fee.calculationBase.split('_')[0]}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-700">
                    <div className="font-medium text-sm">
                      {getCalculationBaseDescription(fee.calculationBase, fee.rate)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-500 hidden md:table-cell">
                    {fee.rate.toFixed(4)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full transition duration-150 ${
                      fee.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {fee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-stone-500 hidden lg:table-cell">
                    <div className="truncate max-w-xs" title={fee.description || 'No description provided.'}>
                      {fee.description || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleEdit(fee)}
                        className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(fee.id, fee.isActive)}
                        className={`text-xs sm:text-sm font-medium ${
                          fee.isActive ? 'text-stone-600 hover:text-stone-900' : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {fee.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(fee.id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
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
        {billingFees.length === 0 && (
          <div className="text-center py-16 text-stone-500 bg-stone-50 rounded-b-xl">
            <div className="text-5xl mb-3">🛠️</div>
            <div className="text-xl font-semibold text-stone-700">No Billing Fees Found</div>
            <p className="text-sm mt-1">Start by clicking "Add New Fee" to define your first billing configuration.</p>
          </div>
        )}
      </div>

      {/* Thematic Configuration Guide */}
      <div className="mt-8 bg-stone-200 border border-stone-300 rounded-xl p-5 sm:p-6 shadow-inner">
        <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-300 pb-2">Configuration Guide: Utility Type vs. Fee Base</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
            <strong className="text-red-700">METERED Utility (e.g., Electricity)</strong><br/>
            <p className="mt-1 text-stone-700">Fees tied to METERED utilities typically must use <code className="bg-stone-100 px-1 rounded">PER_UNIT</code> to correctly calculate consumption charges.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
            <strong className="text-red-700">FIXED Utility (e.g., Water, Internet)</strong><br/>
            <p className="mt-1 text-stone-700">Fees can be <code className="bg-stone-100 px-1 rounded">FIXED</code> ($50/mo) or <code className="bg-stone-100 px-1 rounded">PERCENTAGE</code> (5% of rent) based on how the utility bill is structured.</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
            <strong className="text-red-700">ALLOCATED Utility (e.g., CAM, Trash)</strong><br/>
            <p className="mt-1 text-stone-700">Fees can be split via <code className="bg-stone-100 px-1 rounded">PER_SQ_FT</code>, <code className="bg-stone-100 px-1 rounded">PER_UNIT</code> (per tenant/room), or <code className="bg-stone-100 px-1 rounded">PERCENTAGE</code> of total shared cost.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
            <strong className="text-red-700">Rate Format</strong><br/>
            <p className="mt-1 text-stone-700">Rates are always monetary. For <code className="bg-stone-100 px-1 rounded">PERCENTAGE</code>, use decimals (e.g., 0.03 for 3%).</p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AdminBillingConfiguration;