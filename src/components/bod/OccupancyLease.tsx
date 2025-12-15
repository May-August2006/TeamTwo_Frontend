/** @format */

import React, { useEffect, useState } from "react";
import { Building2, Home, TrendingUp, Download, Loader2, Calendar } from "lucide-react";
import { dashboardApi, type BuildingOccupancyDTO, type OccupancySummary } from "../../api/dashboardApi";

const OccupancyLease: React.FC = () => {
  const [occupancyData, setOccupancyData] = useState<OccupancySummary | null>(null);
  const [buildingData, setBuildingData] = useState<BuildingOccupancyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOccupancyData();
  }, []);

const fetchOccupancyData = async () => {
  try {
    setLoading(true);
    console.log('Fetching occupancy data...');
    
    const [summary, buildings] = await Promise.all([
      dashboardApi.getOccupancySummary(),
      dashboardApi.getBuildingOccupancyStats()
    ]);
    
    console.log('Occupancy data fetched:', { summary, buildings });
    setOccupancyData(summary);
    setBuildingData(buildings);
  } catch (err: any) {
    console.error('Detailed error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers
    });
    
    setError(`Failed to load occupancy data: ${err.response?.data?.message || err.message}`);
  } finally {
    setLoading(false);
  }
};

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "0%";
    return `${value.toFixed(1)}%`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800';
      case 'GOOD':
        return 'bg-amber-100 text-amber-800';
      case 'NEEDS_ATTENTION':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'Excellent';
      case 'GOOD':
        return 'Good';
      case 'NEEDS_ATTENTION':
        return 'Needs Attention';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">Loading occupancy data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">{error}</div>
          <button
            onClick={fetchOccupancyData}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalShops = occupancyData?.totalUnits || 0;
  const totalOccupied = occupancyData?.occupiedUnits || 0;
  const totalVacant = occupancyData?.vacantUnits || 0;
  const overallOccupancyRate = occupancyData?.overallOccupancyRate || 0;
  const totalBuildings = occupancyData?.totalBuildings || buildingData.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
     

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalShops}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <Home className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-green-600">{totalOccupied}</span> occupied •{" "}
              <span className="font-bold text-gray-600">{totalVacant}</span> vacant
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatPercentage(overallOccupancyRate)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <TrendingUp className="w-6 h-6 text-indigo-700" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" 
                style={{ width: `${overallOccupancyRate}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Industry avg: 88%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Buildings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalBuildings}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border border-sky-200">
              <Building2 className="w-6 h-6 text-sky-700" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Active properties in portfolio</p>
        </div>
      </div>

      {/* Building Occupancy Table */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Building Occupancy Details</h3>
              <p className="text-sm text-gray-600 mt-1">Performance across all properties</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200 text-sm flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
        
        {buildingData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No building data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Building Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Units</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Units Occupied</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Units Vacant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Occupancy Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buildingData.map((building, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3">
                          <Building2 className="w-4 h-4 text-blue-700" />
                        </div>
                        <span className="font-medium text-gray-900">{building.buildingName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{building.branchName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{building.totalUnits}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-bold text-green-600 mr-2">{building.occupiedUnits}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-700" 
                            style={{ width: `${(building.occupiedUnits / building.totalUnits) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-600">{building.vacantUnits}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-bold text-blue-700 mr-2">
                          {formatPercentage(building.occupancyRate)}
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" 
                            style={{ width: `${building.occupancyRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(building.status)}`}>
                        {getStatusText(building.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
                  <td className="px-6 py-4 font-bold text-gray-900">-</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{totalShops}</td>
                  <td className="px-6 py-4 font-bold text-green-600">{totalOccupied}</td>
                  <td className="px-6 py-4 font-bold text-gray-600">{totalVacant}</td>
                  <td className="px-6 py-4 font-bold text-blue-700">
                    {formatPercentage(overallOccupancyRate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      overallOccupancyRate >= 95 
                        ? 'bg-green-100 text-green-800' 
                        : overallOccupancyRate >= 90 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {overallOccupancyRate >= 95 ? 'Excellent' : overallOccupancyRate >= 90 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Data Last Updated */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <Calendar className="w-4 h-4 inline mr-2" />
        Data last updated: {new Date().toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })}
      </div>
    </div>
  );
};

export default OccupancyLease;