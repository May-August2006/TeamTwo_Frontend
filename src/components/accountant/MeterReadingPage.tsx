/** @format */

import React, { useState, useEffect } from "react";
import { 
  PlusCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MeterReading } from "../../types/meterReading";
import { meterReadingApi } from "../../api/MeterReadingAPI";
import { jwtDecode } from "jwt-decode";
import { buildingApi } from "../../api/BuildingAPI";
import type { Building } from "../../types";
import MeterReadingTable from "../../components/meter/MeterReadingTable";
import MeterReadingForm from "../../components/meter/MeterReadingForm";

const MeterReadingPage: React.FC = () => {
  const { t } = useTranslation();
  
  // State for meter readings
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for form
  const [showForm, setShowForm] = useState(false);
  const [selectedReading, setSelectedReading] = useState<MeterReading | undefined>();

  // User role and building restrictions
  const [assignedBuilding, setAssignedBuilding] = useState<Building | null>(null);
  const [userRole, setUserRole] = useState<string>("ROLE_GUEST");

  // Get user role from JWT token
  const getUserRole = (): string => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded.role || 'ROLE_GUEST';
      } catch (error) {
        console.error('Error decoding token:', error);
        return 'ROLE_GUEST';
      }
    }
    return 'ROLE_GUEST';
  };

  // Load assigned building for non-admin users
  const loadAssignedBuilding = async () => {
    const role = getUserRole();
    setUserRole(role);
    
    if (role !== 'ROLE_ADMIN') {
      try {
        const buildingResponse = await buildingApi.getMyAssignedBuilding();
        if (buildingResponse.data) {
          const building = buildingResponse.data;
          setAssignedBuilding(building);
          return building;
        } else {
          setError(t('meterReadingPage.buildingErrors.noBuildingAssigned'));
        }
      } catch (error) {
        console.error('Error loading assigned building:', error);
        setError(t('meterReadingPage.buildingErrors.failedToLoadBuilding'));
      }
    }
    
    return null;
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load user role and assigned building first
      await loadAssignedBuilding();

      // Load all meter readings
      const readingsData = await meterReadingApi.getAllMeterReadings();
      
      // Filter readings based on user role and assigned building
      let filtered = readingsData;
      
      if (userRole !== 'ROLE_ADMIN' && assignedBuilding) {
        try {
          const buildingUnitsResponse = await buildingApi.getOccupiedUnitsByBuilding(assignedBuilding.id);
          const buildingUnits = buildingUnitsResponse.data || [];
          const buildingUnitIds = buildingUnits.map((unit: any) => unit.id);
          
          filtered = readingsData.filter((reading: MeterReading) => 
            buildingUnitIds.includes(reading.unitId)
          );
        } catch (error) {
          console.error('Error filtering readings by building:', error);
        }
      }
      
      setReadings(filtered);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || t('meterReadingPage.loadingErrors.failedToLoadReadings'));
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle meter reading operations
  const handleSaveReading = async () => {
    setShowForm(false);
    setSelectedReading(undefined);
    await loadData();
    setSuccess(t('meterReadingPage.alerts.readingSaved'));
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteReading = async (id: number) => {
    if (window.confirm(t('meterReadingPage.alerts.deleteConfirm'))) {
      try {
        await meterReadingApi.deleteMeterReading(id);
        await loadData();
        setSuccess(t('meterReadingPage.alerts.readingDeleted'));
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || t('meterReadingPage.loadingErrors.failedToDeleteReading'));
      }
    }
  };

  // Statistics
  const getStatistics = () => {
    const total = readings.length;
    const electricity = readings.filter((r) =>
      r.utilityName?.toLowerCase().includes("electric")
    ).length;
    const water = readings.filter((r) =>
      r.utilityName?.toLowerCase().includes("water")
    ).length;
    
    // Get current month stats
    const now = new Date();
    const thisMonth = readings.filter((r) => {
      const date = new Date(r.readingDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    return { total, electricity, water, thisMonth };
  };

  const stats = getStatistics();

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('meterReadingPage.title')}
                {userRole !== 'ROLE_ADMIN' && (
                  <span className="text-sm font-normal text-blue-600 ml-2">
                    {t('meterReadingPage.adminSubtitle')}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('meterReadingPage.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
             
              <button
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium border border-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
                {t('meterReadingPage.buttons.refresh')}
              </button>
            </div>
          </div>

          {/* User info and building assignment */}
          <div className="mt-4">
            {userRole !== 'ROLE_ADMIN' && assignedBuilding && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('meterReadingPage.assignedBuilding.label')}</span>
                  <span>{assignedBuilding.buildingName}</span>
                </div>
                <p className="text-sm mt-1">{t('meterReadingPage.assignedBuilding.description')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Alerts */}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t('meterReadingPage.error')}</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t('meterReadingPage.statistics.totalReadings')}</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t('meterReadingPage.statistics.electricity')}</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.electricity}
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t('meterReadingPage.statistics.water')}</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.water}
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">{t('meterReadingPage.statistics.thisMonth')}</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.thisMonth}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {t('meterReadingPage.tableInfo.showingReadings', { count: readings.length })}
            </div>
            {readings.length > 0 && (
              <div className="text-sm text-gray-600">
                {t('meterReadingPage.tableInfo.lastUpdated', { time: new Date().toLocaleTimeString() })}
              </div>
            )}
          </div>

          {/* Meter Readings Table or Form */}
          {showForm ? (
            <MeterReadingForm
              reading={selectedReading}
              onSave={handleSaveReading}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <MeterReadingTable
              readings={readings}
              onEdit={(reading) => {
                setSelectedReading(reading);
                setShowForm(true);
              }}
              onDelete={handleDeleteReading}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MeterReadingPage;