import React, { useState, useEffect } from 'react';
import type { MeterReading } from '../../types/meterReading';
import { meterReadingApi } from '../../api/MeterReadingAPI';
import MeterReadingTable from '../../components/meter/MeterReadingTable';
import MeterReadingForm from '../../components/meter/MeterReadingForm';

const UsageEntryPage: React.FC = () => {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [selectedReading, setSelectedReading] = useState<MeterReading | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMeterReadings();
  }, []);

  const loadMeterReadings = async () => {
    try {
      setLoading(true);
      const data = await meterReadingApi.getAllMeterReadings();
      setReadings(data);
      setError('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load meter readings';
      setError(errorMessage);
      console.error('Error loading meter readings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedReading(undefined);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (reading: MeterReading) => {
    setSelectedReading(reading);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this meter reading? This action cannot be undone.')) {
      try {
        await meterReadingApi.deleteMeterReading(id);
        setSuccess('Meter reading deleted successfully');
        await loadMeterReadings();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete meter reading';
        setError(errorMessage);
        console.error('Error deleting meter reading:', err);
      }
    }
  };

  const handleSave = async () => {
    setShowForm(false);
    setSelectedReading(undefined);
    setSuccess(selectedReading ? 'Meter reading updated successfully' : 'Meter reading created successfully');
    await loadMeterReadings();
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedReading(undefined);
    setError('');
  };

  const getElectricityReadingsCount = () => {
    return readings.filter(r => 
      r.utilityName?.toLowerCase().includes('electric') || 
      r.utilityName?.toLowerCase().includes('power')
    ).length;
  };

  const getWaterReadingsCount = () => {
    return readings.filter(r => 
      r.utilityName?.toLowerCase().includes('water')
    ).length;
  };

  const getThisMonthReadingsCount = () => {
    const now = new Date();
    return readings.filter(r => {
      const readingDate = new Date(r.readingDate);
      return readingDate.getMonth() === now.getMonth() && 
             readingDate.getFullYear() === now.getFullYear();
    }).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meter Readings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage electricity and water meter readings for all rooms
              </p>
            </div>
            {!showForm && (
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add New Reading
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {!showForm && readings.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm font-medium text-gray-500">Total Readings</div>
              <div className="text-2xl font-bold text-gray-900">{readings.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm font-medium text-gray-500">Electricity Readings</div>
              <div className="text-2xl font-bold text-blue-600">
                {getElectricityReadingsCount()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm font-medium text-gray-500">Water Readings</div>
              <div className="text-2xl font-bold text-blue-600">
                {getWaterReadingsCount()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm font-medium text-gray-500">This Month</div>
              <div className="text-2xl font-bold text-green-600">
                {getThisMonthReadingsCount()}
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {showForm ? (
            <MeterReadingForm
              reading={selectedReading}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <MeterReadingTable
              readings={readings}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          )}
        </div>

        
      </div>
    </div>
  );
};

export default UsageEntryPage;