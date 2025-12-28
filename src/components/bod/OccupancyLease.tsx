/** @format */

import React, { useEffect, useState } from "react";
import { Building2, Home, TrendingUp, Download, Loader2, Calendar } from "lucide-react";
import { dashboardApi, type BuildingOccupancyDTO, type OccupancySummary } from "../../api/dashboardApi";
import { useTranslation } from "react-i18next";

const OccupancyLease: React.FC = () => {
  const { t } = useTranslation();
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
      
      const errorMessage = err.response?.data?.message || err.message;
      setError(t('occupancyLease.error.failed', { message: errorMessage }));
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
        return t('occupancyLease.status.excellent');
      case 'GOOD':
        return t('occupancyLease.status.good');
      case 'NEEDS_ATTENTION':
        return t('occupancyLease.status.needsAttention');
      default:
        return t('occupancyLease.status.unknown');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">{t('occupancyLease.loading')}</span>
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
            {t('occupancyLease.error.retry')}
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('occupancyLease.summaryCards.totalUnits')}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalShops}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <Home className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-green-600">{totalOccupied}</span> {t('occupancyLease.summaryCards.occupied')} •{" "}
              <span className="font-bold text-gray-600">{totalVacant}</span> {t('occupancyLease.summaryCards.vacant')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('occupancyLease.summaryCards.overallOccupancyRate')}
              </p>
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
            <span className="text-sm text-gray-500 ml-2">
              {t('occupancyLease.summaryCards.industryAvg')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('occupancyLease.summaryCards.buildings')}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalBuildings}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border border-sky-200">
              <Building2 className="w-6 h-6 text-sky-700" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {t('occupancyLease.summaryCards.activeProperties')}
          </p>
        </div>
      </div>

      {/* Building Occupancy Table */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('occupancyLease.buildingTable.title')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('occupancyLease.buildingTable.subtitle')}
              </p>
            </div>
          </div>
        </div>
        
        {buildingData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('occupancyLease.buildingTable.noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.buildingName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.branch')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.totalUnits')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.unitsOccupied')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.unitsVacant')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.occupancyRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('occupancyLease.buildingTable.columns.status')}
                  </th>
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
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {t('occupancyLease.buildingTable.total')}
                  </td>
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
                      {overallOccupancyRate >= 95 
                        ? t('occupancyLease.status.excellent') 
                        : overallOccupancyRate >= 90 
                        ? t('occupancyLease.status.good') 
                        : t('occupancyLease.status.needsAttention')}
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
        {t('occupancyLease.dataUpdated', {
          date: new Date().toLocaleString('en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          })
        })}
      </div>
    </div>
  );
};

export default OccupancyLease;