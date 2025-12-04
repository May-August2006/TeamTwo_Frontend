// UsageEntryPage.tsx - Updated Version
import React, { useState, useEffect } from 'react';
import type { MeterReading } from '../../types/meterReading';
import type { UtilityBillingDTO, UtilityBillRequest } from '../../types/utility';
import type { Unit } from '../../types/unit';
import type { InvoiceDTO } from '../../types';
import { meterReadingApi } from '../../api/MeterReadingAPI';
import { utilityApi } from '../../api/UtilityAPI';
import { unitService } from '../../api/MeterReadingAPI';
import { invoiceApi } from '../../api/InvoiceAPI';
import MeterReadingTable from '../../components/meter/MeterReadingTable';
import MeterReadingForm from '../../components/meter/MeterReadingForm';

const UsageEntryPage: React.FC = () => {
  // State for meter readings
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedReading, setSelectedReading] = useState<MeterReading | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for utility billing
  const [calculating, setCalculating] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [utilityBilling, setUtilityBilling] = useState<UtilityBillingDTO | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadData();
    
    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const due = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
    setDueDate(due.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [readingsData, unitsData] = await Promise.all([
        meterReadingApi.getAllMeterReadings(),
        unitService.getAllUnits()
      ]);
      setReadings(readingsData);
      setUnits(unitsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate all utility fees
  const calculateUtilityFees = async () => {
    if (!selectedUnit) {
      setError('Please select a unit');
      return;
    }

    if (!periodStart || !periodEnd) {
      setError('Please select a billing period');
      return;
    }

    try {
      setCalculating(true);
      setError('');
      
      const billing = await utilityApi.calculateUtilityBill(
        selectedUnit.id,
        periodStart,
        periodEnd
      );
      
      setUtilityBilling(billing);
      setShowBilling(true);
      setSuccess('All utility fees calculated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate utility fees');
    } finally {
      setCalculating(false);
    }
  };

  // Generate utility bill/invoice
  const generateUtilityBill = async () => {
    if (!utilityBilling || !dueDate) {
      setError('Missing required information');
      return;
    }

    try {
      setGeneratingBill(true);
      setError('');
      
      const request: UtilityBillRequest = {
        unitId: utilityBilling.unitId,
        periodStart: utilityBilling.periodStart,
        periodEnd: utilityBilling.periodEnd,
        dueDate,
        notes
      };

      const invoice = await utilityApi.generateUtilityBill(request);
      
      setSuccess(`Utility bill created! Invoice #${invoice.invoiceNumber}`);
      
      // Reset and refresh
      setTimeout(() => {
        setUtilityBilling(null);
        setShowBilling(false);
        setNotes('');
        loadData(); // Refresh readings
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate utility bill');
    } finally {
      setGeneratingBill(false);
    }
  };

  const closeBilling = () => {
    setUtilityBilling(null);
    setShowBilling(false);
  };

  // Handle meter reading operations
  const handleSaveReading = async () => {
    setShowForm(false);
    setSelectedReading(undefined);
    await loadData();
    setSuccess('Meter reading saved successfully');
  };

  const handleDeleteReading = async (id: number) => {
    if (window.confirm('Delete this meter reading?')) {
      try {
        await meterReadingApi.deleteMeterReading(id);
        await loadData();
        setSuccess('Meter reading deleted');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete reading');
      }
    }
  };

  // Statistics
  const getStatistics = () => {
    const electricity = readings.filter(r => 
      r.utilityName?.toLowerCase().includes('electric')
    ).length;
    
    const water = readings.filter(r => 
      r.utilityName?.toLowerCase().includes('water')
    ).length;
    
    const now = new Date();
    const thisMonth = readings.filter(r => {
      const date = new Date(r.readingDate);
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }).length;
    
    return { total: readings.length, electricity, water, thisMonth };
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Utility Billing Management</h1>
          <p className="text-gray-600 mt-2">Manage meter readings and generate utility bills</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Readings</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Electricity</div>
            <div className="text-2xl font-bold text-blue-600">{stats.electricity}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Water</div>
            <div className="text-2xl font-bold text-blue-600">{stats.water}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">This Month</div>
            <div className="text-2xl font-bold text-green-600">{stats.thisMonth}</div>
          </div>
        </div>

        {/* Utility Billing Calculator */}
        {!showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">Generate Utility Bill</h2>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Meter Reading
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Unit *
                </label>
                <select
                  value={selectedUnit?.id || ''}
                  onChange={(e) => {
                    const unit = units.find(u => u.id === Number(e.target.value));
                    setSelectedUnit(unit || null);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select unit...</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber} - {unit.unitType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start *
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End *
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {selectedUnit && (
              <div className="mb-6 p-4 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800 mb-2">Selected Unit Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-600">Unit:</span> {selectedUnit.unitNumber}</div>
                  <div><span className="text-gray-600">Type:</span> {selectedUnit.unitType}</div>
                  <div><span className="text-gray-600">Space:</span> {selectedUnit.unitSpace} sqm</div>
                  <div><span className="text-gray-600">Rent:</span> ${selectedUnit.rentalFee}</div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={calculateUtilityFees}
                disabled={calculating || !selectedUnit || !periodStart || !periodEnd}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {calculating ? 'Calculating...' : 'Calculate All Utility Fees'}
              </button>
            </div>
          </div>
        )}

        {/* Billing Results */}
        {showBilling && utilityBilling && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Utility Bill Calculation</h2>
              <div className="flex space-x-2">
                <button
                  onClick={closeBilling}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateUtilityBill}
                  disabled={generatingBill}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {generatingBill ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Unit</div>
                  <div className="font-medium">{utilityBilling.unitNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Billing Period</div>
                  <div className="font-medium">
                    {utilityBilling.periodStart} to {utilityBilling.periodEnd}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Due Date</div>
                  <div className="font-medium">{dueDate}</div>
                </div>
              </div>
              
              {utilityBilling.tenantName && (
                <div className="text-sm">
                  <span className="text-gray-600">Tenant:</span> {utilityBilling.tenantName}
                </div>
              )}
            </div>

            {/* Utility Fees Table */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utility</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {utilityBilling.utilityFees.map((fee, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{fee.utilityName}</div>
                        <div className="text-xs text-gray-500">{fee.calculationFormula}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          fee.calculationMethod === 'FIXED' ? 'bg-blue-100 text-blue-800' :
                          fee.calculationMethod === 'METERED' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {fee.calculationMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        ${fee.ratePerUnit?.toFixed(4) || '0.0000'}
                      </td>
                      <td className="px-4 py-3">
                        {fee.quantity?.toFixed(2) || '-'} {fee.unit || ''}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${fee.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t pt-6">
              <div className="max-w-md ml-auto space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${utilityBilling.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%):</span>
                  <span>${utilityBilling.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-green-600">${utilityBilling.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Add any notes for this bill..."
              />
            </div>
          </div>
        )}

        {/* Meter Readings Table or Form */}
        {showForm ? (
          <MeterReadingForm
            reading={selectedReading}
            onSave={handleSaveReading}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Meter Readings</h2>
            </div>
            <MeterReadingTable
              readings={readings}
              onEdit={(reading) => {
                setSelectedReading(reading);
                setShowForm(true);
              }}
              onDelete={handleDeleteReading}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageEntryPage;