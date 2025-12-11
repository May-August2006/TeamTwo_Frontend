/** @format */

import React from "react";
import { Building2, Home, TrendingUp, Download } from "lucide-react";

const OccupancyLease: React.FC = () => {
  const buildingsData = [
    { building: "Main Mall", totalUnits: 50, occupied: 48, vacant: 2, occupancyRate: 96 },
    { building: "Business Tower", totalUnits: 40, occupied: 38, vacant: 2, occupancyRate: 95 },
    { building: "Plaza Center", totalUnits: 35, occupied: 33, vacant: 2, occupancyRate: 94.3 },
    { building: "Garden Complex", totalUnits: 30, occupied: 28, vacant: 2, occupancyRate: 93.3 },
    { building: "Sky Lounge", totalUnits: 25, occupied: 22, vacant: 3, occupancyRate: 88 },
  ];

  const totalShops = buildingsData.reduce((sum, b) => sum + b.totalUnits, 0);
  const totalOccupied = buildingsData.reduce((sum, b) => sum + b.occupied, 0);
  const totalVacant = buildingsData.reduce((sum, b) => sum + b.vacant, 0);
  const overallOccupancyRate = ((totalOccupied / totalShops) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-700">
        <h2 className="text-2xl font-bold mb-2">Occupancy & Lease Reviews</h2>
        <p className="text-blue-100">
          Building-wise occupancy statistics and lease performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shops</p>
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
              <p className="text-3xl font-bold text-gray-900 mt-1">{overallOccupancyRate}%</p>
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
              <p className="text-3xl font-bold text-gray-900 mt-1">{buildingsData.length}</p>
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
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Building Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Units</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Units Occupied</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Units Vacant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Occupancy Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buildingsData.map((building, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-blue-700" />
                      </div>
                      <span className="font-medium text-gray-900">{building.building}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-900">{building.totalUnits}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-bold text-green-600 mr-2">{building.occupied}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-700" 
                          style={{ width: `${(building.occupied / building.totalUnits) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-600">{building.vacant}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-bold text-blue-700 mr-2">{building.occupancyRate}%</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" 
                          style={{ width: `${building.occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      building.occupancyRate >= 95 
                        ? 'bg-green-100 text-green-800' 
                        : building.occupancyRate >= 90 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {building.occupancyRate >= 95 ? 'Excellent' : building.occupancyRate >= 90 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
                <td className="px-6 py-4 font-bold text-gray-900">{totalShops}</td>
                <td className="px-6 py-4 font-bold text-green-600">{totalOccupied}</td>
                <td className="px-6 py-4 font-bold text-gray-600">{totalVacant}</td>
                <td className="px-6 py-4 font-bold text-blue-700">{overallOccupancyRate}%</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    parseFloat(overallOccupancyRate) >= 95 
                      ? 'bg-green-100 text-green-800' 
                      : parseFloat(overallOccupancyRate) >= 90 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {parseFloat(overallOccupancyRate) >= 95 ? 'Excellent' : parseFloat(overallOccupancyRate) >= 90 ? 'Good' : 'Needs Attention'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OccupancyLease;