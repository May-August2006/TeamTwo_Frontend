/** @format */
import React, { useState, useEffect } from "react";
import { meterReadingApi } from "../../api/MeterReadingAPI";
import { utilityApi } from "../../api/UtilityAPI";
import type { MeterReading, MeterReadingRequest } from "../../types/billing";
import type { UtilityType } from "../../types/room";

interface Room {
  id: number;
  roomNumber: string;
}

export const UsageEntryPage: React.FC = () => {
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<MeterReadingRequest>({
    roomId: 0,
    utilityTypeId: 0,
    currentReading: 0,
    readingDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchMeterReadings();
    fetchUtilityTypes();
    // Fetch rooms from your existing API
    fetchRooms();
  }, []);

  const fetchMeterReadings = async () => {
    try {
      setLoading(true);
      const response = await meterReadingApi.getAll();
      setMeterReadings(response.data);
    } catch (error) {
      console.error("Error fetching meter readings:", error);
      alert("Failed to fetch meter readings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      // Replace with your actual rooms API endpoint
      const response = await fetch("http://localhost:8080/api/rooms");
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchUtilityTypes = async () => {
    try {
      const response = await utilityApi.getAll();
      setUtilityTypes(response.data);
    } catch (error) {
      console.error("Error fetching utility types:", error);
      alert("Failed to fetch utility types");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Get previous reading
      let previousReading = 0;
      try {
        const latestResponse = await meterReadingApi.getLatest(
          formData.roomId, 
          formData.utilityTypeId
        );
        if (latestResponse.data) {
          previousReading = latestResponse.data.currentReading;
        }
      } catch (error) {
        // No previous reading found, that's okay
        console.log("No previous reading found, starting from 0");
      }

      const readingData: MeterReadingRequest = {
        ...formData,
        previousReading: previousReading,
        consumption: formData.currentReading - previousReading
      };

      await meterReadingApi.create(readingData);
      
      setShowForm(false);
      setFormData({
        roomId: 0,
        utilityTypeId: 0,
        currentReading: 0,
        readingDate: new Date().toISOString().split('T')[0]
      });
      fetchMeterReadings();
      alert("Meter reading saved successfully!");
    } catch (error: any) {
      console.error("Error saving meter reading:", error);
      alert(error.response?.data?.message || "Failed to save meter reading");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-lg">Loading meter readings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meter Readings</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Meter Reading
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Meter Reading</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Room</label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.roomNumber}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Utility Type</label>
                <select
                  required
                  value={formData.utilityTypeId}
                  onChange={(e) => setFormData({ ...formData, utilityTypeId: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>Select Utility Type</option>
                  {utilityTypes.map(utility => (
                    <option key={utility.id} value={utility.id}>{utility.utilityName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Reading</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.currentReading}
                  onChange={(e) => setFormData({ ...formData, currentReading: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Reading Date</label>
                <input
                  type="date"
                  required
                  value={formData.readingDate}
                  onChange={(e) => setFormData({ ...formData, readingDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save"}
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
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utility Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous Reading
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Reading
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumption
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reading Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {meterReadings.map((reading) => (
              <tr key={reading.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {reading.roomNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reading.utilityName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reading.previousReading}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reading.currentReading}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reading.consumption}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(reading.readingDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meterReadings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No meter readings found
          </div>
        )}
      </div>
    </div>
  );
};