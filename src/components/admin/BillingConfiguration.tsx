/** @format */

import React, { useState } from "react";

const BillingConfiguration: React.FC = () => {
  const [formData, setFormData] = useState({
    rentMethod: "Fixed Monthly",
    utilityMethod: "Based on Meter Reading",
    paymentDueDate: 1,
    lateFeePolicy: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "paymentDueDate" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Billing configuration saved:", formData);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Billing Configuration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rent Calculation Method
            </label>
            <select
              name="rentMethod"
              value={formData.rentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Fixed Monthly">Fixed Monthly</option>
              <option value="Per Square Foot">Per Square Foot</option>
              <option value="Percentage of Sales">Percentage of Sales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utility Calculation Method
            </label>
            <select
              name="utilityMethod"
              value={formData.utilityMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Based on Meter Reading">
                Based on Meter Reading
              </option>
              <option value="Fixed Amount">Fixed Amount</option>
              <option value="Shared Cost">Shared Cost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Payment Due Date
            </label>
            <input
              type="number"
              name="paymentDueDate"
              value={formData.paymentDueDate}
              onChange={handleChange}
              min="1"
              max="31"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1 for 1st of the month"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Late Fee Policy
            </label>
            <textarea
              name="lateFeePolicy"
              value={formData.lateFeePolicy}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter late fee policy details..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingConfiguration;
